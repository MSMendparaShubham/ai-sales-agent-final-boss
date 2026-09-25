import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { meetingConciergeService } from '@/lib/meeting-concierge/service';
import { createNotification } from '@/lib/notifications';

export async function GET(req: NextRequest) {
  try {
    const isDemoMode = process.env.DEMO_MODE === 'true';

    // 1. Fetch all bookings that are awaiting booking and have reached their nextCheckAt time
    const pendingBookings = await prisma.meetingBooking.findMany({
      where: {
        status: 'AWAITING_BOOKING',
        nextCheckAt: { lte: new Date() }
      },
      include: { lead: true }
    });

    const processed = [];

    for (const booking of pendingBookings) {
      if (isDemoMode) {
        // Deterministic local simulation for DEMO_MODE=true
        // To showcase the feature without spending Twilio credits or requiring actual Calendly webhooks
        
        // If they haven't been retried yet, we simulate that they forgot to book (NOT_BOOKED -> RETRY_CALL)
        if (booking.retryCount === 0) {
          await meetingConciergeService.startRetry(booking.id);
          
          await prisma.activityLog.create({
            data: {
              workspaceId: booking.workspaceId,
              leadId: booking.leadId,
              action: 'RETRY_CALL_SCHEDULED',
              details: `(DEMO) Lead did not book. Scheduled automated follow-up retry call for ${booking.lead.name}.`
            }
          });
          
          processed.push({ id: booking.id, action: 'SIMULATED_NOT_BOOKED_RETRYING' });
        } else {
          // If they were already retried, simulate that the retry worked (BOOKED -> STOP)
          await meetingConciergeService.markBooked(
            booking.id, 
            'mock-event-uri-after-retry',
            new Date(Date.now() + 86400000) // Tomorrow
          );
          
          await prisma.activityLog.create({
            data: {
              workspaceId: booking.workspaceId,
              leadId: booking.leadId,
              action: 'CALENDLY_CALL_BOOKED',
              details: `(DEMO) Lead successfully booked meeting after retry sequence.`
            }
          });

          processed.push({ id: booking.id, action: 'SIMULATED_BOOKED' });
        }
      } else {
        // LIVE MODE (DEMO_MODE=false)
        // If Calendly webhook fired, it would already be in 'BOOKED' state.
        // Since it is still in 'AWAITING_BOOKING' and the check time passed, it means NOT_BOOKED.
        
        try {
          await meetingConciergeService.startRetry(booking.id);
          
          // In a real system, you would enqueue the Twilio outbound call task here
          // E.g., dispatching to a queue or calling the /api/calls/real/start endpoint internally
          
          await prisma.activityLog.create({
            data: {
              workspaceId: booking.workspaceId,
              leadId: booking.leadId,
              action: 'RETRY_CALL_QUEUED',
              details: `Lead has not booked. Initiating follow-up retry call sequence.`
            }
          });
          
          processed.push({ id: booking.id, action: 'NOT_BOOKED_RETRY_INITIATED' });
        } catch (error: any) {
          // If startRetry throws (e.g. max retries exceeded), log and escalate
          if (error.message.includes('Max retries exceeded')) {
             await meetingConciergeService.escalateToHuman(booking.id);
             await createNotification(
                booking.workspaceId,
                'HIGH_INTENT',
                'Booking Recovery Exhausted',
                `Lead ${booking.lead.name} failed to book after max retries. Human intervention required.`,
                'WARNING',
                `/opportunities/${booking.leadId}`
             );
             processed.push({ id: booking.id, action: 'ESCALATED' });
          } else {
             console.error(`Failed to retry booking ${booking.id}:`, error);
          }
        }
      }
    }

    return NextResponse.json({ success: true, processedCount: processed.length, processed });
  } catch (error: any) {
    console.error('Meeting Recovery Cron Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
