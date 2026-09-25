import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

import { demoCallbacks, addDemoCallback } from '@/lib/voice/callbacks-store';

export async function GET() {
  try {
    const dbLogs = await prisma.activityLog.findMany({
      where: {
        action: {
          in: ['CALENDLY_CALL_BOOKED', 'CALLBACK_SCHEDULED'],
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const dbCallbacks = dbLogs
      .map((log) => {
        try {
          const meta = log.metadata ? JSON.parse(log.metadata) : {};
          return {
            id: meta.bookingId || `CB-${log.id.slice(-4)}`,
            leadId: log.leadId || 'hero-lead',
            leadName: meta.leadName || 'John Smith',
            companyName: meta.companyName || 'Prospect Company',
            scheduledDate: meta.date || meta.scheduledDate || '2026-09-26',
            scheduledTime: meta.timeSlot ? `${meta.timeSlot} (${meta.timezone || 'EST'})` : meta.scheduledTime || '14:00 EST',
            reason: meta.notes ? `Calendly: ${meta.notes}` : log.details || 'Technical discovery follow-up',
            status: 'SCHEDULED',
            createdAt: log.createdAt.toISOString(),
          };
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    const seenIds = new Set<string>();
    const merged: any[] = [];
    for (const item of [...demoCallbacks, ...dbCallbacks]) {
      if (item && !seenIds.has(item.id)) {
        seenIds.add(item.id);
        merged.push(item);
      }
    }

    return NextResponse.json({ callbacks: merged });
  } catch {
    return NextResponse.json({ callbacks: demoCallbacks });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { leadId, leadName, companyName, scheduledDate, scheduledTime, reason } = body;

    const newCallback = {
      id: `CB-${Math.floor(100 + Math.random() * 900)}`,
      leadId: leadId || 'lead-id',
      leadName: leadName || 'John Smith',
      companyName: companyName || 'Prospect Company',
      scheduledDate: scheduledDate || new Date(Date.now() + 86400000).toISOString().split('T')[0],
      scheduledTime: scheduledTime || '14:00 EST',
      reason: reason || 'Technical discovery follow-up',
      status: 'SCHEDULED',
      createdAt: new Date().toISOString(),
    };

    demoCallbacks.unshift(newCallback);

    if (leadId) {
      await prisma.activityLog.create({
        data: { workspaceId: "dummy", 
          leadId,
          action: 'CALLBACK_SCHEDULED',
          details: `Scheduled callback for ${newCallback.scheduledDate} at ${newCallback.scheduledTime}. Reason: ${newCallback.reason}`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      callback: newCallback,
      message: 'Callback scheduled successfully',
    });
  } catch (error: any) {
    console.error('Error scheduling callback:', error);
    return NextResponse.json({ error: error.message || 'Failed to schedule callback' }, { status: 500 });
  }
}
