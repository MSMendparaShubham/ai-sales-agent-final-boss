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
    console.log('[Discover Scan API] Received scan payload:', body);

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

    console.log('[Discover Scan API] Scan completed successfully. Discovered count:', result?.totalDiscovered || 0);

    return NextResponse.json(
      {
        success: true,
        jobId: job.id,
        count: result?.totalDiscovered || 0,
        totalDiscovered: result?.totalDiscovered || 0,
        leads: result?.leads || [],
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('[Discover Scan API Error]:', err);
    if (err?.message === 'NEXT_REDIRECT') throw err;
    return NextResponse.json(
      { success: false, error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
