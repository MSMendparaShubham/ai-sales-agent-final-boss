import 'dotenv/config';
import twilio from 'twilio';
import { getEnv, maskPhone } from '../src/lib/config/env';

/**
 * Non-destructive Twilio credentials verification
 * Fetches account metadata only. Does NOT place calls or send SMS.
 */
async function checkTwilio() {
  console.log('==================================================');
  console.log('🔍 TWILIO CREDENTIALS & CONNECTIVITY CHECK');
  console.log('==================================================\n');

  const env = getEnv();
  const sid = env.TWILIO_ACCOUNT_SID;
  const token = env.TWILIO_AUTH_TOKEN;
  const phone = env.TWILIO_PHONE_NUMBER;

  if (!sid || !token) {
    console.log('Status: UNSET');
    console.log('Reason: TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN is missing in environment.');
    console.log('==================================================');
    process.exit(1);
  }

  const sidValid = /^AC[a-f0-9]{32}$/i.test(sid);
  if (!sidValid) {
    console.log('Status: INVALID');
    console.log('Reason: Account SID format is invalid (must begin with "AC" followed by 32 hex chars).');
    console.log('==================================================');
    process.exit(1);
  }

  console.log(`Account SID Format   : VALID`);
  console.log(`Configured Phone     : ${maskPhone(phone)}`);

  try {
    const client = twilio(sid, token);
    const account = await client.api.v2010.accounts(sid).fetch();

    console.log(`Account Status       : ${account.status}`);
    console.log(`Account Type         : ${account.type}`);
    console.log('\nResult:');
    console.log('Twilio credentials   : VALID');
    console.log('==================================================');
    process.exit(0);
  } catch (err: any) {
    console.log('\nResult:');
    console.log('Twilio credentials   : INVALID');
    console.log(`Error Message        : ${err.message || 'Authentication failed'}`);
    if (err.code) console.log(`Twilio Error Code    : ${err.code}`);
    console.log('==================================================');
    process.exit(1);
  }
}

checkTwilio().catch((e) => {
  console.error('Unexpected check failure:', e.message);
  process.exit(1);
});
