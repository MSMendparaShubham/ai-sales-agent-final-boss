import { NextResponse } from 'next/server';
import { getAdminData } from '@/lib/scoring';
import { requireSession } from '@/lib/auth/auth-utils';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  try {
    const session = await requireSession();
    let firstMembership = await prisma.workspaceMember.findFirst({
      where: { userId: session.user.id }
    });
    
    if (!firstMembership) {
      let ws = await prisma.workspace.findFirst();
      if (!ws) {
        ws = await prisma.workspace.create({
          data: { name: 'IntentOS Enterprise Workspace' }
        });
      }
      firstMembership = await prisma.workspaceMember.create({
        data: {
          userId: session.user.id,
          workspaceId: ws.id,
          role: 'ADMIN'
        }
      });
    }

    const data = await getAdminData();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching admin data:', error);
    if (error?.message === 'NEXT_REDIRECT') throw error;
    return NextResponse.json({ error: 'Failed to fetch admin data' }, { status: 500 });
  }
}

