import { NextRequest, NextResponse } from 'next/server';
import { processCalendlyWebhook } from '@/lib/meeting-concierge/calendly-webhook';

export async function POST(req: NextRequest) {
  if (process.env.DEMO_MODE !== 'true') {
    return NextResponse.json({ error: 'Test endpoint is disabled in production' }, { status: 403 });
  }

  try {
    const event = await req.json();
    const result = await processCalendlyWebhook(event);
    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    console.error('Test Webhook Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
