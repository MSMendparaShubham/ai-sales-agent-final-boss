import { NextRequest, NextResponse } from 'next/server';
import { confirmCalendlyBooking } from '@/lib/voice/calendly';

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
      date,
      timeSlot,
      timezone = 'EST',
      leadName,
      leadEmail,
      companyName,
      notes,
    } = body;

    if (!date || !timeSlot) {
      return NextResponse.json(
        { success: false, error: 'Both date and timeSlot are required for booking' },
        { status: 400 }
      );
    }

    const booking = await confirmCalendlyBooking({
      leadId,
      callId: id,
      date,
      timeSlot,
      timezone,
      leadName,
      leadEmail,
      companyName,
      notes,
    });

    return NextResponse.json({
      success: true,
      data: booking,
      message: `Call booked with Solutions Team for ${date} at ${timeSlot} (${timezone})!`,
    });
  } catch (error: any) {
    console.error('Error confirming Calendly booking:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to book Calendly slot' },
      { status: 500 }
    );
  }
}
