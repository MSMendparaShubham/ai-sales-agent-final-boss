import { NextRequest, NextResponse } from 'next/server';
import { verifyPaymentSignature, PLAN_PRICING_INR } from '@/lib/billing/razorpay';
import { prisma } from '@/lib/db/prisma';
import { getBillingPeriodId } from '@/lib/billing/usage';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planName,
      workspaceId = 'ws-1',
    } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !planName) {
      return NextResponse.json(
        { error: 'Missing required Razorpay payment verification parameters' },
        { status: 400 }
      );
    }

    // 1. Verify cryptographic HMAC-SHA256 signature
    const isValid = verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValid) {
      console.error('Invalid Razorpay signature for order:', razorpay_order_id);
      return NextResponse.json(
        { error: 'Invalid payment signature. Payment verification failed.' },
        { status: 400 }
      );
    }

    // 2. Fetch or create the subscription plan in database
    const planInfo = PLAN_PRICING_INR[planName];
    let plan = await prisma.subscriptionPlan.findUnique({ where: { name: planName } });
    if (!plan) {
      plan = await prisma.subscriptionPlan.create({
        data: {
          name: planName,
          priceMonthly: planInfo?.price || (planName === 'Enterprise' ? 84915 : planName === 'Growth' ? 25415 : 8415),
          contactLimit: planName === 'Enterprise' ? 100000 : planName === 'Growth' ? 10000 : 1000,
          aiVoiceMinuteLimit: planName === 'Enterprise' ? 5000 : planName === 'Growth' ? 1000 : 100,
          discoveryLimit: planName === 'Enterprise' ? 50000 : planName === 'Growth' ? 5000 : 500,
          campaignLimit: planName === 'Enterprise' ? 100 : planName === 'Growth' ? 20 : 5,
          teamMemberLimit: planName === 'Enterprise' ? 50 : planName === 'Growth' ? 10 : 2,
          integrationLimit: planName === 'Enterprise' ? 20 : planName === 'Growth' ? 5 : 2,
          exportLimit: planName === 'Enterprise' ? 100000 : planName === 'Growth' ? 10000 : 1000,
        },
      });
    }

    // 3. Update Workspace Subscription
    const currentPeriodEnd = new Date();
    currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);

    const subscription = await prisma.workspaceSubscription.upsert({
      where: { workspaceId },
      update: {
        planId: plan.id,
        status: 'ACTIVE',
        currentPeriodEnd,
        cancelAtPeriodEnd: false,
      },
      create: {
        workspaceId,
        planId: plan.id,
        status: 'ACTIVE',
        currentPeriodEnd,
        cancelAtPeriodEnd: false,
      },
      include: {
        plan: true,
      },
    });

    // 4. Record Paid Invoice
    const billingPeriodId = await getBillingPeriodId();
    await prisma.invoice.create({
      data: {
        workspaceId,
        billingPeriodId,
        amount: planInfo?.price || plan.priceMonthly,
        currency: 'INR',
        status: 'PAID',
        paidAt: new Date(),
        usageSummary: JSON.stringify({
          provider: 'Razorpay',
          orderId: razorpay_order_id,
          paymentId: razorpay_payment_id,
          plan: planName,
        }),
      },
    });

    // 5. Create In-App Notification
    await prisma.notification.create({
      data: {
        workspaceId,
        type: 'BILLING',
        severity: 'SUCCESS',
        title: `Plan Upgraded: ${planName} (₹${planInfo?.price || plan.priceMonthly})`,
        message: `Successfully activated ${planName} subscription via Razorpay (Payment ID: ${razorpay_payment_id}).`,
      },
    });

    // 6. Record Audit Log
    await prisma.auditLog.create({
      data: {
        workspaceId,
        actor: 'RAZORPAY_GATEWAY',
        action: 'SUBSCRIPTION_UPGRADE',
        entityType: 'WorkspaceSubscription',
        entityId: subscription.id,
        metadata: JSON.stringify({
          planName,
          orderId: razorpay_order_id,
          paymentId: razorpay_payment_id,
          amountINR: planInfo?.price || plan.priceMonthly,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully upgraded to ${planName} plan via Razorpay.`,
      subscription,
      paymentId: razorpay_payment_id,
    });
  } catch (error: any) {
    console.error('Razorpay Payment Verification Error:', error);
    return NextResponse.json(
      { error: error.message || 'Payment verification failed' },
      { status: 500 }
    );
  }
}
