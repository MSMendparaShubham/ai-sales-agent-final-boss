import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { checkVoiceBudget } from '@/lib/voice/budget-guard';
import { createNotification } from '@/lib/notifications';
import twilio from 'twilio';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { leadId, campaignId, language = 'en-US' } = body;

    if (!leadId) {
      return NextResponse.json({ error: 'leadId is required' }, { status: 400 });
    }

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        company: true,
      },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }
    if (!lead.phone) {
      return NextResponse.json({ error: 'Lead has no phone number' }, { status: 400 });
    }

    // Safety checks
    const workspaceId = lead.workspaceId;
    const budgetCheck = await checkVoiceBudget(workspaceId);
    
    if (!budgetCheck.allowed) {
      await createNotification(
        workspaceId,
        'USAGE_LIMIT',
        'Voice Limit Exceeded or Blocked',
        budgetCheck.reason || `You have exceeded your plan's voice limit.`,
        'ERROR',
        '/settings/billing'
      );
      return NextResponse.json({ error: budgetCheck.reason || 'Voice limit reached.' }, { status: 402 });
    }

    // Create Call
    const call = await prisma.call.create({
      data: {
        workspaceId,
        leadId,
        campaignId: campaignId || null,
        status: 'RINGING',
        startedAt: new Date(),
        language,
        maxAttempts: 3,
        retryDelay: 86400
      }
    });

    // Create CallAttempt
    const attempt = await prisma.callAttempt.create({
      data: {
        callId: call.id,
        disposition: 'CONNECTED',
        startTime: new Date()
      }
    });

    const isDemoMode = process.env.DEMO_MODE === 'true';

    // Check Twilio creds if we need to call
    if (!isDemoMode) {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

      if (!accountSid || !authToken || !twilioPhone) {
        return NextResponse.json({ 
          error: 'Twilio credentials not configured in environment for live outbound calls.' 
        }, { status: 500 });
      }

      const client = twilio(accountSid, authToken);
      const voiceProvider = process.env.VOICE_AI_PROVIDER || 'gemini';
      if (voiceProvider === 'gemini' && !process.env.GEMINI_API_KEY) {
        return NextResponse.json({
          error: 'Gemini Live is not configured. Set GEMINI_API_KEY in the server environment.'
        }, { status: 500 });
      }
      const voiceGatewayUrl = process.env.VOICE_GATEWAY_URL || process.env.NEXT_PUBLIC_VOICE_GATEWAY_URL || `wss://${req.headers.get('host')}/voice-gateway`;

      let twiml = '';
      if (voiceProvider === 'gemini') {
        twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="${voiceGatewayUrl}">
      <Parameter name="callId" value="${call.id}" />
      <Parameter name="leadId" value="${lead.id}" />
      <Parameter name="workspaceId" value="${workspaceId}" />
    </Stream>
  </Connect>
</Response>`;
      } else {
        twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Hello, this is the IntentOS deterministic demo.</Say>
  <Pause length="2" />
  <Say>Goodbye.</Say>
</Response>`;
      }

      try {
        await client.calls.create({
          twiml,
          to: lead.phone,
          from: twilioPhone
        });
        
        await prisma.activityLog.create({
          data: {
            workspaceId,
            leadId,
            action: 'OUTBOUND_CALL_DISPATCHED',
            details: `Real Twilio Outbound Call dispatched to ${lead.phone}.`
          }
        });
      } catch (err: any) {
        console.error('[Twilio Outbound Error]', err);
        await prisma.callAttempt.update({
          where: { id: attempt.id },
          data: { disposition: 'FAILED', errorMessage: err.message, endTime: new Date() }
        });
        await prisma.call.update({
          where: { id: call.id },
          data: { status: 'FAILED' }
        });
        return NextResponse.json({ error: 'Twilio call dispatch failed', details: err.message }, { status: 500 });
      }
    } else {
      await prisma.activityLog.create({
        data: {
          workspaceId,
          leadId,
          action: 'OUTBOUND_CALL_SIMULATED',
          details: `Outbound Call to ${lead.phone} simulated (DEMO_MODE=true).`
        }
      });
    }

    return NextResponse.json({
      success: true,
      callId: call.id,
      attemptId: attempt.id,
      isDemoMode,
      message: isDemoMode 
        ? 'Call simulated in DEMO_MODE' 
        : 'Twilio call dispatched successfully'
    });

  } catch (error: any) {
    console.error('Error starting real call:', error);
    return NextResponse.json({ error: error.message || 'Failed to start call' }, { status: 500 });
  }
}
