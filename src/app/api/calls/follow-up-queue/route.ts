import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

/**
 * GET /api/calls/follow-up-queue
 *
 * Returns all leads in the handoff follow-up queue:
 * - handoffRequested = true
 * - Includes calendlyBooked status, minutes since SMS was sent,
 *   and time until auto re-call.
 */
export async function GET(req: NextRequest) {
  try {
    const leads = await prisma.lead.findMany({
      where: { handoffRequested: true },
      orderBy: { calendlySentAt: 'desc' },
      take: 50,
      include: {
        company: { select: { name: true } },
      },
    });

    const now = Date.now();

    const queue = leads.map((l) => {
      const sentMs = l.calendlySentAt ? new Date(l.calendlySentAt).getTime() : null;
      const retryMs = l.retryCallScheduled ? new Date(l.retryCallScheduled).getTime() : null;

      const minutesSinceSms = sentMs ? Math.floor((now - sentMs) / 60000) : null;
      const retryInMinutes = retryMs ? Math.max(0, Math.ceil((retryMs - now) / 60000)) : null;

      return {
        id: l.id,
        name: l.name,
        title: l.title,
        phone: l.phone,
        companyName: l.company?.name || 'Unknown',
        status: l.status,
        calendlyBooked: l.calendlyBooked,
        calendlySentAt: l.calendlySentAt,
        retryCallScheduled: l.retryCallScheduled,
        minutesSinceSms,
        retryInMinutes,
        bookingStatus: l.calendlyBooked ? 'BOOKED' : retryInMinutes !== null && retryInMinutes > 0
          ? `PENDING (re-call in ${retryInMinutes} min)`
          : 'PENDING (re-call imminent)',
      };
    });

    return NextResponse.json({ count: queue.length, queue });
  } catch (err: any) {
    console.error('[/api/calls/follow-up-queue]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
