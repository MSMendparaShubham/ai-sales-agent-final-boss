import { WebSocketServer, WebSocket } from 'ws';
import { WaveFile } from 'wavefile';
import { GeminiLiveProvider } from '../lib/voice/providers/gemini-live-provider';
import { prisma } from '../lib/db/prisma';
import { buildVoiceContext } from '../lib/voice/context-builder';
import { voiceToolsDeclaration, executeVoiceTool } from '../lib/voice/tools-dispatcher';
import { checkVoiceBudget, persistVoiceSessionUsage } from '../lib/voice/budget-guard';

interface SessionMetrics {
  audioPacketsIn: number;
  audioPacketsOut: number;
  bytesIn: number;
  bytesOut: number;
  startTime: number;
  latencySamples: number[];
}

export class VoiceGateway {
  private wss: WebSocketServer;

  constructor(port: number) {
    this.wss = new WebSocketServer({ port });
    this.wss.on('connection', this.handleConnection.bind(this));
    console.log(`[VoiceGateway] Listening on ws://localhost:${port}`);
  }

  private async handleConnection(ws: WebSocket) {
    console.log('[VoiceGateway] New Twilio connection established');
    
    let gemini: GeminiLiveProvider | null = null;
    let streamSid: string | null = null;
    let twilioCallSid: string | null = null;
    let callId: string | null = null;
    let leadId: string | null = null;
    let workspaceId: string | null = null;
    
    const metrics: SessionMetrics = {
      audioPacketsIn: 0,
      audioPacketsOut: 0,
      bytesIn: 0,
      bytesOut: 0,
      startTime: Date.now(),
      latencySamples: []
    };
    
    let maxSessionTimer: NodeJS.Timeout | null = null;

    ws.on('message', async (message: string) => {
      try {
        const msg = JSON.parse(message);

        if (msg.event === 'start') {
          streamSid = msg.start.streamSid;
          twilioCallSid = msg.start.callSid;
          
          // Custom parameters passed via Twilio TwiML <Stream url="...">
          callId = msg.start.customParameters?.callId || 'demo-call-123';
          leadId = msg.start.customParameters?.leadId || 'demo-lead-123';
          
          console.log(`[VoiceGateway] Stream started. StreamSid: ${streamSid}, CallSid: ${twilioCallSid}`);

          // Load lead/business context from IntentOS
          let systemInstruction = 'You are a helpful AI sales agent.';
          try {
            if (!leadId) throw new Error('No leadId');
            if (callId) {
              const callData = await prisma.call.findUnique({ where: { id: callId } });
              if (callData) {
                workspaceId = callData.workspaceId;
                systemInstruction = await buildVoiceContext({ leadId, language: callData.language || 'en-US' });
              }
            } else {
              systemInstruction = await buildVoiceContext({ leadId, language: 'en-US' });
            }
          } catch (err) {
            console.warn('[VoiceGateway] Could not load lead from DB, using fallback instruction.', err);
          }

          if (workspaceId) {
            const budgetCheck = await checkVoiceBudget(workspaceId);
            if (!budgetCheck.allowed) {
              console.warn('[VoiceGateway] Budget limit exceeded:', budgetCheck.reason);
              ws.close();
              return;
            }
            
            const maxDurationMs = budgetCheck.config.maxSessionSeconds * 1000;
            maxSessionTimer = setTimeout(() => {
              console.log('[VoiceGateway] Maximum session duration reached. Ending call gracefully.');
              if (ws.readyState === WebSocket.OPEN) {
                 ws.send(JSON.stringify({ event: 'clear', streamSid })); // Flush audio
              }
              if (gemini) gemini.closeSession();
              ws.close();
            }, maxDurationMs);
          }

          // Create Gemini Live session
          gemini = new GeminiLiveProvider({
            onAudioOutput: (base64Pcm: string) => {
              if (!streamSid || ws.readyState !== WebSocket.OPEN) return;
              
              metrics.audioPacketsOut++;
              metrics.bytesOut += Buffer.byteLength(base64Pcm, 'base64');

              // Convert Gemini PCM 24kHz -> Twilio µ-law 8kHz
              const pcmBuffer = Buffer.from(base64Pcm, 'base64');
              const wav = new WaveFile();
              wav.fromScratch(1, 24000, '16', pcmBuffer);
              wav.toSampleRate(8000);
              wav.toMuLaw();
              
              const mulawBase64 = Buffer.from((wav.data as any).samples).toString('base64');
              
              ws.send(JSON.stringify({
                event: 'media',
                streamSid: streamSid,
                media: { payload: mulawBase64 }
              }));
            },
            onInterrupted: () => {
              console.log('[VoiceGateway] Interruption detected by Gemini VAD. Clearing Twilio buffer.');
              if (streamSid && ws.readyState === WebSocket.OPEN) {
                // Clear Twilio's audio buffer to instantly stop stale AI speech
                ws.send(JSON.stringify({
                  event: 'clear',
                  streamSid: streamSid
                }));
              }
            },
            onToolCall: async (toolCall: any) => {
              if (!workspaceId || !leadId || !callId) {
                gemini?.sendToolResult([{
                  id: toolCall.id,
                  name: toolCall.name,
                  response: { success: false, error: 'Context uninitialized' }
                }]);
                return;
              }

              console.log(`[VoiceGateway] Tool call requested: ${toolCall.name}`);
              
              const result = await executeVoiceTool(toolCall.name, toolCall.args, {
                workspaceId,
                leadId,
                callId,
                twilioCallSid: twilioCallSid || undefined
              });

              gemini?.sendToolResult([{
                id: toolCall.id,
                name: toolCall.name,
                response: result
              }]);
            },
            onClose: () => {
              console.log('[VoiceGateway] Gemini session closed');
              ws.close();
            }
          });

          await gemini.createSession(systemInstruction, [voiceToolsDeclaration]);
          
        } else if (msg.event === 'media') {
          if (!gemini) return;
          
          const payload = msg.media.payload;
          metrics.audioPacketsIn++;
          metrics.bytesIn += Buffer.byteLength(payload, 'base64');
          
          // Convert Twilio µ-law 8kHz -> Gemini PCM 16kHz
          const mulawBuffer = Buffer.from(payload, 'base64');
          const wav = new WaveFile();
          wav.fromScratch(1, 8000, '8m', mulawBuffer);
          wav.fromMuLaw();
          wav.toSampleRate(16000);
          
          const pcmBase64 = Buffer.from((wav.data as any).samples).toString('base64');
          gemini.sendAudio(pcmBase64);

        } else if (msg.event === 'stop') {
          console.log(`[VoiceGateway] Stream stopped by Twilio. StreamSid: ${streamSid}`);
          if (gemini) {
            gemini.closeSession();
          }
          ws.close();
        }

      } catch (err) {
        console.error('[VoiceGateway] Error processing Twilio message:', err);
      }
    });

    ws.on('close', async () => {
      console.log(`[VoiceGateway] Connection closed for stream ${streamSid}`);
      if (maxSessionTimer) clearTimeout(maxSessionTimer);
      if (gemini) {
        gemini.closeSession();
      }

      const duration = Date.now() - metrics.startTime;
      console.log(`[VoiceGateway] Session Metrics:
        Duration: ${duration}ms
        Audio Packets (In/Out): ${metrics.audioPacketsIn} / ${metrics.audioPacketsOut}
        Bytes (In/Out): ${metrics.bytesIn} / ${metrics.bytesOut}
      `);

      // Persist cleanup
      if (callId && twilioCallSid) {
        try {
          await prisma.call.updateMany({
            where: { id: callId },
            data: { status: 'COMPLETED' }
          });
          
          if (workspaceId && leadId) {
            await persistVoiceSessionUsage(workspaceId, Math.ceil(duration / 1000));
            await prisma.activityLog.create({
              data: {
                workspaceId: workspaceId,
                leadId: leadId,
                action: 'VOICE_GATEWAY_SESSION',
                details: `Voice Gateway session completed. Duration: ${Math.round(duration/1000)}s.`,
                metadata: JSON.stringify({
                  streamSid,
                  twilioCallSid,
                  metrics
                })
              }
            });
          }
        } catch (err) {
          console.error('[VoiceGateway] Failed to persist cleanup:', err);
        }
      }
    });
  }
}

// Support isolated audio test mode
if (require.main === module) {
  console.log('[VoiceGateway] Starting isolated audio test mode...');
  const port = parseInt(process.env.VOICE_GATEWAY_PORT || process.env.PORT || '8080', 10);
  new VoiceGateway(port);
}
