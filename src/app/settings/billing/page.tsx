'use client';

import React, { useEffect, useState } from 'react';
import Script from 'next/script';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, CheckCircle, AlertTriangle, ShieldCheck, Zap, Sparkles } from 'lucide-react';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const PLANS = [
  {
    name: 'Starter',
    priceUSD: 99,
    priceINR: 8415, // $99 * 85
    description: 'Perfect for small teams testing AI-powered lead qualification.',
    badge: null,
    features: [
      '100 AI Voice Minutes',
      '1,000 Verified Contacts',
      '500 Public Lead Discovery Credits',
      '5 Active Outreach Campaigns',
      'HubSpot & Salesforce Sync',
      'Community Support',
    ],
  },
  {
    name: 'Growth',
    priceUSD: 299,
    priceINR: 25415, // $299 * 85
    description: 'Ideal for scaling sales teams automating full-cycle prospecting.',
    badge: 'RECOMMENDED',
    features: [
      '1,000 AI Voice Minutes',
      '10,000 Verified Contacts',
      '5,000 Public Lead Discovery Credits',
      '20 Active Outreach Campaigns',
      'Multilingual Calls (EN, HI, GU)',
      'Autonomous CRM Synchronization',
      'Dedicated Priority Queue',
    ],
  },
  {
    name: 'Enterprise',
    priceUSD: 999,
    priceINR: 84915, // $999 * 85
    description: 'Autonomous sales operations for high-velocity revenue organizations.',
    badge: 'ENTERPRISE',
    features: [
      '5,000 AI Voice Minutes',
      '100,000 Verified Contacts',
      '50,000 Public Lead Discovery Credits',
      '100 Active Outreach Campaigns',
      'Unlimited CRM & Webhook Integrations',
      'Custom Voice Cloning & Tone Models',
      '24/7 Priority SLA & Dedicated TAM',
    ],
  },
];

export default function BillingPage() {
  const [subscription, setSubscription] = useState<any>(null);
  const [usage, setUsage] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchData = async () => {
    try {
      const [subRes, usageRes, invRes] = await Promise.all([
        fetch('/api/workspace/subscription'),
        fetch('/api/workspace/usage'),
        fetch('/api/workspace/invoices'),
      ]);
      setSubscription(await subRes.json());
      setUsage(await usageRes.json());
      setInvoices(await invRes.json());
    } catch (err) {
      console.error('Failed to load billing data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRazorpayCheckout = async (planName: string) => {
    setProcessing(true);
    setStatusMessage(null);

    try {
      if (typeof window === 'undefined' || !window.Razorpay) {
        throw new Error('Razorpay SDK is still loading. Please wait a moment and try again.');
      }

      // 1. Create order on server
      const orderRes = await fetch('/api/billing/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planName }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok || !orderData.orderId) {
        throw new Error(orderData.error || 'Failed to initialize Razorpay checkout order.');
      }

      // 2. Configure and launch Razorpay Checkout Modal
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'IntentOS Autonomous Sales',
        description: `${planName} Subscription (${orderData.currency} ${orderData.amount / 100}/mo)`,
        image: '/favicon.ico',
        order_id: orderData.orderId,
        handler: async (response: any) => {
          setProcessing(true);
          try {
            // 3. Verify payment signature on backend
            const verifyRes = await fetch('/api/billing/razorpay/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                planName,
              }),
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok || !verifyData.success) {
              throw new Error(verifyData.error || 'Payment signature verification failed.');
            }

            setStatusMessage({
              type: 'success',
              text: `Payment successful! You are now subscribed to the ${planName} plan (Payment ID: ${response.razorpay_payment_id}).`,
            });
            await fetchData();
          } catch (err: any) {
            console.error('Verification Error:', err);
            setStatusMessage({ type: 'error', text: err.message || 'Payment verification failed.' });
          } finally {
            setProcessing(false);
          }
        },
        prefill: {
          name: 'Alex Morgan',
          email: 'alex.morgan@intentos.ai',
          contact: '+919876543210',
        },
        theme: {
          color: '#2563EB',
        },
        modal: {
          ondismiss: () => {
            setProcessing(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (failedRes: any) => {
        console.error('Payment Failed:', failedRes);
        setStatusMessage({
          type: 'error',
          text: `Payment failed: ${failedRes.error?.description || 'Transaction declined.'}`,
        });
        setProcessing(false);
      });

      rzp.open();
    } catch (err: any) {
      console.error('Checkout error:', err);
      setStatusMessage({ type: 'error', text: err.message || 'Failed to start Razorpay checkout.' });
      setProcessing(false);
    }
  };

  const handleCancel = async () => {
    setProcessing(true);
    try {
      await fetch('/api/workspace/billing/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancelSubscription' }),
      });
      setStatusMessage({ type: 'success', text: 'Plan scheduled to cancel at the end of the billing period.' });
      await fetchData();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to cancel plan.' });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="p-8 text-sm text-slate-500">Loading billing & subscription data...</div>;

  const isActive = subscription && subscription.status !== 'NO_PLAN_ACTIVE';
  const currentPlan = isActive ? subscription.plan : null;

  const voiceUsed = usage?.usage?.['VOICE_MINUTES'] || 0;
  const voiceLimit = currentPlan?.aiVoiceMinuteLimit || 0;
  const voicePercent = voiceLimit > 0 ? Math.min(100, Math.round((voiceUsed / voiceLimit) * 100)) : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-6">
      {/* Razorpay SDK Script */}
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#10233F]">Subscription & Billing</h1>
            <span className="flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              Razorpay Live Gateway
            </span>
          </div>
          <p className="text-sm text-[#64748B] mt-1">
            Manage your autonomous AI sales platform plan with direct live INR payment processing.
          </p>
        </div>
      </div>

      {/* Status Messages */}
      {statusMessage && (
        <div
          className={`p-4 rounded-lg text-sm font-medium flex items-center gap-2 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Active Subscription & Usage Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Active Plan Overview */}
        <Card className="p-6 space-y-4 border border-slate-200 bg-white shadow-sm">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h2 className="text-xs uppercase tracking-wider font-bold text-[#64748B]">Active Plan</h2>
              <div className="text-2xl font-bold text-[#10233F]">
                {isActive ? currentPlan?.name : 'No Active Subscription'}
              </div>
            </div>
            {isActive && subscription.status === 'ACTIVE' && (
              <span className="flex items-center gap-1.5 text-xs font-bold text-[#16A34A] bg-[#DCFCE7] border border-emerald-200 px-2.5 py-1 rounded-full">
                <CheckCircle className="w-3.5 h-3.5" />
                Active
              </span>
            )}
          </div>

          <div className="text-sm text-[#475569] space-y-1 pt-2 border-t border-slate-100">
            {isActive ? (
              <>
                <p className="font-semibold text-slate-800">
                  Rate: ₹{currentPlan?.priceMonthly || 0} / month (INR)
                </p>
                <p className="text-xs text-slate-500">
                  Current Period Ends: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </p>
                {subscription.cancelAtPeriodEnd && (
                  <p className="text-xs text-rose-600 font-semibold mt-2">
                    Cancels at end of current billing period.
                  </p>
                )}
              </>
            ) : (
              <p className="text-slate-500">Select a plan below to activate AI Voice Calling and Discovery.</p>
            )}
          </div>

          {isActive && !subscription.cancelAtPeriodEnd && (
            <div className="pt-2">
              <Button
                onClick={handleCancel}
                disabled={processing}
                variant="outline"
                className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
              >
                Cancel Subscription
              </Button>
            </div>
          )}
        </Card>

        {/* Live Quota Consumption */}
        <Card className="p-6 space-y-4 border border-slate-200 bg-white shadow-sm">
          <div className="flex justify-between items-center">
            <h2 className="text-xs uppercase tracking-wider font-bold text-[#64748B]">Current Period Usage</h2>
            <span className="text-xs text-slate-500 font-mono">Period: {usage?.billingPeriodId || '--'}</span>
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <div className="flex justify-between text-sm font-medium mb-1.5">
                <span className="text-slate-700 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-500" />
                  AI Voice Minutes
                </span>
                <span className="font-semibold text-slate-900">
                  {voiceUsed} / {isActive ? voiceLimit : 0} mins
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    voicePercent > 90 ? 'bg-rose-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${voicePercent}%` }}
                />
              </div>
            </div>
            <p className="text-xs text-slate-500">
              Live consumption tracked through deterministic telephony engine ledger.
            </p>
          </div>
        </Card>
      </div>

      {/* Available Plans (Razorpay Integrated) */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-[#10233F]">Choose Your Plan (INR)</h2>
          <p className="text-xs text-slate-500">
            All prices processed via your live Razorpay account with instant automated subscription activation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((p) => {
            const isCurrent = isActive && currentPlan?.name === p.name;
            const isRecommended = p.badge === 'RECOMMENDED';

            return (
              <Card
                key={p.name}
                className={`p-6 flex flex-col justify-between transition-all relative ${
                  isRecommended
                    ? 'border-2 border-blue-600 shadow-md bg-gradient-to-b from-blue-50/20 to-white'
                    : 'border border-slate-200 bg-white shadow-sm'
                }`}
              >
                {p.badge && (
                  <span
                    className={`absolute -top-3 right-4 px-2.5 py-0.5 text-[10px] font-extrabold tracking-wider rounded-full uppercase ${
                      isRecommended
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 text-white'
                    }`}
                  >
                    {p.badge}
                  </span>
                )}

                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{p.name}</h3>
                    <p className="text-xs text-slate-500 mt-1 min-h-[32px]">{p.description}</p>
                  </div>

                  <div className="pt-2 pb-2 border-y border-slate-100">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-extrabold text-slate-900">₹{p.priceINR.toLocaleString('en-IN')}</span>
                      <span className="text-xs font-semibold text-slate-500">/ month</span>
                    </div>
                    <p className="text-[11px] font-medium text-blue-600 mt-1">
                      Equivalent to ${p.priceUSD} USD / month
                    </p>
                  </div>

                  <ul className="space-y-2 text-xs text-slate-600">
                    {p.features.map((feat) => (
                      <li key={feat} className="flex items-center gap-2">
                        <CheckCircle className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-6">
                  {isCurrent ? (
                    <Button disabled className="w-full bg-slate-100 text-slate-500 border border-slate-200">
                      Current Plan
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleRazorpayCheckout(p.name)}
                      disabled={processing}
                      className={`w-full font-semibold ${
                        isRecommended
                          ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                          : 'bg-slate-900 hover:bg-slate-800 text-white'
                      }`}
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      {processing ? 'Launching Razorpay...' : `Pay ₹${p.priceINR.toLocaleString('en-IN')} ($${p.priceUSD})`}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Invoice History */}
      <Card className="p-6 border border-slate-200 bg-white shadow-sm">
        <h2 className="text-sm uppercase font-bold text-[#64748B] mb-4">Invoice & Payment History</h2>
        {invoices.length === 0 ? (
          <p className="text-sm text-[#475569]">No invoices recorded yet.</p>
        ) : (
          <div className="space-y-3 divide-y divide-slate-100">
            {invoices.map((inv) => (
              <div key={inv.id} className="flex justify-between items-center pt-3 first:pt-0 text-sm">
                <div className="space-y-1">
                  <p className="font-bold text-[#10233F]">{new Date(inv.issuedAt).toLocaleDateString()}</p>
                  <p className="text-xs text-[#64748B]">Billing Period: {inv.billingPeriodId}</p>
                </div>
                <div className="text-right space-y-1">
                  <p className="font-bold text-slate-900">₹{inv.amount} {inv.currency || 'INR'}</p>
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                      inv.status === 'PAID' ? 'bg-[#DCFCE7] text-[#16A34A]' : 'bg-[#F1F5F9] text-[#64748B]'
                    }`}
                  >
                    {inv.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
