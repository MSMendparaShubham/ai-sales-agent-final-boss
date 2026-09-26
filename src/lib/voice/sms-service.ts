/**
 * sms-service.ts
 * Standalone SMS dispatch wrapper for the IntentOS voice pipeline.
 * Uses Twilio when credentials are present; gracefully logs to console otherwise.
 */

export interface SmsDispatchResult {
  success: boolean;
  sid?: string;
  status: string;
  simulated: boolean;
}

/**
 * Sends a Calendly booking link via SMS to a prospect.
 * Automatically falls back to a console-logged simulation when
 * TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_PHONE_NUMBER are unset.
 */
export async function sendCalendlySMS(
  toPhone: string,
  leadName: string,
): Promise<SmsDispatchResult> {
  const calendlyUrl =
    process.env.CALENDLY_URL || 'https://calendly.com/your-team/30min';

  const message = `Hi ${leadName}, thanks for chatting with our team! As requested, here is our direct calendar link to schedule a deep dive with our engineering lead: ${calendlyUrl}`;

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromPhone = process.env.TWILIO_PHONE_NUMBER;

  // ── Live Twilio delivery ──────────────────────────────────────────────────
  if (accountSid && authToken && fromPhone) {
    try {
      const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
      const params = new URLSearchParams({
        To: toPhone,
        From: fromPhone,
        Body: message,
      });

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      if (res.ok) {
        const data = await res.json();
        console.log(`[SMS] Delivered to ${toPhone} — SID: ${data.sid}`);
        return { success: true, sid: data.sid, status: data.status, simulated: false };
      }

      const errText = await res.text();
      console.error(`[SMS] Twilio error ${res.status}:`, errText);
      return { success: false, status: 'twilio_error', simulated: false };
    } catch (err) {
      console.error('[SMS Delivery Error]:', err);
      return { success: false, status: 'network_error', simulated: false };
    }
  }

  // ── Graceful simulation fallback ──────────────────────────────────────────
  console.log(
    `[SIMULATED SMS DISPATCHED] To: ${toPhone} | Body: "${message}"`,
  );
  return { success: true, status: 'simulated', simulated: true };
}
