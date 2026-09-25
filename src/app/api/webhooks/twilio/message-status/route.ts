import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const params = Object.fromEntries(new URLSearchParams(rawBody));

    const signingKey = process.env.TWILIO_WEBHOOK_SIGNING_KEY;
    const twilioSig = req.headers.get('x-twilio-signature') || '';

    // 1. Validate signature if configured
    if (signingKey && twilioSig) {
      try {
        const twilio = (await import('twilio')).default;
        const requestUrl = req.url;
        
        const isValid = twilio.validateRequest(signingKey, twilioSig, requestUrl, params);
        if (!isValid) {
          console.warn('[Twilio Status Webhook] Invalid signature');
          return NextResponse.json({ error: 'Invalid Twilio signature' }, { status: 403 });
        }
      } catch (err: any) {
        console.error('[Twilio Status Webhook] Signature validation error:', err.message);
      }
    }

    const { MessageSid, MessageStatus, ErrorCode, To, From } = params;
    if (!MessageSid || !MessageStatus) {
      return NextResponse.json({ error: 'Missing MessageSid or MessageStatus' }, { status: 400 });
    }

    // 2. Process MessageSid
    const booking = await prisma.meetingBooking.findFirst({
      where: { twilioMessageSid: MessageSid },
      include: { workspace: true }
    });

    if (!booking) {
      console.warn(`[Twilio Status Webhook] Unknown MessageSid: ${MessageSid}`);
      return new NextResponse(
        `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
        { headers: { 'Content-Type': 'text/xml' } }
      );
    }

    // 3. Process MessageStatus & distinguish DEMO vs LIVE
    const isLive = MessageSid.startsWith('SM') || MessageSid.startsWith('MM');
    const displayStatus = isLive ? 'LIVE' : 'DEMO';
    const statusUpper = MessageStatus.toUpperCase();
    
    // Explicitly distinguish DEMO SMS (Twilio test credentials or mock) from real LIVE
    // If not live but status is delivered, we don't treat it as "real delivered"
    // Actually, Twilio test credentials return specific statuses. 
    // We'll update the smsStatus exactly as reported by Twilio to accurately reflect it in the UI.

    let newStatus = statusUpper; // e.g. QUEUED, SENT, DELIVERED, UNDELIVERED, FAILED
    if (['UNDELIVERED', 'CANCELED'].includes(statusUpper)) {
      newStatus = 'FAILED';
    }
    
    // 4. Update MeetingBooking smsStatus (idempotent)
    const updateData: any = { smsStatus: newStatus };
    
    if (statusUpper === 'SENT' && !booking.smsSentAt) {
      updateData.smsSentAt = new Date();
    }
    if (statusUpper === 'DELIVERED' && !booking.smsDeliveredAt) {
      updateData.smsDeliveredAt = new Date();
    }
    if (ErrorCode && !booking.failureReason) {
      updateData.failureReason = `Twilio Error: ${ErrorCode}`;
    }

    if (booking.smsStatus !== newStatus || updateData.smsDeliveredAt || updateData.smsSentAt) {
      await prisma.meetingBooking.update({
        where: { id: booking.id },
        data: updateData
      });

      // 5. Create ActivityLog entry
      await prisma.activityLog.create({
        data: {
          workspaceId: booking.workspaceId,
          leadId: booking.leadId,
          action: 'SMS_DELIVERY_STATUS',
          details: `[${displayStatus}] SMS delivery update: ${newStatus}`,
          metadata: JSON.stringify({ MessageSid, MessageStatus, ErrorCode, To, From })
        }
      });
    }

    // 6. Be idempotent (always return 2xx TwiML)
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
      { headers: { 'Content-Type': 'text/xml' } }
    );
  } catch (error: any) {
    console.error('[Twilio Status Webhook] Error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
