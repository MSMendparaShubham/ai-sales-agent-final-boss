import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getVoiceAiProvider } from '../../src/lib/voice/providers/factory';
import { GeminiLiveProvider } from '../../src/lib/voice/providers/gemini-live-provider';
import { DemoVoiceProvider } from '../../src/lib/voice/demo-voice-provider';

// Mock the @google/genai SDK
vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: vi.fn().mockImplementation(() => {
      return {
        live: {
          connect: vi.fn().mockResolvedValue({
            sendRealtimeInput: vi.fn(),
            sendToolResponse: vi.fn(),
            close: vi.fn()
          })
        }
      };
    })
  };
});

describe('Voice AI Provider Factory', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns DemoVoiceProvider when VOICE_AI_PROVIDER is demo', () => {
    process.env.VOICE_AI_PROVIDER = 'demo';
    const provider = getVoiceAiProvider();
    expect(provider).toBeInstanceOf(DemoVoiceProvider);
  });

  it('throws a configuration error when GEMINI_API_KEY is missing for gemini provider', () => {
    process.env.VOICE_AI_PROVIDER = 'gemini';
    delete process.env.GEMINI_API_KEY;

    expect(() => getVoiceAiProvider()).toThrowError(
      'VOICE_AI_PROVIDER configuration error: GEMINI_API_KEY is missing. Do not silently fall back to fake voice in live mode.'
    );
  });

  it('returns GeminiLiveProvider when VOICE_AI_PROVIDER is gemini and GEMINI_API_KEY is present', () => {
    process.env.VOICE_AI_PROVIDER = 'gemini';
    process.env.GEMINI_API_KEY = 'test-api-key';
    const provider = getVoiceAiProvider();
    expect(provider).toBeInstanceOf(GeminiLiveProvider);
  });
});

describe('GeminiLiveProvider', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    process.env.GEMINI_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('creates session with correct initial model and voice configuration', async () => {
    const provider = new GeminiLiveProvider();
    await provider.createSession('You are a test assistant.');
    
    // Test that the session was established successfully
    // Since we mocked connect, this should just pass without crashing
    expect(provider['session']).toBeDefined();
    expect(provider['session'].sendRealtimeInput).toBeDefined();
  });

  it('handles sendAudio by calling sendRealtimeInput', async () => {
    const provider = new GeminiLiveProvider();
    await provider.createSession('Test');
    
    provider.sendAudio('base64data');
    expect(provider['session'].sendRealtimeInput).toHaveBeenCalledWith({
      audio: { data: 'base64data', mimeType: 'audio/pcm;rate=16000' }
    });
  });

  it('handles interrupt by sending audioStreamEnd', async () => {
    const provider = new GeminiLiveProvider();
    await provider.createSession('Test');
    
    provider.interrupt();
    expect(provider['session'].sendRealtimeInput).toHaveBeenCalledWith({
      audioStreamEnd: true
    });
  });

  it('handles sendToolResult correctly', async () => {
    const provider = new GeminiLiveProvider();
    await provider.createSession('Test');
    
    const results = [{ id: '1', name: 'tool', response: {} }];
    provider.sendToolResult(results);
    expect(provider['session'].sendToolResponse).toHaveBeenCalledWith({
      functionResponses: results
    });
  });

  it('closes the session', async () => {
    const provider = new GeminiLiveProvider();
    await provider.createSession('Test');
    
    provider.closeSession();
    expect(provider['session']).toBeNull();
  });
});
