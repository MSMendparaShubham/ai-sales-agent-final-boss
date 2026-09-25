import { NextRequest, NextResponse } from 'next/server';
import { dispatchCalendlySms, PRESET_CALENDLY_TIMESLOTS } from '@/lib/voice/calendly';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const {
      leadId = 'lead-hero-101',
      phoneNumber,
      leadName,
      leadEmail,
      companyName,
      reason = 'Lead requested direct conversation with human solutions team',
    } = body;

    const dispatch = await dispatchCalendlySms({
      leadId,
      callId: id,
      phoneNumber,
      leadName,
      leadEmail,
      companyName,
      reason,
    });

    // Determine if this was a real Twilio send or demo mode
    const isRealSms = !!(
      process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_PHONE_NUMBER
    );

    return NextResponse.json({
      success: true,
      data: dispatch,
      preferredSlots: PRESET_CALENDLY_TIMESLOTS,
      deliveryMode: isRealSms ? 'live' : 'demo',
      message: isRealSms
        ? `Real SMS dispatched via Twilio to ${dispatch.recipientPhone}.`
        : `Demo SMS queued for ${dispatch.recipientPhone} (add TWILIO_PHONE_NUMBER to .env to send real SMS).`,
    });
  } catch (error: any) {
    console.error('Error dispatching Calendly SMS:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to dispatch Calendly SMS' },
      { status: 500 }
    );
  }
}
