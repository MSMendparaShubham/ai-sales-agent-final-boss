import { NextRequest, NextResponse } from 'next/server';
import { getCallById } from '@/lib/scoring';
import { prisma } from '@/lib/db/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const call = await getCallById(id);

    if (!call) {
      return NextResponse.json({ error: 'Call not found' }, { status: 404 });
    }

    return NextResponse.json(call);
  } catch (error: any) {
    console.error('Error fetching call detail:', error);
    return NextResponse.json({ error: 'Failed to fetch call' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const {
      status,
      summary,
      sentiment,
      interestLevel,
      nextStep,
      durationSeconds,
      recordingUrl,
      transcript,
      qualificationScore,
    } = body;

    const existingCall = await prisma.call.findUnique({
      where: { id },
      include: { lead: true },
    });

    if (!existingCall) {
      return NextResponse.json({ error: 'Call not found' }, { status: 404 });
    }

    const updatedCall = await prisma.call.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(summary && { summary }),
        ...(sentiment && { sentiment }),
        ...(interestLevel && { interestLevel }),
        ...(nextStep && { nextStep }),
        ...(durationSeconds !== undefined && { durationSeconds: Number(durationSeconds) }),
        ...(recordingUrl && { recordingUrl }),
        endedAt: new Date(),
        ...(transcript && {
          transcript: {
            upsert: {
              create: {
                dialogue: typeof transcript === 'string' ? transcript : JSON.stringify(transcript),
                rawText: typeof transcript === 'string' ? transcript : JSON.stringify(transcript),
              },
              update: {
                dialogue: typeof transcript === 'string' ? transcript : JSON.stringify(transcript),
                rawText: typeof transcript === 'string' ? transcript : JSON.stringify(transcript),
              },
            },
          },
        }),
      },
    });

    // Update lead status automatically based on call outcome
    if (existingCall.leadId) {
      const newLeadStatus =
        interestLevel === 'HIGH' || interestLevel === 'EXTREME' || (qualificationScore && Number(qualificationScore) >= 75)
          ? 'QUALIFIED'
          : status === 'COMPLETED'
          ? 'CONTACTED'
          : undefined;

      if (newLeadStatus || qualificationScore !== undefined) {
        await prisma.lead.update({
          where: { id: existingCall.leadId },
          data: {
            ...(newLeadStatus && { status: newLeadStatus }),
            ...(qualificationScore !== undefined && { qualificationScore: Number(qualificationScore) }),
          },
        });
      }
    }

    return NextResponse.json({ success: true, call: updatedCall });
  } catch (error: any) {
    console.error('Error updating call:', error);
    return NextResponse.json({ error: 'Failed to update call record' }, { status: 500 });
  }
}
