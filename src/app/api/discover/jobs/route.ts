import { NextRequest, NextResponse } from 'next/server';
import { requireSession, requireWorkspace } from '@/lib/auth/auth-utils';
import { prisma } from '@/lib/db/prisma';
import { runDiscoveryJob } from '@/lib/discovery/discovery-provider';

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    let firstMembership = await prisma.workspaceMember.findFirst({
      where: { userId: session.user.id },
    });

    if (!firstMembership) {
      let ws = await prisma.workspace.findFirst();
      if (!ws) {
        ws = await prisma.workspace.create({
          data: { name: 'IntentOS Enterprise Workspace' },
        });
      }
      firstMembership = await prisma.workspaceMember.create({
        data: {
          userId: session.user.id,
          workspaceId: ws.id,
          role: 'ADMIN',
        },
      });
    }

    const { membership } = await requireWorkspace(firstMembership.workspaceId);

    const body = await req.json();
    console.log('[Discover API] Received scan job payload:', body);

    const { keyword, description, query, industry, location, channel, source } = body;
    const searchTerm = (keyword || description || query || '').trim();
    const selectedSource = channel || source || 'LINKEDIN';
    console.log('[Discover API Request Channel]:', selectedSource);

    const job = await prisma.discoveryJob.create({
      data: {
        workspaceId: membership.workspaceId,
        source: selectedSource,
        status: 'QUEUED',
      },
    });

    // Execute scan with filters
    const result = await runDiscoveryJob(job.id, {
      keyword: searchTerm,
      industry,
      location,
      channel: selectedSource,
    });

    console.log('[Discover API] Scan completed successfully. Discovered count:', result?.totalDiscovered || 0);

    // Record scan in ScanHistory
    let scanRecord: any = null;
    try {
      scanRecord = await prisma.scanHistory.create({
        data: {
          workspaceId: membership.workspaceId,
          query: searchTerm || 'Enterprise Cloud Modernization',
          channel: selectedSource || 'ALL',
          location: location || null,
          industry: industry || null,
          leadsFound: result?.totalDiscovered || 0,
          leads: result?.leads && result.leads.length > 0 ? {
            connect: result.leads.map((l: any) => ({ id: l.id })),
          } : undefined,
        },
      });
    } catch (histErr) {
      console.error('[ScanHistory Record Error]:', histErr);
    }

    return NextResponse.json(
      {
        success: true,
        jobId: job.id,
        scanHistoryId: scanRecord?.id,
        count: result?.totalDiscovered || 0,
        totalDiscovered: result?.totalDiscovered || 0,
        leads: result?.leads || [],
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('[Discover API Error]:', err);
    if (err?.message === 'NEXT_REDIRECT') throw err;
    return NextResponse.json(
      { success: false, error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    let firstMembership = await prisma.workspaceMember.findFirst({
      where: { userId: session.user.id },
    });

    if (!firstMembership) {
      let ws = await prisma.workspace.findFirst();
      if (!ws) {
        ws = await prisma.workspace.create({
          data: { name: 'IntentOS Enterprise Workspace' },
        });
      }
      firstMembership = await prisma.workspaceMember.create({
        data: {
          userId: session.user.id,
          workspaceId: ws.id,
          role: 'ADMIN',
        },
      });
    }

    // Return the latest 5 jobs for the workspace
    const jobs = await prisma.discoveryJob.findMany({
      where: { workspaceId: firstMembership.workspaceId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        results: { take: 5 }, // Preview of top results
      },
    });

    return NextResponse.json({ jobs });
  } catch (error: any) {
    if (error?.message === 'NEXT_REDIRECT') throw error;
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
