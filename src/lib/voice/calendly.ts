import { prisma } from '@/lib/db/prisma';
import {
  CalendlyTimeSlot,
  CalendlySmsDispatch,
  CalendlyBookingResult,
} from '@/types/voice';
import { addDemoCallback } from '@/lib/voice/callbacks-store';
import { meetingConciergeService } from '@/lib/meeting-concierge';

// ---------------------------------------------------------------------------
// Twilio SMS helper — only active when env vars are present
// ---------------------------------------------------------------------------
async function sendTwilioSms(to: string, body: string): Promise<{
  sid: string;
  status: string;
  success: boolean;
  error?: string;
}> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    return { sid: '', status: 'demo', success: false, error: 'Twilio credentials not configured' };
  }

  try {
    // Lazy-import twilio to keep it out of the critical path when unconfigured
    const twilio = (await import('twilio')).default;
    const client = twilio(accountSid, authToken);

    const message = await client.messages.create({
      body,
      from: fromNumber,
      to,
      statusCallback: process.env.TWILIO_STATUS_CALLBACK_URL || (process.env.APP_URL ? `${process.env.APP_URL}/api/webhooks/twilio/message-status` : undefined),
    });

    return { sid: message.sid, status: message.status, success: true };
  } catch (err: any) {
    console.error('[Twilio SMS] Send failed:', err?.message || err);
    return { sid: '', status: 'failed', success: false, error: err?.message || 'Twilio error' };
  }
}

import {
  DEFAULT_CALENDLY_BASE_URL,
  PRESET_CALENDLY_TIMESLOTS,
  getUpcomingBusinessDates,
  buildCalendlyUrl,
  generateCalendlySmsText,
} from '@/lib/voice/calendly-constants';

export {
  DEFAULT_CALENDLY_BASE_URL,
  PRESET_CALENDLY_TIMESLOTS,
  getUpcomingBusinessDates,
  buildCalendlyUrl,
  generateCalendlySmsText,
};

// In-memory record store for testing and offline demo reliability
const dispatchedSmsStore: CalendlySmsDispatch[] = [];

export async function dispatchCalendlySms(params: {
  leadId?: string;
  callId?: string;
  phoneNumber?: string;
  leadName?: string;
  leadEmail?: string;
  companyName?: string;
  reason?: string;
}): Promise<CalendlySmsDispatch> {
  const { leadId, callId, reason = 'Lead requested to speak with human specialist' } = params;

  let leadName = params.leadName;
  let leadEmail = params.leadEmail;
  let companyName = params.companyName;
  let phoneNumber = params.phoneNumber;
  let workspaceId = 'ws-1';

  // Fetch existing lead data if available
  let validDbLeadId: string | undefined = undefined;
  if (leadId) {
    try {
      const dbLead = await prisma.lead.findUnique({
        where: { id: leadId },
        include: { company: true },
      });
      if (dbLead) {
        validDbLeadId = dbLead.id;
        leadName = leadName || dbLead.name;
        leadEmail = leadEmail || dbLead.email || 'john.smith@technova.com';
        phoneNumber = phoneNumber || dbLead.phone || '+1 (555) 123-4567';
        companyName = companyName || dbLead.company?.name || 'Prospect Company';
        workspaceId = dbLead.workspaceId || 'ws-1';
      }
    } catch {
      // Fallback cleanly in case of disconnected DB or mock ID
    }
  }

  if (workspaceId === 'ws-1') {
    try {
      const ws = await prisma.workspace.findFirst({ select: { id: true } });
      if (ws) workspaceId = ws.id;
    } catch { }
  }

  // Fallbacks for demo consistency
  leadName = leadName || 'John Smith';
  leadEmail = leadEmail || 'john.smith@technova.com';
  companyName = companyName || 'Prospect Company';
  phoneNumber = phoneNumber || '+1 (555) 123-4567';

  const calendlyUrl = buildCalendlyUrl({
    leadName,
    leadEmail,
    companyName,
    topic: 'Technical Discovery with Solutions Team',
  });

  const messageBody = generateCalendlySmsText({
    leadName,
    calendlyUrl,
    companyName,
  });

  const messageId = `sms-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`;
  const sentAt = new Date().toISOString();

  let validDbCallId: string | undefined = undefined;
  if (callId) {
    try {
      const dbCall = await prisma.call.findUnique({ where: { id: callId } });
      if (dbCall) validDbCallId = dbCall.id;
    } catch {}
  }

  // Create persistent state machine record
  let bookingReqId: string | null = null;
  if (validDbLeadId) {
    try {
      const bookingReq = await meetingConciergeService.createBookingRequest({
        workspaceId,
        leadId: validDbLeadId,
        callId: validDbCallId,
        recipientPhone: phoneNumber,
        recipientEmail: leadEmail,
        recipientName: leadName,
        bookingUrl: calendlyUrl,
      });
      bookingReqId = bookingReq.id;
    } catch (e) {
      console.error('Failed to create meeting booking state:', e);
    }
  }

  // Attempt real Twilio SMS delivery
  const twilioResult = await sendTwilioSms(phoneNumber, messageBody);
  const isRealDelivery = twilioResult.success;
  const twilioSid = twilioResult.sid || null;
  const twilioStatus = twilioResult.status || 'demo';

  if (bookingReqId) {
    try {
      if (isRealDelivery) {
        await meetingConciergeService.markSmsSent(bookingReqId, twilioSid || messageId);
        await meetingConciergeService.markBookingAwaiting(bookingReqId);
      } else if (process.env.DEMO_MODE === 'true') {
        await meetingConciergeService.markSmsSent(bookingReqId, messageId);
        await meetingConciergeService.markBookingAwaiting(bookingReqId);
      } else {
        await meetingConciergeService.markRetryFailed(bookingReqId, twilioResult.error || 'Failed SMS');
      }
    } catch (e) {
      console.error('Failed to transition meeting booking state:', e);
    }
  }

  // Log delivery outcome
  if (isRealDelivery) {
    console.log(`[Twilio SMS] Sent to ${phoneNumber} — SID: ${twilioSid}, Status: ${twilioStatus}`);
  } else {
    console.log(`[Twilio SMS] Demo/fallback mode — ${twilioResult.error || 'no Twilio credentials'}`);
  }

  const dispatch: CalendlySmsDispatch = {
    messageId: twilioSid || messageId,
    recipientPhone: phoneNumber,
    recipientName: leadName,
    messageBody,
    calendlyUrl,
    sentAt,
    // In demo mode we mark as delivered for UI consistency;
    // in live mode we reflect real Twilio status
    delivered: isRealDelivery || process.env.DEMO_MODE === 'true',
    preferredSlots: PRESET_CALENDLY_TIMESLOTS,
    status: isRealDelivery ? twilioStatus.toUpperCase() : 'DEMO',
    bookingReqId,
  };

  dispatchedSmsStore.unshift(dispatch);

  // Record ActivityLog in database
  try {
    await prisma.activityLog.create({
      data: {
        workspaceId,
        leadId: validDbLeadId,
        action: 'SMS_CALENDLY_SENT',
        details: `${isRealDelivery ? 'Real' : 'Demo'} SMS with Calendly booking link sent to ${phoneNumber} (${leadName}). Reason: ${reason}. Link: ${calendlyUrl}`,
        metadata: JSON.stringify({
          messageId: dispatch.messageId,
          twilioSid,
          twilioStatus,
          isRealDelivery,
          phoneNumber,
          calendlyUrl,
          callId,
          reason,
        }),
      },
    });
  } catch {
    // Safe fallback
  }

  return dispatch;
}

export async function confirmCalendlyBooking(params: {
  leadId?: string;
  callId?: string;
  date: string;
  timeSlot: string;
  timezone?: string;
  leadName?: string;
  leadEmail?: string;
  companyName?: string;
  notes?: string;
}): Promise<CalendlyBookingResult> {
  const {
    leadId,
    callId,
    date,
    timeSlot,
    timezone = 'EST',
    notes = 'Follow-up technical scoping call booked via Calendly SMS',
  } = params;

  let leadName = params.leadName || 'John Smith';
  let leadEmail = params.leadEmail || 'john.smith@technova.com';
  let companyName = params.companyName || 'Prospect Company';
  let workspaceId = 'ws-1';
  let validDbLeadId: string | undefined = undefined;

  if (leadId) {
    try {
      const dbLead = await prisma.lead.findUnique({
        where: { id: leadId },
        include: { company: true },
      });
      if (dbLead) {
        validDbLeadId = dbLead.id;
        leadName = dbLead.name || leadName;
        leadEmail = dbLead.email || leadEmail;
        companyName = dbLead.company?.name || companyName;
        workspaceId = dbLead.workspaceId || 'ws-1';

        // Update lead status to MEETING
        await prisma.lead.update({
          where: { id: leadId },
          data: {
            status: 'MEETING',
            intentScore: Math.max(95, dbLead.intentScore || 90),
            qualificationScore: Math.max(92, dbLead.qualificationScore || 85),
          },
        });
      }
    } catch {
      // Safe fallback
    }
  }

  if (workspaceId === 'ws-1') {
    try {
      const ws = await prisma.workspace.findFirst({ select: { id: true } });
      if (ws) workspaceId = ws.id;
    } catch { }
  }

  // Update Call record if available
  if (callId) {
    try {
      await prisma.call.update({
        where: { id: callId },
        data: {
          nextStep: `Confirmed Calendly Call with Human Solutions Team: ${date} at ${timeSlot} (${timezone})`,
          interestLevel: 'EXTREME',
        },
      });
    } catch {
      // Safe fallback
    }
  }

  const bookingId = `CAL-BOOK-${Math.floor(1000 + Math.random() * 9000)}`;
  const createdAt = new Date().toISOString();

  if (validDbLeadId) {
    try {
      const activeBooking = await prisma.meetingBooking.findFirst({
        where: { leadId: validDbLeadId, status: { in: ['AWAITING_BOOKING', 'RETRYING', 'SMS_SENT', 'SMS_DELIVERED'] } }
      });
      if (activeBooking) {
        await meetingConciergeService.markBooked(
          activeBooking.id, 
          bookingId, 
          new Date()
        );
      }
    } catch (e) {
      console.error('Failed to update meeting booking state to BOOKED:', e);
    }
  }

  // Create Callback in system and in-memory list
  const newCallback = {
    id: bookingId,
    leadId: leadId || 'hero-lead',
    leadName,
    companyName,
    scheduledDate: date,
    scheduledTime: `${timeSlot} (${timezone})`,
    reason: `Calendly Booking: ${notes}`,
    status: 'SCHEDULED' as const,
    createdAt,
  };

  addDemoCallback(newCallback);

  // Create DB ActivityLog
  try {
    await prisma.activityLog.create({
      data: {
        workspaceId,
        leadId: validDbLeadId,
        action: 'CALENDLY_CALL_BOOKED',
        details: `Direct Calendly meeting booked by ${leadName} for ${date} at ${timeSlot} ${timezone} with Solutions Engineering Team.`,
        metadata: JSON.stringify({
          bookingId,
          leadName,
          companyName,
          date,
          timeSlot,
          timezone,
          callId,
          notes,
        }),
      },
    });
  } catch {
    // Safe fallback
  }

  return {
    bookingId,
    leadId: leadId || 'lead-hero-101',
    leadName,
    companyName,
    date,
    timeSlot,
    timezone,
    teamMember: 'Senior Solutions Engineering Architect',
    meetingLink: `https://meet.intentos.ai/room/${bookingId.toLowerCase()}`,
    status: 'CONFIRMED',
    createdAt,
  };
}

export function getDispatchedSmsHistory(): CalendlySmsDispatch[] {
  return [...dispatchedSmsStore];
}
