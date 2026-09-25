# Zero-Cost Voice Architecture

## Core Philosophy

IntentOS operates strictly as a $0 AI cost platform. It avoids all reliance on expensive, consumption-based, proprietary models like OpenAI, Anthropic, ElevenLabs, Deepgram, and AssemblyAI. 

The live voice routing mechanism securely implements **Gemini Live API (Native Audio Preview)** as the solitary intelligence engine. 

## Strict Dependency Verification

- **Free AI Provider:** `GEMINI_LIVE_MODEL` (e.g. `gemini-2.5-flash-native-audio-preview-12-2025`). This strictly connects via Google's WebSockets for bidirectional Voice Activity Detection (VAD) and STT/TTS without incurring premium vendor markup.
- **Twilio Credit Dependency:** Real phone connections necessitate Twilio. This is the **only** permitted structural cost. Routing requires live G.711 μ-law SIP handoffs and SMS dispatch. 
- **No-Paid-Fallback Policy:** If Gemini experiences an outage or limits are reached, the system **will not** secretly fallback to OpenAI or ElevenLabs. The `src/lib/voice/providers/factory.ts` and `src/lib/voice/budget-guard.ts` enforce an absolute hard-block against unauthorized providers. It gracefully tears down the Twilio `streamSid`.

## Hardware/Model Configuration
The server runs an independent `VoiceGateway` that interfaces between Twilio's Media Stream API and the Gemini websocket. 
The system requires `VOICE_AI_PROVIDER=gemini` within `.env`. 
When `DEMO_MODE=true` is set, the system bypasses Twilio outbound calls completely, enabling offline deterministic demonstrations using local browser audio.

## Quotas and Budget Limitations
The architectural budget guard protects the instance via `UsageLedger`:
- **`VOICE_MAX_SESSION_SECONDS`**: Strict cap on live call durations (Default 600s).
- **`VOICE_DAILY_SESSION_LIMIT`**: Daily workspace allocation (Default 3,600s).
- **`VOICE_MONTHLY_SESSION_LIMIT`**: Monthly workspace allocation (Default 36,000s).

If limits approach 80%, UI Notifications alert the workspace admin. When the limit is reached, active sessions gracefully flush and disconnect `ws.send({ event: 'clear' })` to prevent accidental billing abuse.

## Real-Call Setup
1. Expose `VoiceGateway` via `ngrok` or production WebSockets.
2. Ensure `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_PHONE_NUMBER` are securely injected into the backend `.env`. 
3. Keys are universally guarded as strictly server-side only; they will never leak into the Next.js `NEXT_PUBLIC_` client bundles.
4. Execute `npm run voice:preflight` before deploying to validate 13 explicit gateway requirements (including TCPA consent constraints and budget capacity checks). 
