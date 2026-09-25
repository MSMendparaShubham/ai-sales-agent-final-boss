import { GeminiLiveProvider, GeminiLiveCallbacks } from './gemini-live-provider';
import { DemoVoiceProvider } from '../demo-voice-provider';

export function getVoiceAiProvider(callbacks?: GeminiLiveCallbacks): GeminiLiveProvider | DemoVoiceProvider {
  const providerType = process.env.VOICE_AI_PROVIDER || 'demo';
  
  if (providerType === 'gemini') {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("VOICE_AI_PROVIDER configuration error: GEMINI_API_KEY is missing. Do not silently fall back to fake voice in live mode.");
    }
    return new GeminiLiveProvider(callbacks);
  }
  
  return new DemoVoiceProvider();
}
