# IntentOS Platform Environment Configuration Guide

## Overview

IntentOS is built with a **Strict Zero-Cost Realtime Voice Architecture** powered by Google Gemini Live and Twilio telephony. This document serves as the authoritative specification for all configuration variables, runtime contexts, secrecy boundaries, conditional requirements, and provider resolution logic.

---

## Operational Modes

### 1. `DEMO_MODE=true` (Default)
- **Deterministic local execution**: All telephony and external APIs can run without external credentials.
- **Voice behavior**: Uses local Web Speech API synthesis or deterministic browser audio simulation. No outbound Twilio calls or paid voice APIs are invoked.
- **SMS & Calendly**: SMS dispatch and booking updates are safely simulated in-memory and in the SQLite database without calling third-party endpoints.
- **Billing**: Razorpay checkout operates in simulated / test flow.

### 2. `DEMO_MODE=false` (Live Telephony & AI Mode)
- **Strict requirements**: Requires valid `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`, and `GEMINI_API_KEY`.
- **Telephony**: Twilio initiates real phone calls (`POST /api/calls/real/start`) and connects the prospect to the WebSocket Voice Gateway.
- **Realtime Voice AI**: The Voice Gateway establishes a real-time, bidirectional 8kHz μ-law audio stream with Google Gemini Live (`gemini-2.5-flash-native-audio-preview-12-2025`).
- **No silent fallbacks**: If any required live credential is unset or invalid, the system immediately returns an explicit, human-readable configuration error. It **never** silently falls back to a paid AI provider (e.g. OpenAI) or to fake demo audio in live mode.

---

## Voice AI Provider Resolution

| Variable | Configured Value | Operational Mode | Selected Provider | Behavior |
| :--- | :--- | :--- | :--- | :--- |
| `VOICE_AI_PROVIDER` | `gemini` | `DEMO_MODE=false` | `GeminiLiveProvider` | Real bidirectional voice call via Google Gemini Live API |
| `VOICE_AI_PROVIDER` | `gemini` | `DEMO_MODE=true` | `DemoVoiceProvider` | Deterministic local simulated call |
| `VOICE_AI_PROVIDER` | `demo` | Any | `DemoVoiceProvider` | Deterministic local simulated call |
| `VOICE_AI_PROVIDER` | `openai` / other | Any | **BLOCKED** | Explicit startup/runtime error thrown. Runaway paid AI is strictly blocked |

---

## Complete Environment Variable Inventory

### 1. Core Application & Database

| Variable | Purpose | Required When | Runtime | Example Format | Validation | Security Note |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `DATABASE_URL` | SQLite database connection string | Always | Server | `file:./dev.db` | Non-empty string | Server-only. SQLite DB stored in `./prisma/dev.db`. |
| `NODE_ENV` | Node execution environment | Always | Server / Client | `development` \| `production` | Enum: `development`, `production`, `test` | Standard Node environment. |
| `DEMO_MODE` | Master switch between demo and live mode | Always | Server | `true` \| `false` | Boolean coercion | Default `true`. Determines provider requirements. |
| `APP_URL` | Base URL for webhook routing | Live callbacks | Server | `https://your-domain.com` | Valid URL format | Used to build Twilio status callbacks. |
| `NEXT_PUBLIC_APP_NAME` | Application display name | Optional | Browser / Client | `IntentOS` | String | Safe for public client bundle. |
| `NEXT_PUBLIC_APP_TAGLINE` | Application marketing tagline | Optional | Browser / Client | `Turn public buying signals...` | String | Safe for public client bundle. |

### 2. Authentication

| Variable | Purpose | Required When | Runtime | Example Format | Validation | Security Note |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `BETTER_AUTH_SECRET` | Session encryption key for Better Auth | Production | Server | `rand_hex_string_32_chars` | Min 16 chars | **Secret**. Must never be exposed to the browser. |

### 3. Offline AI Pipeline (Lead Intelligence & Scoring)

| Variable | Purpose | Required When | Runtime | Example Format | Validation | Security Note |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `AI_PROVIDER` | Offline text analysis engine | Always | Server | `demo` \| `ollama` | Enum: `demo`, `ollama` | Zero-cost local engine. |
| `OLLAMA_HOST` | Local Ollama API endpoint | `AI_PROVIDER=ollama` | Server | `http://localhost:11434` | Valid URL | Server-only network request. |
| `OLLAMA_MODEL` | Ollama LLM model tag | `AI_PROVIDER=ollama` | Server | `llama3` | String | Configurable model identifier. |

### 4. Realtime Voice AI (Gemini Live)

| Variable | Purpose | Required When | Runtime | Example Format | Validation | Security Note |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `VOICE_AI_PROVIDER` | Realtime voice provider selection | Always | Server | `gemini` \| `demo` | Enum: `gemini`, `demo` | Strictly enforces $0 AI cost. |
| `GEMINI_API_KEY` | Google Gemini API access key | `DEMO_MODE=false` & `VOICE_AI_PROVIDER=gemini` | Server | `AIzaSy...` | Non-empty string | **Secret**. Server-only. Falls back to `GOOGLE_API_KEY`. |
| `GEMINI_LIVE_MODEL` | Gemini Live bidirectional audio model | When using Gemini | Server | `gemini-2.5-flash-native-audio-preview-12-2025` | Valid model ID | Configurable without code changes. |
| `GEMINI_LIVE_VOICE` | Voice persona for synthesis | Optional | Server | `Aoede` (or `Puck`, `Charon`) | Valid voice name | Controls synthesized voice output timbre. |

### 5. Voice Gateway

| Variable | Purpose | Required When | Runtime | Example Format | Validation | Security Note |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `VOICE_GATEWAY_URL` | WebSocket URL for Twilio Media Streams | Live outbound calls | Server | `wss://gateway.intentos.ai` | `ws://` or `wss://` URI | Passed in TwiML `<Stream>` tag to Twilio. |
| `VOICE_GATEWAY_PORT` | Port for local voice gateway | When running gateway | Server | `8080` | Port integer (1-65535) | Falls back to `PORT` or `8080`. |
| `VOICE_GATEWAY_INTERNAL_SECRET` | Internal secret for gateway auth | Optional | Server | `secret_token` | String | **Secret**. Server-only. |

### 6. Telephony (Twilio)

| Variable | Purpose | Required When | Runtime | Example Format | Validation | Security Note |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `TWILIO_ACCOUNT_SID` | Twilio Account identifier | `DEMO_MODE=false` (live calls) | Server | `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` | Regex: `^AC[a-f0-9]{32}$` | **Secret**. Must never appear in client bundles. |
| `TWILIO_AUTH_TOKEN` | Twilio Account secret key | `DEMO_MODE=false` (live calls) | Server | `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` | Min 32 chars | **Secret**. Must never appear in client bundles. |
| `TWILIO_PHONE_NUMBER` | Outbound caller ID (E.164) | `DEMO_MODE=false` (live calls) | Server | `+14787588866` | E.164 phone format | Server-only. Falls back to `TWILIO_FROM_NUMBER`. |
| `TWILIO_WEBHOOK_SIGNING_KEY` | Twilio signature verification | Webhook ingestion | Server | `rand_signing_key` | String | Used to validate `x-twilio-signature`. |
| `TWILIO_STATUS_CALLBACK_URL` | Callback URL for SMS delivery | Optional | Server | `https://.../api/webhooks/twilio` | Valid URL | Twilio webhook delivery reporting. |
| `TWILIO_HUMAN_TRANSFER_NUMBER` | Real-time live transfer destination | Optional | Server | `+15551234567` | E.164 phone format | If unset, handoff defaults to Calendly SMS. |

### 7. Voice Safety & Budget Guards

| Variable | Purpose | Required When | Runtime | Example Format | Validation | Security Note |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `VOICE_MAX_SESSION_SECONDS` | Max duration per phone call | Always | Server | `600` (10 minutes) | Positive integer | Enforces per-call duration cap. |
| `VOICE_DAILY_SESSION_LIMIT` | Max total duration per day | Always | Server | `3600` (1 hour) | Positive integer | Prevents runaway usage and quota exhaustion. |
| `VOICE_MONTHLY_SESSION_LIMIT` | Max total duration per month | Always | Server | `36000` (10 hours) | Positive integer | Protects project quotas. |
| `VOICE_RECORDING_ENABLED` | Call audio recording toggle | Optional | Server | `false` \| `true` | Boolean | Default `false` for compliance & zero storage. |
| `VOICE_TEST_ALLOWLIST` | Allowed destination numbers | Testing mode | Server | `+14787588866,+1...` | Comma-separated E.164 | Restricts calls during test phases. |

### 8. Calendly Human Handoff

| Variable | Purpose | Required When | Runtime | Example Format | Validation | Security Note |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `CALENDLY_EVENT_TYPE_URL` | Booking calendar link | Live Calendly handoff | Server | `https://calendly.com/.../discovery` | Valid URL | Configurable link sent via SMS. |
| `CALENDLY_API_TOKEN` | Calendly API personal access token | Optional / Polling | Server | `cal_pat_...` | String | **Secret**. Server-only. |
| `CALENDLY_WEBHOOK_SIGNING_KEY` | Calendly webhook HMAC secret | Live webhooks | Server | `webhook_secret_key` | String | Used to verify `Calendly-Webhook-Signature`. |

### 9. Razorpay Payment Gateway

| Variable | Purpose | Required When | Runtime | Example Format | Validation | Security Note |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `RAZORPAY_KEY_ID` | Merchant Key ID | Live checkout orders | Server | `rzp_live_...` | Non-empty string | Used on server to create orders. |
| `RAZORPAY_KEY_SECRET` | Merchant API Secret | Live checkout verification | Server | `xxxxxxxxxxxxxxxxxxxxxxxx` | Non-empty string | **Secret**. Server-only. Verifies HMAC signatures. |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Public Key ID for browser modal | Client checkout JS | Browser / Client | `rzp_live_...` | Non-empty string | Public key passed to Razorpay Checkout JS. |

---

## Canonical Names & Deprecated Aliases

To maintain clean architecture while supporting backward compatibility, the following canonical naming mappings are handled automatically by `src/lib/config/env.ts`:

| Canonical Name | Deprecated Alias | Migration Note |
| :--- | :--- | :--- |
| `VOICE_GATEWAY_URL` | `NEXT_PUBLIC_VOICE_GATEWAY_URL` | Server-only variable used in TwiML `<Stream>`; remove `NEXT_PUBLIC_` prefix |
| `GEMINI_API_KEY` | `GOOGLE_API_KEY` | Canonical name aligned with Google AI Studio SDK |
| `TWILIO_PHONE_NUMBER` | `TWILIO_FROM_NUMBER` | Canonical name used across Twilio outbound calls & SMS |
| `CALENDLY_EVENT_TYPE_URL` | `CALENDLY_URL` | Canonical name for direct booking event type |
| `VOICE_GATEWAY_PORT` | `PORT` | Eliminates collisions with application server port |

---

## Preflight Verification Commands

To verify your configuration without placing live calls or incurring charges:

```bash
# Verify entire environment and all active providers non-destructively
npm run env:check

# Non-destructive Twilio account metadata and phone verification
npm run env:check:twilio

# Non-destructive Gemini Live model accessibility check (0 generation quota)
npm run env:check:gemini

# Comprehensive real voice preflight diagnostic
npm run voice:preflight
```
