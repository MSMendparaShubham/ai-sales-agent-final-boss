import { NextRequest, NextResponse } from 'next/server';
import { getCampaignsData } from '@/lib/scoring';
import { prisma } from '@/lib/db/prisma';
import { requireSession, requireWorkspace } from '@/lib/auth/auth-utils';
import { LocalDeterministicCampaignRunner } from '@/lib/campaigns/runner';

export async function GET() {
  try {
    const campaigns = await getCampaignsData();
    return NextResponse.json(campaigns);
  } catch (error: any) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
  }
}

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
    const {
      name,
      objective,
      targetAudience,
      minIntentScore = 70,
      industries,
      locations,
      languages,
      callingWindowStart = '09:00',
      callingWindowEnd = '17:00',
      timezonePolicy = 'PROSPECT_LOCAL',
      retryPolicy = 'EXPONENTIAL_BACKOFF',
      maxAttempts = 3,
      scheduleMode = 'IMMEDIATE',
    } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const campaign = await prisma.campaign.create({
      data: {
        workspaceId: membership.workspaceId,
        name,
        objective: objective || 'Drive initial qualification',
        targetAudience,
        minIntentScore: Number(minIntentScore),
        industries: industries ? JSON.stringify(industries) : undefined,
        locations: locations ? JSON.stringify(locations) : undefined,
        languages: languages ? JSON.stringify(languages) : undefined,
        callingWindowStart,
        callingWindowEnd,
        timezonePolicy,
        retryPolicy,
        maxAttempts: Number(maxAttempts),
        scheduleMode,
        status: scheduleMode === 'IMMEDIATE' ? 'ACTIVE' : 'SCHEDULED',
        ownerId: session.user.id,
      },
    });

    let enrolledCount = 0;
    if (campaign.status === 'ACTIVE') {
      const runner = new LocalDeterministicCampaignRunner();
      enrolledCount = await runner.evaluateAudiences(campaign.id);
    }

    await prisma.activityLog.create({
      data: {
        workspaceId: membership.workspaceId,
        action: 'CAMPAIGN_CREATED',
        details: `Created campaign "${name}" with ${enrolledCount} initial leads enrolled.`,
      },
    });

    return NextResponse.json({
      success: true,
      campaign,
      enrolledCount,
    });
  } catch (error: any) {
    console.error('Error creating campaign:', error);
    if (error?.message === 'NEXT_REDIRECT') throw error;
    return NextResponse.json({ error: error.message || 'Failed to create campaign' }, { status: 500 });
  }
}
