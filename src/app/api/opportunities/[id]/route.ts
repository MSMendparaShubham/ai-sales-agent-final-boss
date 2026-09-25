import { NextRequest, NextResponse } from 'next/server';
import { getOpportunityById } from '@/lib/scoring';
import { prisma } from '@/lib/db/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const opportunity = await getOpportunityById(id);

    if (!opportunity) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
    }

    return NextResponse.json(opportunity);
  } catch (error: any) {
    console.error('Error fetching opportunity detail:', error);
    return NextResponse.json({ error: 'Failed to fetch opportunity' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, intentScore, qualificationScore, pipelineValue, urgency } = body;

    const updated = await prisma.lead.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(intentScore !== undefined && { intentScore: Number(intentScore) }),
        ...(qualificationScore !== undefined && { qualificationScore: Number(qualificationScore) }),
        ...(pipelineValue !== undefined && { pipelineValue: Number(pipelineValue) }),
        ...(urgency && { urgency }),
      },
      include: {
        company: true,
        source: true,
        requirements: true,
      },
    });

    return NextResponse.json({ success: true, lead: updated });
  } catch (error: any) {
    console.error('Error updating opportunity:', error);
    return NextResponse.json({ error: 'Failed to update opportunity' }, { status: 500 });
  }
}
