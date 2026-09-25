import Razorpay from 'razorpay';
import crypto from 'crypto';

export const USD_TO_INR_RATE = 85; // 1 USD ~ 85 INR

export const PLAN_PRICING_INR: Record<string, { priceUSD: number; price: number; name: string; description: string }> = {
  Starter: { 
    priceUSD: 99,
    price: 99 * USD_TO_INR_RATE, // ₹8,415 (~$99)
    name: 'Starter Plan', 
    description: '100 AI Voice Minutes, 1,000 Contacts, 500 Discovery Leads' 
  },
  Growth: { 
    priceUSD: 299,
    price: 299 * USD_TO_INR_RATE, // ₹25,415 (~$299)
    name: 'Growth Plan', 
    description: '1,000 AI Voice Minutes, 10,000 Contacts, 5,000 Discovery Leads' 
  },
  Enterprise: { 
    priceUSD: 999,
    price: 999 * USD_TO_INR_RATE, // ₹84,915 (~$999)
    name: 'Enterprise Plan', 
    description: '5,000 AI Voice Minutes, 100,000 Contacts, 50,000 Discovery Leads' 
  },
};

export function getRazorpayClient() {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    throw new Error('Razorpay API keys (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET) are missing from environment.');
  }

  return new Razorpay({
    key_id,
    key_secret,
  });
}

export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;

  const generatedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return generatedSignature === signature;
}
