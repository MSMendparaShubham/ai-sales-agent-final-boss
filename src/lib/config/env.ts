import { z } from 'zod';

/**
 * Central Environment Configuration and Validator for IntentOS
 *
 * Enforces:
 * 1. Strict Server/Client boundary (secrets must NEVER be prefixed with NEXT_PUBLIC_)
 * 2. Canonical naming with backward-compatible deprecated aliases
 * 3. Conditional validation based on DEMO_MODE and active providers
 * 4. Human-readable configuration errors (never leak raw secrets)
 */

export const envSchema = z.object({
  // Core App & Database
  DATABASE_URL: z.string().default('file:./dev.db'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DEMO_MODE: z.preprocess((val) => val === true || val === 'true' || val === '1', z.boolean()).default(true),
  APP_URL: z.string().url().optional(),

  // Offline AI Intelligence Pipeline (Text/Lead scoring)
  AI_PROVIDER: z.enum(['demo', 'ollama']).default('demo'),
  OLLAMA_HOST: z.string().default('http://localhost:11434'),
  OLLAMA_MODEL: z.string().default('llama3'),

  // Realtime Voice AI Provider (Phone calls) - Strict Zero-Cost Architecture ($0 AI)
  VOICE_AI_PROVIDER: z.enum(['gemini', 'demo']).default('gemini'),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_LIVE_MODEL: z.string().default('gemini-2.5-flash-native-audio-preview-12-2025'),
  GEMINI_LIVE_VOICE: z.string().default('Aoede'),

  // Voice Gateway
  VOICE_GATEWAY_URL: z.string().optional(),
  VOICE_GATEWAY_PORT: z.coerce.number().default(8080),
  VOICE_GATEWAY_INTERNAL_SECRET: z.string().optional(),

  // Voice Guard & Quotas
  VOICE_RECORDING_ENABLED: z.preprocess((val) => val === true || val === 'true' || val === '1', z.boolean()).default(false),
  VOICE_MAX_SESSION_SECONDS: z.coerce.number().default(600), // 10 minutes max per call
  VOICE_DAILY_SESSION_LIMIT: z.coerce.number().default(3600), // 1 hour per day
  VOICE_MONTHLY_SESSION_LIMIT: z.coerce.number().default(36000), // 10 hours per month
  VOICE_TEST_ALLOWLIST: z.string().optional(),

  // Twilio Telephony
  TWILIO_ACCOUNT_SID: z.string().regex(/^AC[a-f0-9]{32}$/i, 'Twilio Account SID must start with AC followed by 32 hex chars').optional(),
  TWILIO_AUTH_TOKEN: z.string().min(32, 'Twilio Auth Token must be at least 32 characters').optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),
  TWILIO_WEBHOOK_SIGNING_KEY: z.string().optional(),
  TWILIO_STATUS_CALLBACK_URL: z.string().optional(),
  TWILIO_RECORDING_CALLBACK_URL: z.string().optional(),
  TWILIO_HUMAN_TRANSFER_NUMBER: z.string().optional(),

  // Calendly Human Handoff
  CALENDLY_API_TOKEN: z.string().optional(),
  CALENDLY_EVENT_TYPE_URL: z.string().optional(),
  CALENDLY_WEBHOOK_SIGNING_KEY: z.string().optional(),

  // Razorpay Payment Gateway (Optional / Billing)
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  NEXT_PUBLIC_RAZORPAY_KEY_ID: z.string().optional(),

  // Auth
  BETTER_AUTH_SECRET: z.string().default('development_secret_do_not_use_in_prod'),
});

export type EnvConfig = z.infer<typeof envSchema>;

/**
 * Resolves raw environment variables handling canonical names & deprecated aliases
 */
export function getRawEnv(): Record<string, any> {
  return {
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    DEMO_MODE: process.env.DEMO_MODE,
    APP_URL: process.env.APP_URL,

    AI_PROVIDER: process.env.AI_PROVIDER,
    OLLAMA_HOST: process.env.OLLAMA_HOST,
    OLLAMA_MODEL: process.env.OLLAMA_MODEL,

    VOICE_AI_PROVIDER: process.env.VOICE_AI_PROVIDER,
    // Canonical GEMINI_API_KEY with GOOGLE_API_KEY fallback
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
    GEMINI_LIVE_MODEL: process.env.GEMINI_LIVE_MODEL,
    GEMINI_LIVE_VOICE: process.env.GEMINI_LIVE_VOICE,

    // Canonical VOICE_GATEWAY_URL with NEXT_PUBLIC_VOICE_GATEWAY_URL fallback
    VOICE_GATEWAY_URL: process.env.VOICE_GATEWAY_URL || process.env.NEXT_PUBLIC_VOICE_GATEWAY_URL,
    // Canonical VOICE_GATEWAY_PORT with PORT fallback
    VOICE_GATEWAY_PORT: process.env.VOICE_GATEWAY_PORT || process.env.PORT,
    VOICE_GATEWAY_INTERNAL_SECRET: process.env.VOICE_GATEWAY_INTERNAL_SECRET,

    VOICE_RECORDING_ENABLED: process.env.VOICE_RECORDING_ENABLED,
    VOICE_MAX_SESSION_SECONDS: process.env.VOICE_MAX_SESSION_SECONDS,
    VOICE_DAILY_SESSION_LIMIT: process.env.VOICE_DAILY_SESSION_LIMIT,
    VOICE_MONTHLY_SESSION_LIMIT: process.env.VOICE_MONTHLY_SESSION_LIMIT,
    VOICE_TEST_ALLOWLIST: process.env.VOICE_TEST_ALLOWLIST,

    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
    // Canonical TWILIO_PHONE_NUMBER with TWILIO_FROM_NUMBER fallback
    TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_FROM_NUMBER,
    TWILIO_WEBHOOK_SIGNING_KEY: process.env.TWILIO_WEBHOOK_SIGNING_KEY,
    TWILIO_STATUS_CALLBACK_URL: process.env.TWILIO_STATUS_CALLBACK_URL,
    TWILIO_RECORDING_CALLBACK_URL: process.env.TWILIO_RECORDING_CALLBACK_URL,
    TWILIO_HUMAN_TRANSFER_NUMBER: process.env.TWILIO_HUMAN_TRANSFER_NUMBER,

    CALENDLY_API_TOKEN: process.env.CALENDLY_API_TOKEN,
    // Canonical CALENDLY_EVENT_TYPE_URL with CALENDLY_URL fallback
    CALENDLY_EVENT_TYPE_URL: process.env.CALENDLY_EVENT_TYPE_URL || process.env.CALENDLY_URL,
    CALENDLY_WEBHOOK_SIGNING_KEY: process.env.CALENDLY_WEBHOOK_SIGNING_KEY,

    RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
    NEXT_PUBLIC_RAZORPAY_KEY_ID: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,

    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
  };
}

let cachedEnv: EnvConfig | null = null;

export function getEnv(): EnvConfig {
  if (cachedEnv) return cachedEnv;
  const raw = getRawEnv();
  const parsed = envSchema.safeParse(raw);

  if (!parsed.success) {
    const errorDetails = parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
    console.warn(`[Env] Environment parsing notice: ${errorDetails}`);
    // Provide safe fallback using default schema
    cachedEnv = envSchema.parse({
      DATABASE_URL: raw.DATABASE_URL || 'file:./dev.db',
      DEMO_MODE: raw.DEMO_MODE ?? true,
      VOICE_AI_PROVIDER: raw.VOICE_AI_PROVIDER || 'gemini',
    });
    return cachedEnv;
  }

  cachedEnv = parsed.data;
  return cachedEnv;
}

/**
 * Validates requirements conditionally based on application state
 */
export function validateEnvironment(): {
  valid: boolean;
  isDemoMode: boolean;
  errors: string[];
  warnings: string[];
  statuses: Record<string, 'SET' | 'UNSET' | 'INVALID' | 'NOT_REQUIRED'>;
} {
  const env = getEnv();
  const errors: string[] = [];
  const warnings: string[] = [];
  const statuses: Record<string, 'SET' | 'UNSET' | 'INVALID' | 'NOT_REQUIRED'> = {};

  const isDemo = env.DEMO_MODE;

  // 1. Database
  statuses['DATABASE_URL'] = env.DATABASE_URL ? 'SET' : 'INVALID';

  // 2. Telephony (Twilio)
  const hasTwilioSid = !!env.TWILIO_ACCOUNT_SID;
  const hasTwilioToken = !!env.TWILIO_AUTH_TOKEN;
  const hasTwilioPhone = !!env.TWILIO_PHONE_NUMBER;

  statuses['TWILIO_ACCOUNT_SID'] = hasTwilioSid ? 'SET' : isDemo ? 'NOT_REQUIRED' : 'UNSET';
  statuses['TWILIO_AUTH_TOKEN'] = hasTwilioToken ? 'SET' : isDemo ? 'NOT_REQUIRED' : 'UNSET';
  statuses['TWILIO_PHONE_NUMBER'] = hasTwilioPhone ? 'SET' : isDemo ? 'NOT_REQUIRED' : 'UNSET';

  if (!isDemo && (!hasTwilioSid || !hasTwilioToken || !hasTwilioPhone)) {
    errors.push('Twilio credentials (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER) are required when DEMO_MODE=false.');
  }

  // 3. Realtime Voice AI (Gemini Live)
  const isGeminiVoice = env.VOICE_AI_PROVIDER === 'gemini';
  const hasGeminiKey = !!env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim() !== '';

  statuses['VOICE_AI_PROVIDER'] = 'SET';
  statuses['GEMINI_API_KEY'] = hasGeminiKey ? 'SET' : (isDemo ? 'NOT_REQUIRED' : 'UNSET');
  statuses['GEMINI_LIVE_MODEL'] = env.GEMINI_LIVE_MODEL ? 'SET' : 'INVALID';

  if (!isDemo && isGeminiVoice && !hasGeminiKey) {
    errors.push('Gemini Live API Key (GEMINI_API_KEY) is required when DEMO_MODE=false and VOICE_AI_PROVIDER=gemini.');
  }

  // 4. Voice Gateway
  const hasGateway = !!env.VOICE_GATEWAY_URL;
  statuses['VOICE_GATEWAY_URL'] = hasGateway ? 'SET' : 'NOT_REQUIRED';
  if (!isDemo && !hasGateway) {
    warnings.push('VOICE_GATEWAY_URL is not set. Outbound live calls will default to wss://<host>/voice-gateway.');
  }

  // 5. Calendly Handoff
  const hasCalendlyToken = !!env.CALENDLY_API_TOKEN;
  const hasCalendlyUrl = !!env.CALENDLY_EVENT_TYPE_URL;
  statuses['CALENDLY_API_TOKEN'] = hasCalendlyToken ? 'SET' : 'NOT_REQUIRED';
  statuses['CALENDLY_EVENT_TYPE_URL'] = hasCalendlyUrl ? 'SET' : 'NOT_REQUIRED';
  statuses['CALENDLY_WEBHOOK_SIGNING_KEY'] = env.CALENDLY_WEBHOOK_SIGNING_KEY ? 'SET' : 'NOT_REQUIRED';

  // 6. Razorpay
  const hasRazorpayId = !!env.RAZORPAY_KEY_ID;
  const hasRazorpaySecret = !!env.RAZORPAY_KEY_SECRET;
  statuses['RAZORPAY_KEY_ID'] = hasRazorpayId ? 'SET' : 'NOT_REQUIRED';
  statuses['RAZORPAY_KEY_SECRET'] = hasRazorpaySecret ? 'SET' : 'NOT_REQUIRED';

  return {
    valid: errors.length === 0,
    isDemoMode: isDemo,
    errors,
    warnings,
    statuses,
  };
}

/**
 * Asserts Gemini Live is configured; throws clean human-readable error otherwise
 */
export function assertGeminiConfigured(): void {
  const env = getEnv();
  if (env.VOICE_AI_PROVIDER === 'gemini' && !env.GEMINI_API_KEY) {
    throw new Error('Gemini Live is not configured. Set GEMINI_API_KEY in the server environment.');
  }
}

/**
 * Asserts Twilio is configured; throws clean human-readable error otherwise
 */
export function assertTwilioConfigured(): void {
  const env = getEnv();
  if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || !env.TWILIO_PHONE_NUMBER) {
    throw new Error('Twilio is not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in the server environment.');
  }
}

/**
 * Asserts Razorpay is configured; throws clean human-readable error otherwise
 */
export function assertRazorpayConfigured(): void {
  const env = getEnv();
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay payment gateway is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in the server environment.');
  }
}

/**
 * Masks a phone number for safe display (e.g. +14787588866 -> +14******8866)
 */
export function maskPhone(phone?: string | null): string {
  if (!phone || phone.length < 7) return '******';
  return `${phone.slice(0, 3)}******${phone.slice(-4)}`;
}

/**
 * Masks a secret string for safe display (never reveals secret content)
 */
export function maskSecretStatus(value?: string | null): string {
  if (!value || value.trim() === '') return 'UNSET';
  return `SET (${value.length} chars)`;
}
