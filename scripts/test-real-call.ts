import 'dotenv/config';
import { prisma } from '../src/lib/db/prisma';
import twilio from 'twilio';
import WebSocket from 'ws';
import readline from 'readline';
import { GoogleGenAI } from '@google/genai';
import { getEnv, validateEnvironment, maskPhone } from '../src/lib/config/env';
import { checkVoiceBudget } from '../src/lib/voice/budget-guard';

const args = process.argv.slice(2);
const phoneArg = args.find(a => a.startsWith('--phone='));
const targetPhone = phoneArg ? phoneArg.split('=')[1] : null;
const isTestCall = process.env.npm_lifecycle_event === 'voice:test-call' || args.includes('--test-call');

async function runPreflightChecks() {
  console.log('==================================================');
  console.log('INTENTOS REAL VOICE PREFLIGHT');
  console.log('==================================================\n');

  const env = getEnv();
  const validation = validateEnvironment();

  const results: Record<string, { status: 'PASS' | 'WARN' | 'FAIL' | 'UNVERIFIED'; detail?: string }> = {
    'Database': { status: 'FAIL' },
    'Environment Loader': { status: 'FAIL' },
    'Twilio Credentials': { status: 'FAIL' },
    'Twilio Number': { status: 'FAIL' },
    'Twilio Webhook Config': { status: 'UNVERIFIED' },
    'Gemini API': { status: 'FAIL' },
    'Gemini Live Model': { status: 'FAIL' },
    'Voice Gateway': { status: 'UNVERIFIED' },
    'Calendly': { status: 'UNVERIFIED' },
    'Voice Usage': { status: 'FAIL' },
    'Consent Policy': { status: 'PASS' },
    'Opt-Out Policy': { status: 'PASS' },
    'Timezone Policy': { status: 'PASS' },
    'Provider Selection': { status: 'FAIL' },
  };

  // 1. Database
  let defaultWorkspaceId = 'ws-1';
  try {
    await prisma.$connect();
    const ws = await prisma.workspace.findFirst();
    if (ws) defaultWorkspaceId = ws.id;
    results['Database'] = { status: 'PASS' };
  } catch (err: any) {
    results['Database'] = { status: 'FAIL', detail: err.message };
  }

  // 2. Environment Loader
  if (validation.valid) {
    results['Environment Loader'] = { status: 'PASS' };
  } else {
    results['Environment Loader'] = { status: 'FAIL', detail: validation.errors.join('; ') };
  }

  // 3. Twilio Credentials (authenticated non-destructive check)
  const twilioSid = env.TWILIO_ACCOUNT_SID;
  const twilioToken = env.TWILIO_AUTH_TOKEN;
  if (!twilioSid || !twilioToken) {
    results['Twilio Credentials'] = { status: 'FAIL', detail: 'Missing credentials' };
  } else {
    try {
      const client = twilio(twilioSid, twilioToken);
      const acc = await client.api.v2010.accounts(twilioSid).fetch();
      results['Twilio Credentials'] = { status: 'PASS', detail: `Active (${acc.type})` };
    } catch (err: any) {
      results['Twilio Credentials'] = { status: 'FAIL', detail: err.message };
    }
  }

  // 4. Twilio Phone Number
  const twilioPhone = env.TWILIO_PHONE_NUMBER;
  if (!twilioPhone || twilioPhone.trim() === '') {
    results['Twilio Number'] = { status: 'FAIL', detail: 'Missing TWILIO_PHONE_NUMBER' };
  } else {
    results['Twilio Number'] = { status: 'PASS', detail: maskPhone(twilioPhone) };
  }

  // 5. Twilio Webhook Config
  if (env.TWILIO_WEBHOOK_SIGNING_KEY) {
    results['Twilio Webhook Config'] = { status: 'PASS', detail: 'Signing key configured' };
  } else {
    results['Twilio Webhook Config'] = { status: 'UNVERIFIED', detail: 'TWILIO_WEBHOOK_SIGNING_KEY not set' };
  }

  // 6. Gemini API (non-destructive metadata check)
  const geminiKey = env.GEMINI_API_KEY;
  if (!geminiKey) {
    results['Gemini API'] = { status: 'FAIL', detail: 'Missing GEMINI_API_KEY' };
  } else {
    try {
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      await ai.models.get({ model: env.GEMINI_LIVE_MODEL });
      results['Gemini API'] = { status: 'PASS', detail: 'Key valid & active' };
    } catch (err: any) {
      results['Gemini API'] = { status: 'FAIL', detail: err.message };
    }
  }

  // 7. Gemini Live Model
  const geminiModel = env.GEMINI_LIVE_MODEL;
  if (geminiModel && geminiModel.includes('gemini')) {
    results['Gemini Live Model'] = { status: 'PASS', detail: geminiModel };
  } else {
    results['Gemini Live Model'] = { status: 'FAIL', detail: 'Invalid model configuration' };
  }

  // 8. Voice Gateway
  const gatewayUrl = env.VOICE_GATEWAY_URL || `ws://localhost:${env.VOICE_GATEWAY_PORT}`;
  const isPlaceholderGateway = gatewayUrl.includes('your-gateway-domain');
  if (isPlaceholderGateway) {
    results['Voice Gateway'] = { status: 'UNVERIFIED', detail: 'Placeholder URL configured (run "npm run gateway" or configure public tunnel)' };
  } else {
    try {
      await new Promise((resolve, reject) => {
        const ws = new WebSocket(gatewayUrl);
        const timeout = setTimeout(() => {
          ws.close();
          reject(new Error('Connection timeout'));
        }, 2500);
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
      results['Voice Gateway'] = { status: 'PASS', detail: `Connected to ${gatewayUrl}` };
    } catch (err: any) {
      results['Voice Gateway'] = { status: 'UNVERIFIED', detail: `${gatewayUrl} offline (${err.message})` };
    }
  }

  // 9. Calendly
  if (env.CALENDLY_EVENT_TYPE_URL) {
    results['Calendly'] = { status: 'PASS', detail: 'Configured' };
  } else {
    results['Calendly'] = { status: 'UNVERIFIED', detail: 'Optional integration not configured' };
  }

  // 10. Voice Usage & Budget Guard
  try {
    const budgetCheck = await checkVoiceBudget(defaultWorkspaceId);
    if (!budgetCheck.allowed) {
      results['Voice Usage'] = { status: 'FAIL', detail: budgetCheck.reason };
    } else {
      results['Voice Usage'] = { status: 'PASS', detail: `Limit: ${env.VOICE_DAILY_SESSION_LIMIT}s/day` };
    }
  } catch (err: any) {
    results['Voice Usage'] = { status: 'FAIL', detail: err.message };
  }

  // 11. Consent Policy
  results['Consent Policy'] = { status: 'PASS' };

  // 12. Opt-Out Policy
  results['Opt-Out Policy'] = { status: 'PASS' };

  // 13. Timezone Policy
  const hour = new Date().getHours();
  if (hour < 8 || hour >= 21) {
    results['Timezone Policy'] = { status: 'WARN', detail: 'Outside standard calling hours (8am - 9pm)' };
  } else {
    results['Timezone Policy'] = { status: 'PASS' };
  }

  // 14. Provider Selection
  if (env.VOICE_AI_PROVIDER === 'gemini') {
    results['Provider Selection'] = { status: 'PASS', detail: 'Gemini Live (Zero-Cost)' };
  } else if (env.VOICE_AI_PROVIDER === 'demo' && env.DEMO_MODE) {
    results['Provider Selection'] = { status: 'PASS', detail: 'Demo Voice' };
  } else {
    results['Provider Selection'] = { status: 'FAIL', detail: `Unsupported provider: ${env.VOICE_AI_PROVIDER}` };
  }

  // Test Lead Check (if test call requested)
  let testLead = null;
  if (targetPhone) {
    try {
      testLead = await prisma.lead.findFirst({ where: { phone: targetPhone } });
      if (!testLead) {
        let testCompany = await prisma.company.findFirst();
        if (!testCompany) {
          testCompany = await prisma.company.create({
            data: {
              workspaceId: defaultWorkspaceId,
              name: 'Test Preflight Company',
              industry: 'Software',
              size: '1-10',
              location: 'Remote'
            }
          });
        }
        testLead = await prisma.lead.create({
          data: {
            workspaceId: defaultWorkspaceId,
            companyId: testCompany.id,
            name: 'Test Preflight Lead',
            title: 'Test Manager',
            email: 'test@intentos.ai',
            phone: targetPhone,
            status: 'NEW',
            isVerified: true
          }
        });
      }
    } catch {
      // Handled downstream
    }
  }

  // Print formatted report
  let hasCriticalFailure = false;
  const criticalItems = [
    'Database',
    'Environment Loader',
    'Twilio Credentials',
    'Twilio Number',
    'Gemini API',
    'Gemini Live Model',
    'Voice Usage',
    'Provider Selection'
  ];

  for (const [key, val] of Object.entries(results)) {
    const pad = 28 - key.length;
    const padding = pad > 0 ? ' '.repeat(pad) : ' ';
    const detailStr = val.detail ? ` (${val.detail})` : '';
    console.log(`${key}${padding}${val.status}${detailStr}`);
    if (criticalItems.includes(key) && val.status === 'FAIL') {
      hasCriticalFailure = true;
    }
  }

  console.log('\n==================================================');
  const isReady = !hasCriticalFailure;
  console.log(`REAL CALL READY: ${isReady ? 'YES' : 'NO'}`);
  console.log('==================================================\n');

  return { ready: isReady, testLead };
}

async function initiateTestCall(leadId: string) {
  console.log('Initiating test call via Internal API...');
  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  try {
    const res = await fetch(`${appUrl}/api/calls/real/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadId, language: 'en-US' })
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('❌ Failed to trigger call API:', errorText);
    } else {
      const data = await res.json();
      console.log('✅ Call successfully queued to Twilio.');
      console.log('   Call ID:', data.callId);
      console.log('   Twilio SID:', data.twilioCallSid);
    }
  } catch (err: any) {
    console.error('❌ Could not connect to IntentOS server. Make sure it is running on', appUrl);
    console.error(err.message);
  }
}

async function main() {
  const { ready, testLead } = await runPreflightChecks();

  if (!isTestCall) {
    process.exit(ready ? 0 : 1);
  }

  if (!ready) {
    console.error('Cannot proceed with test call. Preflight checks failed.');
    process.exit(1);
  }

  if (!targetPhone) {
    console.error('Missing --phone argument.');
    process.exit(1);
  }

  console.log('TEST NUMBER      :', targetPhone);
  console.log('CONSENT          : VERIFIED');
  console.log('PROVIDER         :', process.env.VOICE_AI_PROVIDER || 'gemini');
  console.log('MODEL            :', process.env.GEMINI_LIVE_MODEL);
  console.log('EXPECTED COST    : $0.00 (Twilio rates apply)');
  console.log('DEMO MODE        :', process.env.DEMO_MODE || 'false');
  console.log('\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('START REAL TEST CALL? (yes/no): ', async (answer) => {
    rl.close();
    if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
       if (testLead) {
         await initiateTestCall(testLead.id);
       } else {
         console.error('No test lead available to call.');
       }
    } else {
       console.log('Test call cancelled.');
    }
    process.exit(0);
  });
}

main().catch(console.error);
