import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { sendCalendlySMS } from '@/lib/voice/sms-service';

/**
 * POST /api/calls/handoff
 * Body: { leadId: string, callSessionId?: string }
 *
 * 1. Fetches the lead's phone from Prisma (demo phone as fallback)
 * 2. Sends Calendly SMS via Twilio (or simulated)
 * 3. Updates Lead: handoffRequested=true, calendlySentAt, retryCallScheduled (+2h)
 * 4. Updates CallSession: status=HANDOFF_SMS_SENT, outcome=HUMAN_HANDOFF_REQUESTED
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { leadId, callSessionId } = body as {
      leadId?: string;
      callSessionId?: string;
    };

    if (!leadId) {
      return NextResponse.json({ error: 'leadId is required' }, { status: 400 });
    }

    // 1. Fetch lead
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: { company: true },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Use demo phone if the lead has no real number
    const phone = lead.phone || '+15550192834';
    const leadName = lead.name;

    // 2. Send Calendly SMS
    const smsResult = await sendCalendlySMS(phone, leadName);

    const now = new Date();
    const retryAt = new Date(now.getTime() + 2 * 60 * 60 * 1000); // +2 hours

    // 3. Update Lead record
    await prisma.lead.update({
      where: { id: leadId },
      data: {
        handoffRequested: true,
        calendlySentAt: now,
        retryCallScheduled: retryAt,
        status: 'CONTACTED',
      },
    });

    // 4. Update CallSession if provided
    if (callSessionId) {
      try {
        await prisma.callSession.update({
          where: { id: callSessionId },
          data: {
            status: 'HANDOFF_SMS_SENT',
            outcome: 'HUMAN_HANDOFF_REQUESTED',
          },
        });
      } catch {
        // Session may not exist yet — not fatal
      }
    }

    // 5. Log activity
    try {
      const ws = await prisma.workspace.findFirst({ select: { id: true } });
      if (ws) {
        await prisma.activityLog.create({
          data: {
            workspaceId: ws.id,
            leadId,
            action: 'HUMAN_HANDOFF_SMS_SENT',
            details: `Calendly SMS ${smsResult.simulated ? 'simulated' : 'delivered'} to ${phone} for ${leadName}. Re-call scheduled at ${retryAt.toISOString()}.`,
            metadata: JSON.stringify({ smsResult, phone, retryAt }),
          },
        });
      }
    } catch {
      // Non-critical
    }

    return NextResponse.json({
      success: true,
      phone,
      sms: smsResult,
      retryCallScheduled: retryAt,
      message: smsResult.simulated
        ? `[SIMULATED] Calendly SMS queued for ${phone}. Automated re-call armed for ${retryAt.toLocaleTimeString()}.`
        : `SMS with Calendly booking link sent to ${phone}. Automated re-call scheduler armed if booking is not completed within 2 hours.`,
    });
  } catch (err: any) {
    console.error('[/api/calls/handoff] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * GET /api/calls/handoff?leadId=xxx
 * Returns the current handoff / booking status for a lead.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const leadId = searchParams.get('leadId');
    if (!leadId) {
      return NextResponse.json({ error: 'leadId is required' }, { status: 400 });
    }

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: {
        id: true,
        name: true,
        phone: true,
        handoffRequested: true,
        calendlySentAt: true,
        calendlyBooked: true,
        retryCallScheduled: true,
      },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const now = Date.now();
    const retryInMs = lead.retryCallScheduled
      ? Math.max(0, new Date(lead.retryCallScheduled).getTime() - now)
      : null;

    return NextResponse.json({
      ...lead,
      retryInMs,
      retryInMinutes: retryInMs !== null ? Math.ceil(retryInMs / 60000) : null,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
