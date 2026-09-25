import { NextRequest, NextResponse } from 'next/server';
import { requireSession, requireWorkspace } from '@/lib/auth/auth-utils';
import { prisma } from '@/lib/db/prisma';

export async function GET(_req: NextRequest) {
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

    const history = await prisma.scanHistory.findMany({
      where: {
        OR: [
          { workspaceId: membership.workspaceId },
          { workspaceId: null },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        leads: {
          include: {
            company: true,
            source: true,
            requirements: true,
            discoveryResults: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return NextResponse.json({ success: true, history });
  } catch (error: any) {
    console.error('[Discover History GET Error]:', error);
    if (error?.message === 'NEXT_REDIRECT') throw error;
    return NextResponse.json({ error: error.message || 'Failed to fetch scan history' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest) {
  try {
    const session = await requireSession();
    let firstMembership = await prisma.workspaceMember.findFirst({
      where: { userId: session.user.id },
    });

    if (firstMembership) {
      await prisma.scanHistory.deleteMany({
        where: {
          OR: [
            { workspaceId: firstMembership.workspaceId },
            { workspaceId: null },
          ],
        },
      });
    } else {
      await prisma.scanHistory.deleteMany();
    }

    return NextResponse.json({ success: true, message: 'Scan history cleared successfully' });
  } catch (error: any) {
    console.error('[Discover History DELETE Error]:', error);
    if (error?.message === 'NEXT_REDIRECT') throw error;
    return NextResponse.json({ error: error.message || 'Failed to clear scan history' }, { status: 500 });
  }
}
