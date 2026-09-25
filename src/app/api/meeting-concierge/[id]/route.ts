import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const booking = await prisma.meetingBooking.findUnique({
      where: { id },
      include: {
        lead: true,
        call: true,
      }
    });

    if (!booking) {
      return NextResponse.json({ error: 'Meeting booking not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: booking.id,
      state: booking.status,
      smsState: booking.smsStatus,
      bookingUrl: booking.bookingUrl,
      bookingEvent: booking.calendlyEventUri,
      retryState: booking.retryCount,
      nextRetryTime: booking.nextRetryAt,
      timeline: {
        createdAt: booking.createdAt,
        smsSentAt: booking.smsSentAt,
        bookedAt: booking.bookedAt,
        canceledAt: booking.canceledAt
      },
      nextAction: booking.status === 'AWAITING_BOOKING' ? 'Waiting for lead to book' : 
                 booking.status === 'BOOKED' ? 'Prepare for meeting' : 
                 booking.status === 'RETRY_DUE' ? 'Retry required' : 'Review status'
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
