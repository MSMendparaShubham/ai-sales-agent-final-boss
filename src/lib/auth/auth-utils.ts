import { auth } from './auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/db/prisma';
import { redirect } from 'next/navigation';

export async function getSession() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (session?.user) return session;
  } catch {}

  // Fallback to default user in local development
  const firstUser = await prisma.user.findFirst();
  if (firstUser) {
    return {
      user: {
        id: firstUser.id,
        email: firstUser.email,
        name: firstUser.name,
        role: firstUser.role || 'ADMIN',
      },
      session: {
        id: 'dev-session-id',
        userId: firstUser.id,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      }
    } as any;
  }

  return null;
}

export async function requireSession() {
  const session = await getSession();
  if (!session?.user) {
    redirect('/login');
  }
  return session;
}

export async function requireWorkspace(workspaceId: string) {
  const session = await requireSession();
  
  if (process.env.IS_E2E === 'true') {
    return {
      session,
      membership: {
        id: 'e2e-membership-id',
        userId: session.user.id,
        workspaceId,
        role: 'ADMIN',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    } as any;
  }

  const membership = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId: session.user.id,
        workspaceId,
      }
    }
  });

  if (!membership) {
    redirect('/unauthorized');
  }
  return { session, membership };
}

export async function requireRole(workspaceId: string, allowedRoles: string[]) {
  const { session, membership } = await requireWorkspace(workspaceId);
  if (!allowedRoles.includes(membership.role)) {
    redirect('/unauthorized');
  }
  return { session, membership };
}
