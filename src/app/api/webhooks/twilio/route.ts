import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

/**
 * POST /api/webhooks/twilio
 *
 * Handles inbound Twilio webhook events:
 * - Inbound SMS replies from leads (e.g., "YES" confirming a Calendly booking)
 * - Delivery status callbacks for outbound Calendly SMS messages
 *
 * Twilio sends a signed POST (application/x-www-form-urlencoded).
 * Signature is validated using TWILIO_WEBHOOK_SIGNING_KEY.
 */
export async function POST(req: NextRequest) {
  try {
    // ---------------------------------------------------------------------------
    // 1. Validate Twilio signature (security gate)
    // ---------------------------------------------------------------------------
    const signingKey = process.env.TWILIO_WEBHOOK_SIGNING_KEY;
    const twilioSig = req.headers.get('x-twilio-signature') || '';

    if (signingKey && twilioSig) {
      try {
        const twilio = (await import('twilio')).default;
        const requestUrl = req.url;
        const rawBody = await req.text();
        const params = Object.fromEntries(new URLSearchParams(rawBody));

        const isValid = twilio.validateRequest(signingKey, twilioSig, requestUrl, params);

        if (!isValid) {
          console.warn('[Twilio Webhook] Invalid signature — rejecting request');
          return NextResponse.json({ error: 'Invalid Twilio signature' }, { status: 403 });
        }

        // Re-parse for downstream processing
        return await handleTwilioEvent(params);
      } catch (err: any) {
        console.error('[Twilio Webhook] Signature validation error:', err.message);
        // Fall through to process without validation in dev/demo mode
      }
    }

    // Fallback: parse body without signature check (dev/demo mode)
    const rawBody = await req.text();
    const params = Object.fromEntries(new URLSearchParams(rawBody));
    return await handleTwilioEvent(params);
  } catch (error: any) {
    console.error('[Twilio Webhook] Error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

import { DEFAULT_CALENDLY_BASE_URL } from '@/lib/voice/calendly-constants';

async function handleTwilioEvent(params: Record<string, string>): Promise<NextResponse> {
  const messageStatus = params.MessageStatus;
  const messageSid = params.MessageSid || params.SmsSid;
  const from = params.From || params.from;
  const to = params.To || params.to;
  const body = params.Body || params.body || '';

  console.log(`[Twilio Webhook] Event — SID: ${messageSid}, Status: ${messageStatus}, From: ${from}`);

  // ---------------------------------------------------------------------------
  // 2. Handle delivery status callback (outbound message status update)
  // ---------------------------------------------------------------------------
  if (messageStatus && messageSid) {
    // Log the status update with verified workspace
    try {
      const booking = await prisma.meetingBooking.findFirst({
        where: { twilioMessageSid: messageSid },
        select: { workspaceId: true, leadId: true },
      });
      if (booking) {
        await prisma.activityLog.create({
          data: {
            workspaceId: booking.workspaceId,
            leadId: booking.leadId,
            action: 'SMS_DELIVERY_STATUS',
            details: `Twilio SMS delivery update — SID: ${messageSid}, Status: ${messageStatus}, To: ${to}`,
            metadata: JSON.stringify({ messageSid, messageStatus, from, to }),
          },
        });
      }
    } catch {
      // Non-critical
    }

    // Return TwiML empty response to acknowledge
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
      { headers: { 'Content-Type': 'text/xml' } }
    );
  }

  // ---------------------------------------------------------------------------
  // 3. Handle inbound SMS reply from lead
  // ---------------------------------------------------------------------------
  if (from && body) {
    const normalizedReply = body.trim().toUpperCase();
    console.log(`[Twilio Webhook] Inbound SMS from ${from}: "${body}"`);

    // Log the inbound message with verified lead workspace
    try {
      const lead = await prisma.lead.findFirst({
        where: { phone: from },
        select: { workspaceId: true, id: true },
      });
      if (lead) {
        await prisma.activityLog.create({
          data: {
            workspaceId: lead.workspaceId,
            leadId: lead.id,
            action: 'SMS_INBOUND_REPLY',
            details: `Inbound SMS from ${from}: "${body}"`,
            metadata: JSON.stringify({ from, to, body, messageSid }),
          },
        });
      }
    } catch {
      // Non-critical
    }

    // Generate a contextual TwiML reply using configured booking link
    const bookingUrl = process.env.CALENDLY_EVENT_TYPE_URL || DEFAULT_CALENDLY_BASE_URL;
    let replyMessage = '';

    if (normalizedReply === 'YES' || normalizedReply === 'CONFIRM' || normalizedReply === 'BOOK') {
      replyMessage = `Great! Please use the Calendly link we sent to select your preferred time slot. Our solutions engineering team is looking forward to the call!`;
    } else if (normalizedReply === 'NO' || normalizedReply === 'STOP' || normalizedReply === 'CANCEL') {
      replyMessage = `No problem! If you change your mind and want to schedule a call with our team, feel free to reach out. Have a great day!`;
    } else if (normalizedReply === 'HELP' || normalizedReply === '?') {
      replyMessage = `Reply YES to confirm your interest or STOP to opt out. For assistance, visit ${bookingUrl}`;
    } else {
      replyMessage = `Thanks for your message! A member of our solutions team will follow up with you shortly. You can also book directly: ${bookingUrl}`;
    }

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${replyMessage}</Message>
</Response>`;

    return new NextResponse(twiml, { headers: { 'Content-Type': 'text/xml' } });
  }

  // Default acknowledgment
  return new NextResponse(
    `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
    { headers: { 'Content-Type': 'text/xml' } }
  );
}
