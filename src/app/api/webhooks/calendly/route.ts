import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyCalendlySignature, processCalendlyWebhook } from '@/lib/meeting-concierge/calendly-webhook';

/**
 * POST /api/webhooks/calendly
 *
 * Handles Calendly webhook events (invitee.created / invitee.canceled).
 * When an invitee creates a booking:
 *   - Marks lead.calendlyBooked = true & status = 'MEETING_BOOKED'
 *   - Delegates full state-machine processing to processCalendlyWebhook()
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('calendly-webhook-signature');
    const secret = process.env.CALENDLY_WEBHOOK_SIGNING_KEY;

    // Verify HMAC signature if secret is configured
    if (secret && signature) {
      const isValid = verifyCalendlySignature(rawBody, signature, secret);
      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid signature or replay attack detected' },
          { status: 401 },
        );
      }
    } else if (secret && !signature) {
      return NextResponse.json({ error: 'Missing signature header' }, { status: 401 });
    }

    const event = JSON.parse(rawBody);
    const eventType: string = event?.event || '';

    // ── Mark lead as booked when invitee creates a slot ──────────────────────
    if (eventType === 'invitee.created') {
      const payload = event?.payload || {};
      const email: string | undefined = payload?.email;
      const phone: string | undefined = payload?.questions_and_answers?.find(
        (qa: any) => /phone/i.test(qa.question),
      )?.answer;

      if (email || phone) {
        try {
          await prisma.lead.updateMany({
            where: {
              OR: [
                email ? { email } : undefined,
                phone ? { phone } : undefined,
              ].filter(Boolean) as any[],
            },
            data: {
              calendlyBooked: true,
              status: 'MEETING_BOOKED',
            },
          });
          console.log(
            `[Calendly Webhook] Marked lead as MEETING_BOOKED — email: ${email}, phone: ${phone}`,
          );
        } catch (e) {
          console.error('[Calendly Webhook] Failed to update lead booking status:', e);
        }
      }
    }

    // ── Full state-machine processing ─────────────────────────────────────────
    const result = await processCalendlyWebhook(event);

    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    console.error('Calendly Webhook Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
