import { NextRequest, NextResponse } from 'next/server';
import { verifyCalendlySignature, processCalendlyWebhook } from '@/lib/meeting-concierge/calendly-webhook';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('calendly-webhook-signature');
    const secret = process.env.CALENDLY_WEBHOOK_SIGNING_KEY;

    // Verify signature if secret is configured
    if (secret && signature) {
      const isValid = verifyCalendlySignature(rawBody, signature, secret);
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid signature or replay attack detected' }, { status: 401 });
      }
    } else if (secret && !signature) {
      return NextResponse.json({ error: 'Missing signature header' }, { status: 401 });
    }

    const event = JSON.parse(rawBody);
    const result = await processCalendlyWebhook(event);

    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    console.error('Calendly Webhook Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
