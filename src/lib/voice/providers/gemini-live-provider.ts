import { GoogleGenAI } from '@google/genai';

export interface GeminiLiveCallbacks {
  onAudioOutput?: (base64Pcm: string) => void;
  onTextTranscription?: (speaker: 'User' | 'Gemini', text: string) => void;
  onInterrupted?: () => void;
  onToolCall?: (toolCall: any) => void;
  onError?: (err: any) => void;
  onClose?: () => void;
}

export class GeminiLiveProvider {
  private ai: GoogleGenAI;
  private session: any = null;
  private callbacks: GeminiLiveCallbacks;

  constructor(callbacks?: GeminiLiveCallbacks) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("VOICE_AI_PROVIDER configuration error: GEMINI_API_KEY is missing. Do not silently fall back to fake voice in live mode.");
    }
    this.ai = new GoogleGenAI({ apiKey });
    this.callbacks = callbacks || {};
  }

  async createSession(systemInstruction: string, tools: any[] = []) {
    const model = process.env.GEMINI_LIVE_MODEL || 'gemini-2.5-flash-native-audio-preview-12-2025';
    const voice = process.env.GEMINI_LIVE_VOICE || 'Aoede';

    const config: any = {
      responseModalities: ['AUDIO'],
      systemInstruction: { parts: [{ text: systemInstruction }] },
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: voice
          }
        }
      }
    };

    if (tools && tools.length > 0) {
      config.tools = tools;
    }

    this.configureSession(config);

    this.session = await this.ai.live.connect({
      model,
      config,
      callbacks: {
        onopen: () => {
          console.log('[GeminiLive] Session connected');
        },
        onmessage: (response: any) => {
          this.receiveAudio(response);
        },
        onerror: (error: any) => {
          console.error('[GeminiLive] Session error:', error);
          if (this.callbacks.onError) this.callbacks.onError(error);
        },
        onclose: () => {
          console.log('[GeminiLive] Session closed');
          if (this.callbacks.onClose) this.callbacks.onClose();
        }
      }
    });
  }

  configureSession(config: any) {
    // Session is configured at connection time via @google/genai.
    // Preserving this method as requested by abstraction.
    console.log('[GeminiLive] Configuring session with:', JSON.stringify(config));
  }

  sendAudio(base64Pcm: string) {
    if (!this.session) return;
    this.session.sendRealtimeInput({
      audio: { data: base64Pcm, mimeType: 'audio/pcm;rate=16000' }
    });
  }

  receiveAudio(response: any) {
    const content = response.serverContent;
    if (!content) return;

    // Handle Audio output and Tool calls
    if (content.modelTurn?.parts) {
      for (const part of content.modelTurn.parts) {
        if (part.inlineData && this.callbacks.onAudioOutput) {
          this.callbacks.onAudioOutput(part.inlineData.data); // base64 string
        }
        if (part.functionCall && this.callbacks.onToolCall) {
          this.callbacks.onToolCall(part.functionCall);
        }
      }
    }

    // Handle transcriptions
    if (content.inputTranscription && this.callbacks.onTextTranscription) {
      this.callbacks.onTextTranscription('User', content.inputTranscription.text);
    }
    if (content.outputTranscription && this.callbacks.onTextTranscription) {
      this.callbacks.onTextTranscription('Gemini', content.outputTranscription.text);
    }

    // Handle interruption
    if (content.interrupted && this.callbacks.onInterrupted) {
      this.callbacks.onInterrupted();
    }
  }

  sendToolResult(toolResponses: any[]) {
    if (!this.session) return;
    this.session.sendToolResponse({ functionResponses: toolResponses });
  }

  interrupt() {
    if (!this.session) return;
    // Client-side interruption (Hybrid VAD)
    this.session.sendRealtimeInput({ audioStreamEnd: true });
  }

  closeSession() {
    if (this.session) {
      this.session.close();
      this.session = null;
    }
  }
}
