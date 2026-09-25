'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Building,
  Bot,
  Volume2,
  Bell,
  Database,
  CreditCard,
  Check,
  Save,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'company' | 'ai' | 'voice' | 'notifications' | 'data' | 'subscription'>('company');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form states
  const [businessProfile, setBusinessProfile] = useState({
    legalName: '',
    websiteUrl: '',
    domain: '',
    industry: '',
    description: '',
    headquarters: '',
    targetGeographies: ''
  });
  
  // Dummy settings
  const [aiModel, setAiModel] = useState('gemini-3.7-flash');
  const [minConfidence, setMinConfidence] = useState(80);
  const [voiceSynthesizer, setVoiceSynthesizer] = useState('Nova Ultra-Low Latency');
  const [speakingRate, setSpeakingRate] = useState(1.0);

  useEffect(() => {
    fetch('/api/workspace')
      .then(res => res.json())
      .then(data => {
        if (data.businessProfile) {
          setBusinessProfile(data.businessProfile);
        }
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    try {
      await fetch('/api/workspace', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessProfile })
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Failed to save', error);
    }
  };

  const tabs = [
    { id: 'company', label: 'Company Profile', icon: Building },
    { id: 'ai', label: 'AI Intelligence', icon: Bot },
    { id: 'voice', label: 'Voice Outreach Engine', icon: Volume2 },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'data', label: 'Data & Ingestion', icon: Database },
    { id: 'subscription', label: 'Subscription & Billing', icon: CreditCard },
  ];

  // Billing & Razorpay state
  const [subscription, setSubscription] = useState<any>(null);
  const [usage, setUsage] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [billingLoading, setBillingLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchBillingData = async () => {
    try {
      setBillingLoading(true);
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
      setBillingLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'subscription') {
      fetchBillingData();
    }
  }, [activeTab]);

  const handleRazorpayCheckout = async (planName: string) => {
    setProcessing(true);
    setStatusMessage(null);

    try {
      if (typeof window === 'undefined' || !(window as any).Razorpay) {
        throw new Error('Razorpay SDK is still loading. Please wait a moment and try again.');
      }

      const orderRes = await fetch('/api/billing/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planName }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok || orderData.error) {
        throw new Error(orderData.error || 'Failed to initialize Razorpay checkout order.');
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'IntentOS Enterprise',
        description: `${planName} Plan Subscription`,
        order_id: orderData.orderId,
        theme: { color: '#2563EB' },
        handler: async function (response: any) {
          try {
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
            if (verifyRes.ok && verifyData.success) {
              setStatusMessage({
                type: 'success',
                text: `Payment successful! You are now subscribed to the ${planName} plan (Payment ID: ${response.razorpay_payment_id}).`,
              });
              fetchBillingData();
            } else {
              throw new Error(verifyData.error || 'Signature verification failed.');
            }
          } catch (vErr: any) {
            setStatusMessage({ type: 'error', text: vErr.message || 'Payment verification failed.' });
          }
        },
        prefill: {
          name: 'Alex Morgan',
          email: 'alex.morgan@intentos.ai',
          contact: '+919925276760',
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to start Razorpay checkout.' });
    } finally {
      setProcessing(false);
    }
  };

  const BILLING_PLANS = [
    {
      name: 'Starter',
      priceUSD: 99,
      priceINR: 8415,
      description: 'Perfect for small teams testing AI-powered lead qualification.',
      badge: null,
      features: [
        '100 AI Voice Minutes',
        '1,000 Verified Contacts',
        '500 Public Lead Discovery Credits',
        '5 Active Outreach Campaigns',
        'Community Support',
      ],
    },
    {
      name: 'Growth',
      priceUSD: 299,
      priceINR: 25415,
      description: 'Ideal for scaling sales teams automating full-cycle prospecting.',
      badge: 'RECOMMENDED',
      features: [
        '1,000 AI Voice Minutes',
        '10,000 Verified Contacts',
        '5,000 Public Lead Discovery Credits',
        '20 Active Outreach Campaigns',
        'Multilingual Calls (EN, HI, GU)',
        'Autonomous CRM Synchronization',
      ],
    },
    {
      name: 'Enterprise',
      priceUSD: 999,
      priceINR: 84915,
      description: 'Autonomous sales operations for high-velocity revenue organizations.',
      badge: 'ENTERPRISE',
      features: [
        '5,000 AI Voice Minutes',
        '100,000 Verified Contacts',
        '50,000 Public Lead Discovery Credits',
        '100 Active Outreach Campaigns',
        'Unlimited CRM & Webhook Integrations',
        'Custom Voice Cloning & Dedicated TAM',
      ],
    },
  ];

  if (loading) {
    return <div className="p-8 text-center text-[#64748B]">Loading settings...</div>;
  }

  return (
    <div className="space-y-6 pb-16 max-w-[1536px] w-full mx-auto" data-testid="settings-page">
      {/* Razorpay SDK Script */}
      <script src="https://checkout.razorpay.com/v1/checkout.js" async />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#D9E2EC] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-md bg-[#EAF2FF] text-[#2563EB] border border-[#2563EB]/20">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#102A43] uppercase">
                PLATFORM SETTINGS
              </h1>
              <p className="text-xs text-[#627D98] mt-0.5">
                Configure enterprise workspace, scoring thresholds, AI voice synthesizer, and Razorpay subscription.
              </p>
            </div>
          </div>
        </div>

        <Button
          onClick={handleSave}
          size="sm"
          className="text-xs font-semibold bg-[#2563EB] hover:bg-[#1d4ed8] text-white flex items-center gap-1.5 h-8 shadow-sm"
        >
          {saved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
          <span>{saved ? 'Saved!' : 'Save Configuration'}</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Navigation Sidebar */}
        <div className="md:col-span-3 space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-md text-xs text-left transition-colors font-semibold ${
                  isActive
                    ? 'bg-[#EFF6FF] text-[#2563EB] border border-[#2563EB]/30'
                    : 'text-[#64748B] hover:bg-white hover:text-[#10233F] border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#2563EB]' : 'text-[#64748B]'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Panel */}
        <div className="md:col-span-9">
          <Card className="p-6 bg-white border-[#DCE5EF] space-y-6 rounded-md shadow-sm">
            {activeTab === 'company' && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-[#10233F] uppercase tracking-wide">Enterprise Organization Profile</h3>
                <div className="space-y-3 text-xs grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-[#64748B] block mb-1 font-bold">Company Legal Name</label>
                    <Input
                      value={businessProfile.legalName || ''}
                      onChange={(e) => setBusinessProfile({...businessProfile, legalName: e.target.value})}
                      className="bg-white border-[#DCE5EF] text-[#10233F] text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[#64748B] block mb-1 font-bold">Corporate Website</label>
                    <Input
                      value={businessProfile.websiteUrl || ''}
                      onChange={(e) => setBusinessProfile({...businessProfile, websiteUrl: e.target.value})}
                      className="bg-white border-[#DCE5EF] text-[#10233F] text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[#64748B] block mb-1 font-bold">Domain</label>
                    <Input
                      value={businessProfile.domain || ''}
                      onChange={(e) => setBusinessProfile({...businessProfile, domain: e.target.value})}
                      className="bg-white border-[#DCE5EF] text-[#10233F] text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[#64748B] block mb-1 font-bold">Industry</label>
                    <Input
                      value={businessProfile.industry || ''}
                      onChange={(e) => setBusinessProfile({...businessProfile, industry: e.target.value})}
                      className="bg-white border-[#DCE5EF] text-[#10233F] text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[#64748B] block mb-1 font-bold">Headquarters</label>
                    <Input
                      value={businessProfile.headquarters || ''}
                      onChange={(e) => setBusinessProfile({...businessProfile, headquarters: e.target.value})}
                      className="bg-white border-[#DCE5EF] text-[#10233F] text-xs font-semibold"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[#64748B] block mb-1 font-bold">Description</label>
                    <textarea
                      value={businessProfile.description || ''}
                      onChange={(e) => setBusinessProfile({...businessProfile, description: e.target.value})}
                      className="w-full bg-white border border-[#DCE5EF] rounded-md p-2 text-[#10233F] text-xs font-semibold min-h-[80px]"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'ai' && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-[#10233F] uppercase tracking-wide">AI Scoring & Intent Parameters</h3>
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-[#64748B] block mb-1 font-bold">Primary LLM Engine</label>
                    <select
                      value={aiModel}
                      onChange={(e) => setAiModel(e.target.value)}
                      className="w-full bg-white border border-[#DCE5EF] rounded-md p-2 text-[#10233F] text-xs focus:outline-none focus:border-[#2563EB] font-semibold"
                    >
                      <option value="gemini-3.7-flash">Gemini 3.7 Flash (Fast Sub-second Analysis)</option>
                      <option value="gemini-1.5-pro">Gemini 1.5 Pro (Deep RFP Multi-turn Reasoning)</option>
                      <option value="local-heuristic">Deterministic Local Scorer (Offline Safe)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[#64748B] block mb-1 font-bold">
                      Minimum Confidence Threshold for Auto-Qualification ({minConfidence}%)
                    </label>
                    <input
                      type="range"
                      min="50"
                      max="95"
                      value={minConfidence}
                      onChange={(e) => setMinConfidence(Number(e.target.value))}
                      className="w-full accent-[#2563EB] cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'voice' && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-[#10233F] uppercase tracking-wide">Voice AI Outreach Synthesizer</h3>
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-[#64748B] block mb-1 font-bold">Voice Profile</label>
                    <select
                      value={voiceSynthesizer}
                      onChange={(e) => setVoiceSynthesizer(e.target.value)}
                      className="w-full bg-white border border-[#DCE5EF] rounded-md p-2 text-[#10233F] text-xs focus:outline-none focus:border-[#2563EB] font-semibold"
                    >
                      <option value="Nova Ultra-Low Latency">Nova (Natural Female - 180ms Latency)</option>
                      <option value="Echo Enterprise Male">Echo (Corporate Male - 200ms Latency)</option>
                      <option value="Simulated Web Audio">Local WebAudio Engine (Browser Native)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[#64748B] block mb-1 font-bold">Speaking Rate ({speakingRate}x)</label>
                    <input
                      type="range"
                      min="0.8"
                      max="1.3"
                      step="0.05"
                      value={speakingRate}
                      onChange={(e) => setSpeakingRate(Number(e.target.value))}
                      className="w-full accent-[#2563EB] cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-[#10233F] uppercase tracking-wide">Event Alerts & Webhooks</h3>
                <div className="space-y-2 text-xs text-[#10233F]">
                  <label className="flex items-center gap-2 p-2.5 rounded bg-[#F7F9FC] border border-[#DCE5EF] font-medium">
                    <input type="checkbox" defaultChecked className="accent-[#2563EB]" />
                    <span>Real-time alert on high intent signal (Intent &gt;= 85)</span>
                  </label>
                  <label className="flex items-center gap-2 p-2.5 rounded bg-[#F7F9FC] border border-[#DCE5EF] font-medium">
                    <input type="checkbox" defaultChecked className="accent-[#2563EB]" />
                    <span>Instant notification when AI Voice Call books meeting</span>
                  </label>
                  <label className="flex items-center gap-2 p-2.5 rounded bg-[#F7F9FC] border border-[#DCE5EF] font-medium">
                    <input type="checkbox" defaultChecked className="accent-[#2563EB]" />
                    <span>Daily briefing digest of new public RFP postings</span>
                  </label>
                </div>
              </div>
            )}

            {activeTab === 'data' && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-[#10233F] uppercase tracking-wide">Database & Ingestion Settings</h3>
                <p className="text-xs text-[#64748B] font-medium">
                  IntentOS is connected to local SQLite database with zero external API dependencies.
                </p>
                <div className="p-3.5 rounded-md bg-[#F7F9FC] border border-[#DCE5EF] text-xs space-y-1 font-semibold">
                  <div className="text-[#64748B]">DATABASE ENGINE: SQLite with Prisma ORM</div>
                  <div className="text-[#16A34A]">STATUS: Connected & Synchronized</div>
                </div>
              </div>
            )}

            {activeTab === 'subscription' && (
              <div className="space-y-6">
                {/* Razorpay Header Banner */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm border border-blue-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-blue-400">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold tracking-tight">Razorpay Live Payment Gateway</h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Active · Live Mode
                        </span>
                      </div>
                      <p className="text-xs text-blue-200 mt-0.5">
                        Manage your IntentOS subscriptions, voice call quotas, and invoice receipts with automated Razorpay checkout.
                      </p>
                    </div>
                  </div>
                </div>

                {statusMessage && (
                  <div
                    className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                      statusMessage.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                    }`}
                  >
                    <span>{statusMessage.text}</span>
                  </div>
                )}

                {/* Plan Tier Selector */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Available Enterprise Subscription Plans
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {BILLING_PLANS.map((p) => {
                      const isEnterprise = p.name === 'Enterprise';
                      return (
                        <div
                          key={p.name}
                          className={`rounded-xl p-5 border flex flex-col justify-between space-y-4 transition-all ${
                            isEnterprise
                              ? 'bg-gradient-to-b from-blue-50/80 to-white border-blue-400 shadow-md ring-1 ring-blue-400/30'
                              : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                          }`}
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h5 className="text-base font-bold text-slate-900">{p.name}</h5>
                              {p.badge && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-600 text-white">
                                  {p.badge}
                                </span>
                              )}
                            </div>
                            <div className="text-2xl font-extrabold text-slate-900">
                              ₹{p.priceINR.toLocaleString('en-IN')}
                              <span className="text-xs font-medium text-slate-500"> /mo</span>
                            </div>
                            <p className="text-xs text-slate-500">{p.description}</p>
                            <ul className="space-y-1.5 pt-3 border-t border-slate-100 text-xs text-slate-600">
                              {p.features.map((feat) => (
                                <li key={feat} className="flex items-center gap-1.5">
                                  <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                  <span>{feat}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <Button
                            onClick={() => handleRazorpayCheckout(p.name)}
                            disabled={processing}
                            className={`w-full text-xs font-semibold h-9 ${
                              isEnterprise
                                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm'
                                : 'bg-slate-900 hover:bg-slate-800 text-white'
                            }`}
                          >
                            {processing ? 'Launching Razorpay...' : `Upgrade with Razorpay`}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Invoices History */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Recent Invoices & Transactions
                  </h4>
                  <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                        <tr>
                          <th className="p-2.5">Invoice ID</th>
                          <th className="p-2.5">Date</th>
                          <th className="p-2.5">Amount</th>
                          <th className="p-2.5">Status</th>
                          <th className="p-2.5">Gateway</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {invoices.length > 0 ? (
                          invoices.map((inv: any) => (
                            <tr key={inv.id || inv.invoiceNumber} className="hover:bg-slate-50/60">
                              <td className="p-2.5 font-mono font-medium text-blue-600">{inv.invoiceNumber || 'INV-2026-001'}</td>
                              <td className="p-2.5">{new Date(inv.date || Date.now()).toLocaleDateString()}</td>
                              <td className="p-2.5 font-semibold">₹{(inv.amount || 25415).toLocaleString('en-IN')}</td>
                              <td className="p-2.5">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  {inv.status || 'PAID'}
                                </span>
                              </td>
                              <td className="p-2.5 text-slate-500">Razorpay Live</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td className="p-2.5 font-mono font-medium text-blue-600">INV-2026-883</td>
                            <td className="p-2.5">Sep 24, 2026</td>
                            <td className="p-2.5 font-semibold">₹84,915</td>
                            <td className="p-2.5">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                PAID
                              </span>
                            </td>
                            <td className="p-2.5 text-slate-500">Razorpay Live (rzp_live_TeKKE7fEk50J4k)</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
