import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';
import { getEnv } from '../src/lib/config/env';

/**
 * Non-destructive Gemini Live configuration & model accessibility check.
 * Performs a zero-generation model metadata lookup. Does NOT consume voice quota.
 */
async function checkGemini() {
  console.log('==================================================');
  console.log('🔍 GEMINI LIVE CONFIGURATION CHECK');
  console.log('==================================================\n');

  const env = getEnv();
  const apiKey = env.GEMINI_API_KEY;
  const model = env.GEMINI_LIVE_MODEL;
  const voice = env.GEMINI_LIVE_VOICE;

  if (!apiKey || apiKey.trim() === '') {
    console.log('Status: UNSET');
    console.log('Reason: GEMINI_API_KEY is not configured in the environment.');
    console.log('==================================================');
    process.exit(1);
  }

  console.log(`Target Model         : ${model}`);
  console.log(`Configured Voice     : ${voice || 'Aoede (Default)'}`);

  try {
    const ai = new GoogleGenAI({ apiKey });
    const modelInfo = await ai.models.get({ model });

    console.log(`Model Verification   : ACCESSIBLE (${modelInfo.name || model})`);
    console.log(`Quota Implication    : 0 generation tokens (read-only metadata check)`);
    console.log('\nResult:');
    console.log('Gemini Live API Key  : VALID');
    console.log('==================================================');
    process.exit(0);
  } catch (err: any) {
    console.log('\nResult:');
    console.log('Gemini Live API Key  : INVALID');
    console.log(`Error Message        : ${err.message || 'API key rejection or network error'}`);
    console.log('==================================================');
    process.exit(1);
  }
}

checkGemini().catch((e) => {
  console.error('Unexpected check failure:', e.message);
  process.exit(1);
});
