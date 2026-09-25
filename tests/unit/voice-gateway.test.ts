import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { VoiceGateway } from '../../src/server/voice-gateway';
import { WebSocket, WebSocketServer } from 'ws';
import { GeminiLiveProvider } from '../../src/lib/voice/providers/gemini-live-provider';
import { prisma } from '../../src/lib/db/prisma';
import { WaveFile } from 'wavefile';

vi.mock('ws', () => {
  const mWebSocketServer = {
    on: vi.fn(),
    close: vi.fn()
  };
  const mWebSocket = {
    on: vi.fn(),
    send: vi.fn(),
    close: vi.fn(),
    readyState: 1 // WebSocket.OPEN
  };
  return {
    WebSocketServer: vi.fn(() => mWebSocketServer),
    WebSocket: { OPEN: 1, CLOSED: 3 }
  };
});

vi.mock('../../src/lib/voice/providers/gemini-live-provider', () => {
  return {
    GeminiLiveProvider: vi.fn().mockImplementation(() => {
      return {
        createSession: vi.fn(),
        sendAudio: vi.fn(),
        closeSession: vi.fn()
      };
    })
  };
});

vi.mock('../../src/lib/db/prisma', () => ({
  prisma: {
    lead: { findUnique: vi.fn() },
    call: { updateMany: vi.fn() },
    activityLog: { create: vi.fn() }
  }
}));

vi.mock('wavefile', () => {
  return {
    WaveFile: vi.fn().mockImplementation(() => {
      return {
        fromScratch: vi.fn(),
        fromMuLaw: vi.fn(),
        toSampleRate: vi.fn(),
        toMuLaw: vi.fn(),
        data: { samples: new Uint8Array([0, 1, 2, 3]) }
      };
    })
  };
});

describe('Voice Gateway', () => {
  let gateway: VoiceGateway;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes WebSocketServer on the specified port', () => {
    gateway = new VoiceGateway(8080);
    expect(WebSocketServer).toHaveBeenCalledWith({ port: 8080 });
  });

  it('binds connection handler', () => {
    gateway = new VoiceGateway(8080);
    const wssInstance = (WebSocketServer as unknown as ReturnType<typeof vi.fn>).mock.results[0].value;
    expect(wssInstance.on).toHaveBeenCalledWith('connection', expect.any(Function));
  });
});
