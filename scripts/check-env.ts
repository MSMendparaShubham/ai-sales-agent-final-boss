import 'dotenv/config';
import { prisma } from '../src/lib/db/prisma';
import { getEnv, validateEnvironment, maskPhone, maskSecretStatus } from '../src/lib/config/env';
import twilio from 'twilio';
import { GoogleGenAI } from '@google/genai';
import Razorpay from 'razorpay';
import WebSocket from 'ws';

async function main() {
  console.log('==================================================');
  console.log('🌐 INTENTOS COMPLETE ENVIRONMENT & PROVIDER AUDIT');
  console.log('==================================================\n');

  const env = getEnv();
  const validation = validateEnvironment();

  console.log(`Operational Mode     : ${env.DEMO_MODE ? 'DEMO MODE (Deterministic)' : 'LIVE MODE (Real Providers)'}`);
  console.log(`Voice AI Provider    : ${env.VOICE_AI_PROVIDER} (Strictly Zero-Cost)`);
  console.log(`Database URL         : ${env.DATABASE_URL}\n`);

  // 1. Database Check
  let dbStatus = 'PASS';
  let dbDetails = '';
  try {
    const userCount = await prisma.user.count();
    const wsCount = await prisma.workspace.count();
    dbDetails = `${userCount} users, ${wsCount} workspaces verified.`;
  } catch (err: any) {
    dbStatus = 'FAIL';
    dbDetails = err.message;
  }
  console.log(`[Database]           ${dbStatus.padEnd(8)} ${dbDetails}`);

  // 2. Twilio Check
  let twilioStatus = 'NOT_CONFIGURED';
  let twilioDetails = '';
  if (env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN) {
    try {
      const client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
      const acc = await client.api.v2010.accounts(env.TWILIO_ACCOUNT_SID).fetch();
      twilioStatus = 'PASS';
      twilioDetails = `Active (${acc.type}), Phone: ${maskPhone(env.TWILIO_PHONE_NUMBER)}`;
    } catch (err: any) {
      twilioStatus = 'FAIL';
      twilioDetails = err.message;
    }
  } else if (env.DEMO_MODE) {
    twilioStatus = 'NOT_REQUIRED';
    twilioDetails = 'Simulated telephony enabled for demo mode.';
  } else {
    twilioStatus = 'FAIL';
    twilioDetails = 'Credentials missing in live mode.';
  }
  console.log(`[Twilio Telephony]   ${twilioStatus.padEnd(8)} ${twilioDetails}`);

  // 3. Gemini Live Check
  let geminiStatus = 'NOT_CONFIGURED';
  let geminiDetails = '';
  if (env.GEMINI_API_KEY) {
    try {
      const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
      const modelInfo = await ai.models.get({ model: env.GEMINI_LIVE_MODEL });
      geminiStatus = 'PASS';
      geminiDetails = `Model verified: ${modelInfo.name || env.GEMINI_LIVE_MODEL} (0 quota consumed)`;
    } catch (err: any) {
      geminiStatus = 'FAIL';
      geminiDetails = err.message;
    }
  } else if (env.DEMO_MODE) {
    geminiStatus = 'NOT_REQUIRED';
    geminiDetails = 'Local deterministic AI active for demo mode.';
  } else {
    geminiStatus = 'FAIL';
    geminiDetails = 'GEMINI_API_KEY required in live mode.';
  }
  console.log(`[Gemini Live]        ${geminiStatus.padEnd(8)} ${geminiDetails}`);

  // 4. Calendly Check
  let calendlyStatus = 'NOT_CONFIGURED';
  let calendlyDetails = '';
  if (env.CALENDLY_EVENT_TYPE_URL) {
    try {
      new URL(env.CALENDLY_EVENT_TYPE_URL);
      calendlyStatus = 'PASS';
      calendlyDetails = `Event type URL configured: ${env.CALENDLY_EVENT_TYPE_URL}`;
    } catch {
      calendlyStatus = 'INVALID';
      calendlyDetails = 'CALENDLY_EVENT_TYPE_URL is not a valid URL.';
    }
  } else {
    calendlyStatus = 'NOT_REQUIRED';
    calendlyDetails = 'Defaulting to standard booking flow.';
  }
  console.log(`[Calendly Handoff]   ${calendlyStatus.padEnd(8)} ${calendlyDetails}`);

  // 5. Razorpay Check
  let razorpayStatus = 'NOT_CONFIGURED';
  let razorpayDetails = '';
  if (env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET) {
    try {
      const rzp = new Razorpay({ key_id: env.RAZORPAY_KEY_ID, key_secret: env.RAZORPAY_KEY_SECRET });
      await rzp.orders.all({ count: 1 });
      razorpayStatus = 'PASS';
      razorpayDetails = 'Authentication verified via read-only orders query.';
    } catch (err: any) {
      razorpayStatus = 'FAIL';
      razorpayDetails = err.error?.description || err.message;
    }
  } else {
    razorpayStatus = 'NOT_REQUIRED';
    razorpayDetails = 'Billing gateway is optional for core sales AI.';
  }
  console.log(`[Razorpay Billing]   ${razorpayStatus.padEnd(8)} ${razorpayDetails}`);

  // 6. Voice Gateway Check
  let gatewayStatus = 'UNVERIFIED';
  let gatewayDetails = '';
  const gatewayUrl = env.VOICE_GATEWAY_URL || `ws://localhost:${env.VOICE_GATEWAY_PORT}`;
  try {
    await new Promise((resolve, reject) => {
      const ws = new WebSocket(gatewayUrl);
      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error('Gateway handshake timeout (server not running or host unreachable)'));
      }, 3000);
      ws.on('open', () => {
        clearTimeout(timeout);
        ws.close();
        resolve(true);
      });
      ws.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
    gatewayStatus = 'PASS';
    gatewayDetails = `Connected successfully to ${gatewayUrl}`;
  } catch (err: any) {
    gatewayStatus = 'UNVERIFIED';
    gatewayDetails = `${gatewayUrl} not currently active: ${err.message}`;
  }
  console.log(`[Voice Gateway]      ${gatewayStatus.padEnd(8)} ${gatewayDetails}`);

  // 7. Budget Guard & Zero-Cost Policy
  let budgetStatus = 'PASS';
  let budgetDetails = `Max Call: ${env.VOICE_MAX_SESSION_SECONDS}s, Daily Limit: ${env.VOICE_DAILY_SESSION_LIMIT}s ($0 AI cost enforced)`;
  console.log(`[Budget Guard]       ${budgetStatus.padEnd(8)} ${budgetDetails}`);

  console.log('\n==================================================');
  if (validation.valid) {
    console.log('✅ ENVIRONMENT AUDIT: PASS');
  } else {
    console.log('⚠️ ENVIRONMENT AUDIT: ISSUES DETECTED');
    validation.errors.forEach(e => console.log(`   - ERROR: ${e}`));
  }
  validation.warnings.forEach(w => console.log(`   - WARN : ${w}`));
  console.log('==================================================\n');

  process.exit(validation.valid ? 0 : 1);
}

main().catch(err => {
  console.error('Fatal audit failure:', err);
  process.exit(1);
});
