import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

/**
 * POST /api/calls/retry-unbooked
 *
 * Scans all leads where:
 *   - handoffRequested = true
 *   - calendlyBooked   = false
 *   - calendlySentAt   < (now - 15 min)
 *
 * For each qualifying lead, creates a FollowUpPlan with action=RETRY_CALL
 * and logs an ActivityLog entry describing the automated re-engagement.
 *
 * In production, you would queue an outbound Twilio call here.
 */
export async function POST(req: NextRequest) {
  try {
    const cutoff = new Date(Date.now() - 15 * 60 * 1000); // 15 minutes ago

    const unbookedLeads = await prisma.lead.findMany({
      where: {
        handoffRequested: true,
        calendlyBooked: false,
        calendlySentAt: { lt: cutoff },
      },
      include: { company: true },
    });

    if (unbookedLeads.length === 0) {
      return NextResponse.json({ message: 'No unbooked leads to retry', retried: 0 });
    }

    const ws = await prisma.workspace.findFirst({ select: { id: true } });
    const workspaceId = ws?.id || 'ws-default';

    const results: { leadId: string; leadName: string; action: string }[] = [];

    for (const lead of unbookedLeads) {
      const retryMessage = `Hi ${lead.name}, Alexandria following up from IntentOS. I sent over our engineering calendar link earlier—wanted to make sure it reached you or see if you'd like me to lock in a time slot directly right now.`;

      // Create follow-up plan in DB
      try {
        await prisma.followUpPlan.create({
          data: {
            leadId: lead.id,
            action: 'RETRY_CALL',
            reason: 'Calendly link sent but booking not confirmed within 15 minutes.',
            expectedOutcome: 'Prospect books engineering scoping call.',
            channel: 'VOICE',
            owner: 'AI_AGENT',
            scheduledFor: new Date(Date.now() + 5 * 60 * 1000), // 5 min from now
            status: 'PENDING',
          },
        });
      } catch (e) {
        console.error(`[retry-unbooked] Failed to create follow-up for ${lead.id}:`, e);
      }

      // Log activity
      try {
        await prisma.activityLog.create({
          data: {
            workspaceId,
            leadId: lead.id,
            action: 'AUTO_RETRY_CALL_SCHEDULED',
            details: `Re-engagement follow-up queued for ${lead.name} at ${lead.company?.name || 'unknown company'}. Script: "${retryMessage}"`,
            metadata: JSON.stringify({
              calendlySentAt: lead.calendlySentAt,
              handoffRequested: lead.handoffRequested,
              retryScript: retryMessage,
            }),
          },
        });
      } catch {
        // Non-critical
      }

      // Update retryCallScheduled timestamp
      await prisma.lead.update({
        where: { id: lead.id },
        data: { retryCallScheduled: new Date(Date.now() + 5 * 60 * 1000) },
      });

      results.push({
        leadId: lead.id,
        leadName: lead.name,
        action: 'RETRY_CALL_QUEUED',
      });

      console.log(`[retry-unbooked] Re-engagement queued for ${lead.name} (${lead.id})`);
    }

    return NextResponse.json({
      message: `Re-engagement follow-up queued for ${results.length} lead(s).`,
      retried: results.length,
      results,
    });
  } catch (err: any) {
    console.error('[/api/calls/retry-unbooked] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * GET /api/calls/retry-unbooked
 * Returns a preview of all leads eligible for retry (no DB writes).
 */
export async function GET(req: NextRequest) {
  try {
    const cutoff = new Date(Date.now() - 15 * 60 * 1000);

    const leads = await prisma.lead.findMany({
      where: {
        handoffRequested: true,
        calendlyBooked: false,
        calendlySentAt: { lt: cutoff },
      },
      select: {
        id: true,
        name: true,
        title: true,
        phone: true,
        calendlySentAt: true,
        retryCallScheduled: true,
        company: { select: { name: true } },
      },
    });

    const now = Date.now();
    const enriched = leads.map((l) => ({
      ...l,
      minutesSinceSms: l.calendlySentAt
        ? Math.floor((now - new Date(l.calendlySentAt).getTime()) / 60000)
        : null,
    }));

    return NextResponse.json({ count: enriched.length, leads: enriched });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
