import crypto from 'crypto';
import { prisma } from '@/lib/db/prisma';
import { meetingConciergeService } from './service';
import { createNotification } from '@/lib/notifications';

export const CALENDLY_WEBHOOK_TOLERANCE_MINUTES = 5;

export function verifyCalendlySignature(
  payload: string,
  signatureHeader: string,
  secret: string
): boolean {
  if (!signatureHeader) return false;
  
  const [tPart, v1Part] = signatureHeader.split(',');
  if (!tPart || !v1Part) return false;

  const t = tPart.split('=')[1];
  const v1 = v1Part.split('=')[1];
  if (!t || !v1) return false;

  // Replay protection
  const timestamp = parseInt(t, 10);
  const now = Date.now();
  if (isNaN(timestamp)) return false;
  
  // Calendly signature timestamp is in milliseconds
  // Wait, Calendly docs say timestamp `t` is Unix timestamp (which can be seconds or milliseconds).
  // Actually, standard Calendly webhook timestamp is in milliseconds. 
  // Let's assume it's in milliseconds if length >= 13, else seconds.
  const tMs = t.length >= 13 ? timestamp : timestamp * 1000;
  if (Math.abs(now - tMs) > CALENDLY_WEBHOOK_TOLERANCE_MINUTES * 60 * 1000) {
    return false; // Replay attack or expired
  }

  const dataToSign = `${t}.${payload}`;
  const computedSignature = crypto
    .createHmac('sha256', secret)
    .update(dataToSign)
    .digest('hex');

  const computedBuffer = Buffer.from(computedSignature);
  const v1Buffer = Buffer.from(v1);

  if (computedBuffer.length !== v1Buffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(computedBuffer, v1Buffer);
}

export async function processCalendlyWebhook(event: any) {
  const { event: eventType, payload } = event;
  
  if (!payload) throw new Error('Missing payload');

  const {
    email,
    name,
    uri: inviteeUri,
    event: eventUri,
    rescheduled,
    status
  } = payload;

  // Find matching booking
  let meetingBooking = await prisma.meetingBooking.findFirst({
    where: {
      OR: [
        { calendlyInviteeUri: inviteeUri },
        { recipientEmail: email, status: { in: ['AWAITING_BOOKING', 'RETRY_DUE', 'RETRYING', 'SMS_SENT', 'SMS_DELIVERED'] } }
      ]
    },
    orderBy: { createdAt: 'desc' }
  });

  if (!meetingBooking && email) {
    // Try to find by lead email
    const lead = await prisma.lead.findFirst({
      where: { email },
      include: { meetingBookings: { orderBy: { createdAt: 'desc' }, take: 1 } }
    });
    if (lead && lead.meetingBookings.length > 0) {
      meetingBooking = lead.meetingBookings[0];
    }
  }

  if (!meetingBooking) {
    // Unable to match webhook
    return { status: 'unmatched', payload };
  }

  const leadId = meetingBooking.leadId;
  const workspaceId = meetingBooking.workspaceId;

  if (eventType === 'invitee.created') {
    // Determine idempotency
    if (meetingBooking.status === 'BOOKED' && meetingBooking.calendlyInviteeUri === inviteeUri) {
      return { status: 'idempotent', action: 'none' };
    }

    // Attempt to get event details (simplified here without full Calendly API call)
    // Assume scheduled time is available in payload if we have full object, otherwise naive date
    const scheduledAt = payload.start_time ? new Date(payload.start_time) : new Date();
    const timezone = payload.timezone || 'EST';

    await meetingConciergeService.markBooked(meetingBooking.id, eventUri, scheduledAt);

    await prisma.meetingBooking.update({
      where: { id: meetingBooking.id },
      data: { calendlyInviteeUri: inviteeUri, calendlyTimezone: timezone }
    });

    // 1. Update Lead status
    await prisma.lead.update({
      where: { id: leadId },
      data: { status: 'MEETING' }
    });

    // 2. Update Call nextStep
    if (meetingBooking.callId) {
      await prisma.call.update({
        where: { id: meetingBooking.callId },
        data: { nextStep: `Prepare for confirmed technical discovery meeting.` }
      });
    }

    // 3. Cancel pending retry FollowUpPlans
    await prisma.followUpPlan.updateMany({
      where: { leadId, status: 'PENDING' },
      data: { status: 'CANCELED' }
    });

    // 4. Create Notification
    await createNotification(
      workspaceId,
      'BOOKING_CONFIRMED',
      'Meeting Booked',
      `${name} booked a meeting via Calendly.`,
      'INFO'
    );

    // 5. Create ActivityLog
    await prisma.activityLog.create({
      data: {
        workspaceId,
        leadId,
        action: 'CALENDLY_CALL_BOOKED',
        details: `${name} scheduled a meeting for ${scheduledAt.toISOString()}`,
        metadata: JSON.stringify({ inviteeUri, eventUri })
      }
    });

    return { status: 'processed', action: 'booked' };
  }

  if (eventType === 'invitee.canceled') {
    if (meetingBooking.status === 'CANCELED') {
      return { status: 'idempotent', action: 'none' };
    }

    await meetingConciergeService.markCanceled(meetingBooking.id);

    // 1. Create a new FollowUpPlan
    await prisma.followUpPlan.create({
      data: {
        leadId,
        status: 'PENDING',
        scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000), // Next day retry
        action: 'SEND_SMS',
        reason: 'Meeting canceled, follow up required',
        expectedOutcome: 'Re-engage lead via SMS',
      }
    });

    // 2. Notify sales
    await createNotification(
      workspaceId,
      'BOOKING_CANCELED',
      'Meeting Canceled',
      `${name} canceled their meeting. A follow-up plan has been scheduled.`,
      'WARNING'
    );

    await prisma.activityLog.create({
      data: {
        workspaceId,
        leadId,
        action: 'CALENDLY_CALL_CANCELED',
        details: `${name} canceled the meeting.`,
        metadata: JSON.stringify({ inviteeUri, eventUri })
      }
    });

    return { status: 'processed', action: 'canceled' };
  }

  return { status: 'ignored', action: 'none' };
}
