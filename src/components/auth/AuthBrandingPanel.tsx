import React from 'react';
import Link from 'next/link';
import {
  Zap,
  Sparkles,
  PhoneCall,
  Search,
  ShieldCheck,
  Star,
  CheckCircle2,
  TrendingUp,
  Bot
} from 'lucide-react';

interface AuthBrandingPanelProps {
  mode: 'signin' | 'signup';
}

export function AuthBrandingPanel({ mode }: AuthBrandingPanelProps) {
  return (
    <div className="hidden lg:flex lg:w-[48%] xl:w-[50%] bg-[#080C15] relative overflow-hidden flex-col justify-between p-10 xl:p-14 border-r border-slate-800/80 selection:bg-blue-500/30">
      {/* Background Gradient Mesh & Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(37,99,235,0.15),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(232,89,12,0.12),transparent_45%)] pointer-events-none" />
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)`,
          backgroundSize: '32px 32px'
        }}
      />
      <div className="absolute top-1/4 -right-16 w-72 h-72 bg-blue-500/10 rounded-full blur-[90px] pointer-events-none" />
      <div className="absolute bottom-1/4 -left-16 w-72 h-72 bg-amber-500/10 rounded-full blur-[90px] pointer-events-none" />

      {/* Top Header / Brand */}
      <div className="relative z-10">
        <Link href="/" className="inline-flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-amber-500 flex items-center justify-center text-white shadow-[0_0_20px_rgba(37,99,235,0.35)] transition-transform group-hover:scale-105 duration-200">
            <Zap className="w-5 h-5 fill-white text-white" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight text-white font-sans">INTENTOS</span>
              <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full tracking-wider uppercase">
                AI Platform
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Autonomous Sales & Voice Intelligence</span>
          </div>
        </Link>
      </div>

      {/* Middle Content Section */}
      <div className="relative z-10 my-auto py-8 max-w-lg">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400 text-xs font-semibold mb-6 shadow-[0_0_12px_rgba(59,130,246,0.15)]">
          <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
          <span>{mode === 'signup' ? '14-Day Free Enterprise Trial' : 'Next-Gen Sales Automation'}</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-white leading-tight mb-4">
          {mode === 'signup' ? (
            <>
              Scale pipeline with <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-amber-400">autonomous AI sales reps</span>
            </>
          ) : (
            <>
              Welcome back to your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-amber-400">AI revenue engine</span>
            </>
          )}
        </h1>

        <p className="text-slate-300 text-sm xl:text-base leading-relaxed mb-8">
          IntentOS discovers high-intent prospects, runs sub-second AI voice outreach calls, and books qualified meetings directly to your calendar.
        </p>

        {/* Feature List */}
        <div className="space-y-4">
          <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md transition-colors hover:border-slate-700">
            <div className="p-2 rounded-lg bg-blue-500/15 text-blue-400 shrink-0 border border-blue-500/20">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-200">AI Lead Discovery & Intent Scoring</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Real-time signals identify high-propensity buyers before your competitors.</p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md transition-colors hover:border-slate-700">
            <div className="p-2 rounded-lg bg-amber-500/15 text-amber-400 shrink-0 border border-amber-500/20">
              <PhoneCall className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-200">Ultra-Realistic AI Voice Calling</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Sub-500ms conversational agents qualify prospects and handle objection paths.</p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md transition-colors hover:border-slate-700">
            <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-400 shrink-0 border border-emerald-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-200">Live Competitor & Market Intelligence</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Automated tech stack tracking, job hiring spikes, and executive change alerts.</p>
            </div>
          </div>
        </div>

        {/* Platform Highlights & Impact Card */}
        <div className="mt-8 p-4 rounded-xl bg-gradient-to-br from-slate-900/90 to-slate-950/90 border border-slate-800/90 shadow-xl">
          <div className="flex items-center gap-2 mb-2 text-amber-400">
            <Bot className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-slate-200">Autonomous Sales Infrastructure</span>
          </div>
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-center">
            <div className="p-2 rounded-lg bg-slate-800/40">
              <div className="text-base font-bold text-white">&lt;500ms</div>
              <div className="text-[10px] text-slate-400">Voice Latency</div>
            </div>
            <div className="p-2 rounded-lg bg-slate-800/40">
              <div className="text-base font-bold text-amber-400">24 / 7</div>
              <div className="text-[10px] text-slate-400">Continuous Outreach</div>
            </div>
            <div className="p-2 rounded-lg bg-slate-800/40">
              <div className="text-base font-bold text-emerald-400">100%</div>
              <div className="text-[10px] text-slate-400">CRM Sync</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Trust & Compliance Footer */}
      <div className="relative z-10 pt-6 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-[11px] text-slate-500 font-medium">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" /> SOC2 Type II Certified
          </span>
          <span className="flex items-center gap-1 text-slate-400">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 99.99% Uptime SLA
          </span>
        </div>
        <div className="text-slate-500">
          256-bit TLS Encryption
        </div>
      </div>
    </div>
  );
}
