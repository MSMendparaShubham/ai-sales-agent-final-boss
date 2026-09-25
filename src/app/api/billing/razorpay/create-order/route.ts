import { NextRequest, NextResponse } from 'next/server';
import { getRazorpayClient, PLAN_PRICING_INR } from '@/lib/billing/razorpay';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { planName, workspaceId = 'ws-1' } = body;

    if (!planName || !PLAN_PRICING_INR[planName]) {
      return NextResponse.json(
        { error: `Invalid plan name: ${planName}. Available plans: ${Object.keys(PLAN_PRICING_INR).join(', ')}` },
        { status: 400 }
      );
    }

    const planInfo = PLAN_PRICING_INR[planName];
    const razorpay = getRazorpayClient();

    // Razorpay requires amount in paise (1 INR = 100 paise)
    const amountInPaise = Math.round(planInfo.price * 100);

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `rcpt_${workspaceId}_${Date.now()}`.slice(0, 40),
      notes: {
        workspaceId,
        planName,
        priceINR: planInfo.price.toString(),
      },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      planName,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID,
    });
  } catch (error: any) {
    console.error('Razorpay Create Order Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to initialize Razorpay order' },
      { status: 500 }
    );
  }
}
