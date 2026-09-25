import { prisma } from '../db/prisma';
import { performHumanHandoff } from './intelligence';
import twilio from 'twilio';

export const voiceToolsDeclaration = {
  functionDeclarations: [
    {
      name: 'get_lead_context',
      description: 'Gets additional contextual data about the lead.',
      parameters: { type: 'OBJECT', properties: {} }
    },
    {
      name: 'get_business_context',
      description: 'Gets extensive business knowledge for the workspace.',
      parameters: { type: 'OBJECT', properties: {} }
    },
    {
      name: 'update_call_signal',
      description: 'Updates a tracked call signal like sentiment or intent.',
      parameters: {
        type: 'OBJECT',
        properties: {
          sentiment: { type: 'STRING', description: 'POSITIVE, NEUTRAL, NEGATIVE, HIGHLY_INTERESTED' },
          intentScore: { type: 'INTEGER', description: '0 to 100 representing buying intent.' }
        }
      }
    },
    {
      name: 'update_qualification',
      description: 'Updates the qualification score and summary of the lead.',
      parameters: {
        type: 'OBJECT',
        properties: {
          score: { type: 'INTEGER' },
          summary: { type: 'STRING' }
        }
      }
    },
    {
      name: 'request_human_handoff',
      description: 'Call this tool when the user asks to speak with a human, sales team, or requests human assistance.',
      parameters: { type: 'OBJECT', properties: {} }
    },
    {
      name: 'send_calendly_sms',
      description: 'Sends an SMS containing the Calendly booking link to the lead. Use this when the lead explicitly asks to book a meeting or requests human assistance.',
      parameters: { type: 'OBJECT', properties: {} }
    },
    {
      name: 'check_booking_status',
      description: 'Checks if the lead has successfully booked a meeting.',
      parameters: { type: 'OBJECT', properties: {} }
    },
    {
      name: 'create_human_callback',
      description: 'Schedules a manual human callback if the lead requests it.',
      parameters: {
        type: 'OBJECT',
        properties: {
          reason: { type: 'STRING' }
        },
        required: ['reason']
      }
    },
    {
      name: 'opt_out_lead',
      description: 'Opts out the lead from future outreach.',
      parameters: { type: 'OBJECT', properties: {} }
    },
    {
      name: 'create_follow_up',
      description: 'Creates a follow-up task plan based on the conversation.',
      parameters: {
        type: 'OBJECT',
        properties: {
          reason: { type: 'STRING' },
          action: { type: 'STRING' }
        }
      }
    },
    {
      name: 'end_call',
      description: 'Signals that the AI is ending the conversation.',
      parameters: { type: 'OBJECT', properties: {} }
    }
  ]
};

export interface SessionContext {
  workspaceId: string;
  leadId: string;
  callId: string;
  twilioCallSid?: string;
}

export async function executeVoiceTool(name: string, args: any, context: SessionContext) {
  const startMs = Date.now();
  let result: any = null;
  let success = true;

  try {
    switch (name) {
      case 'get_lead_context':
        const lead = await prisma.lead.findUnique({ where: { id: context.leadId } });
        result = { success: true, context: lead ? `Title: ${lead.title}, CRM Status: ${lead.crmStatus}` : 'Unknown' };
        break;

      case 'get_business_context':
        const biz = await prisma.businessProfile.findUnique({ where: { workspaceId: context.workspaceId } });
        result = { success: true, context: biz ? `Target: ${biz.targetGeographies || 'Global'}` : 'Unknown' };
        break;

      case 'update_call_signal':
        if (args.sentiment) {
          await prisma.call.update({
            where: { id: context.callId },
            data: { sentiment: args.sentiment }
          });
        }
        if (args.intentScore !== undefined) {
          await prisma.lead.update({
            where: { id: context.leadId },
            data: { intentScore: args.intentScore }
          });
        }
        result = { success: true, updated: true };
        break;

      case 'update_qualification':
        await prisma.qualification.create({
          data: {
            leadId: context.leadId,
            overallScore: args.score || 50,
            summary: args.summary || 'Updated via voice interaction',
            status: args.score >= 70 ? 'QUALIFIED' : 'PENDING'
          }
        });
        result = { success: true };
        break;

      case 'request_human_handoff':
        await prisma.activityLog.create({
          data: {
            workspaceId: context.workspaceId,
            leadId: context.leadId,
            action: 'HUMAN_HANDOFF_REQUESTED',
            details: 'Lead requested human assistance via natural language.'
          }
        });

        const transferNumber = process.env.TWILIO_HUMAN_TRANSFER_NUMBER;
        if (transferNumber && context.twilioCallSid) {
          try {
            const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
            await client.calls(context.twilioCallSid).update({
              twiml: `<Response><Say>Transferring you to our team.</Say><Dial>${transferNumber}</Dial></Response>`
            });
            result = { success: true, action: 'transfer', message: 'Call is being transferred to a human agent.' };
          } catch (e: any) {
            console.error('[Voice Tools] Transfer Error:', e);
            result = { success: false, action: 'transfer_failed', error: e.message };
          }
        } else {
          try {
            const handoffResult = await performHumanHandoff({ callId: context.callId, leadId: context.leadId, sendCalendlySms: true });
            result = { success: true, action: 'calendly_sms_sent', message: 'SMS with Calendly booking link was sent.' };
          } catch (e: any) {
            console.error('[Voice Tools] Calendly SMS Error:', e);
            result = { success: false, action: 'calendly_failed', error: e.message };
          }
        }
        break;

      case 'send_calendly_sms':
        // Use existing human handoff service logic
        try {
          const handoffResult = await performHumanHandoff({ callId: context.callId, leadId: context.leadId, sendCalendlySms: true });
          result = { success: true, status: 'sent', message: 'SMS with Calendly link has been dispatched.' };
        } catch (e: any) {
          console.error('[Voice Tools] SMS Dispatch Error:', e);
          result = { success: false, status: 'failed', error: e.message || 'SMS not configured or failed to send' };
        }
        break;

      case 'check_booking_status':
        const booking = await prisma.meetingBooking.findFirst({
          where: { callId: context.callId },
          orderBy: { createdAt: 'desc' }
        });
        result = { success: true, booked: booking?.status === 'BOOKED' };
        break;

      case 'create_human_callback':
        await prisma.callback.create({
          data: {
            callId: context.callId,
            leadId: context.leadId,
            reason: args.reason || 'Requested human callback',
            scheduledAt: new Date(Date.now() + 86400000), // Default +24h
            status: 'PENDING'
          }
        });
        result = { success: true, scheduled: true };
        break;

      case 'opt_out_lead':
        await prisma.call.update({
          where: { id: context.callId },
          data: { optOut: true }
        });
        await prisma.lead.update({
          where: { id: context.leadId },
          data: { status: 'ARCHIVED' }
        });
        result = { success: true, optOut: true };
        break;

      case 'create_follow_up':
        await prisma.followUpPlan.create({
          data: {
            leadId: context.leadId,
            callId: context.callId,
            reason: args.reason || 'Follow up required',
            action: args.action || 'RETRY_CALL',
            expectedOutcome: 'Check status',
            status: 'PENDING'
          }
        });
        result = { success: true };
        break;

      case 'end_call':
        await prisma.call.update({
          where: { id: context.callId },
          data: { status: 'COMPLETED', endedAt: new Date() }
        });
        result = { success: true };
        break;

      default:
        success = false;
        result = { success: false, error: 'Unknown tool' };
    }
  } catch (error: any) {
    console.error(`[Voice Tools] Execution error in ${name}:`, error);
    success = false;
    result = { success: false, error: error.message };
  }

  const durationMs = Date.now() - startMs;

  // Log Telemetry
  try {
    await prisma.activityLog.create({
      data: {
        workspaceId: context.workspaceId,
        leadId: context.leadId,
        action: 'VOICE_TOOL_EXECUTED',
        details: `Tool ${name} executed in ${durationMs}ms`,
        metadata: JSON.stringify({
          tool: name,
          success,
          durationMs,
          args // Log arguments received (no PII directly, mostly signals)
        })
      }
    });
  } catch (e) {
    console.error('[Voice Tools] Failed to log telemetry:', e);
  }

  return result;
}
