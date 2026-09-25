'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Zap,
  ArrowRight,
  Play,
  Search,
  Sparkles,
  PhoneCall,
  CheckCircle2,
  Database,
  TrendingUp,
  ShieldCheck,
  Headphones,
  Megaphone,
  Layers,
  Menu,
  X,
  ChevronRight,
  Target,
  Crown,
  Hexagon,
  Triangle,
  Command,
  Ghost,
  Gem,
  Cpu,
  Activity,
  Globe,
  Lock
} from 'lucide-react';

const CLIENTS = [
  { name: 'Nexora Systems', icon: Hexagon },
  { name: 'Quantum Cloud', icon: Triangle },
  { name: 'Command+Z AI', icon: Command },
  { name: 'Phantom Tech', icon: Ghost },
  { name: 'Ruby Data Labs', icon: Gem },
  { name: 'Chipset Dynamics', icon: Cpu },
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-[#F5F5F7] font-sans selection:bg-[#F59E0B]/30 selection:text-[#F59E0B]">
      <style>{`
        @keyframes wavePulse {
          0%, 100% { height: 6px; }
          50% { height: 24px; }
        }
        .waveform-bar-1 { animation: wavePulse 1.2s ease-in-out infinite 0.1s; }
        .waveform-bar-2 { animation: wavePulse 1.2s ease-in-out infinite 0.3s; }
        .waveform-bar-3 { animation: wavePulse 1.2s ease-in-out infinite 0.5s; }
        .waveform-bar-4 { animation: wavePulse 1.2s ease-in-out infinite 0.2s; }
        .waveform-bar-5 { animation: wavePulse 1.2s ease-in-out infinite 0.4s; }
      `}</style>

      {/* ═══════════════════════════════════════
          1. HEADER (Sticky with backdrop-blur)
          ═══════════════════════════════════════ */}
      <header
        className={`sticky top-0 z-50 h-[72px] transition-all duration-200 border-b ${
          scrolled
            ? 'bg-[#0B0F1A]/90 backdrop-blur-xl border-[#232B3D] shadow-[0_4px_20px_rgba(0,0,0,0.5)]'
            : 'bg-[#0B0F1A]/70 backdrop-blur-md border-[#232B3D]/70'
        }`}
      >
        <div className="max-w-[1280px] mx-auto h-full px-6 flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center text-white shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-transform group-hover:scale-105">
              <Zap className="w-4.5 h-4.5 fill-white text-white" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-white">INTENTOS</span>
              <span className="text-[11px] font-semibold text-[#F59E0B] border border-[#F59E0B]/80 px-2 py-0.5 rounded-full tracking-wider uppercase">
                ENTERPRISE
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {[
              { label: 'Product', href: '#features' },
              { label: 'How it Works', href: '#how-it-works' },
              { label: 'Features', href: '#features' },
              { label: 'Pricing', href: '#pricing' },
              { label: 'Dashboard', href: '/dashboard' },
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-sm font-medium text-[#9CA3AF] hover:text-[#F5F5F7] transition-colors relative group py-1"
              >
                {item.label}
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#F59E0B] opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            ))}
          </nav>

          {/* Right Action CTAs */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              href="/login"
              className="h-10 px-4 text-sm font-medium text-white border border-[#232B3D] hover:border-slate-600 hover:bg-white/5 rounded-lg transition-all flex items-center justify-center"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="h-10 px-4 text-sm font-semibold bg-[#F59E0B] hover:bg-[#D97706] text-[#0B0F1A] rounded-lg transition-all shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:shadow-[0_0_25px_rgba(245,158,11,0.4)] flex items-center justify-center active:scale-[0.98]"
            >
              Start Free Trial
            </Link>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-[#9CA3AF] hover:text-white rounded-lg hover:bg-white/5"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Fullscreen Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-x-0 top-[72px] bottom-0 bg-[#0B0F1A]/95 backdrop-blur-2xl border-b border-[#232B3D] p-6 flex flex-col justify-between z-50">
            <nav className="flex flex-col gap-4">
              {[
                { label: 'Product', href: '#features' },
                { label: 'How it Works', href: '#how-it-works' },
                { label: 'Features', href: '#features' },
                { label: 'Pricing', href: '#pricing' },
                { label: 'Live Cockpit', href: '/calls' },
                { label: 'Dashboard', href: '/dashboard' },
              ].map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-lg font-semibold text-white py-3 border-b border-[#232B3D]/50 flex items-center justify-between"
                >
                  <span>{item.label}</span>
                  <ChevronRight className="w-4 h-4 text-[#F59E0B]" />
                </a>
              ))}
            </nav>

            <div className="flex flex-col gap-3 pt-6">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full h-12 flex items-center justify-center text-sm font-medium text-white border border-[#232B3D] rounded-lg"
              >
                Sign In
              </Link>
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full h-12 flex items-center justify-center text-sm font-semibold bg-[#F59E0B] text-[#0B0F1A] rounded-lg shadow-lg"
              >
                Start Free Trial →
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ═══════════════════════════════════════
          2. HERO SECTION
          ═══════════════════════════════════════ */}
      <section className="relative pt-[120px] pb-[96px] overflow-hidden border-b border-[#232B3D]/50">
        {/* Radial Ambient Glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-[#F59E0B]/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-[1280px] mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Column (55%) */}
            <div className="lg:col-span-7 space-y-7">
              {/* Eyebrow badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-[#F59E0B]/40 bg-[#F59E0B]/10 px-3.5 py-1.5 backdrop-blur-md">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22C55E] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22C55E]"></span>
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#F5F5F7] flex items-center gap-1.5">
                  Nova AI: Active · AI-Powered Sales Intelligence
                  <Zap className="w-3.5 h-3.5 text-[#F59E0B] fill-[#F59E0B]" />
                </span>
              </div>

              {/* H1 Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-bold tracking-tight text-[#F5F5F7] leading-[1.1] max-w-2xl">
                Find Your Next Customer.{' '}
                <span className="bg-gradient-to-r from-white via-white to-[#F59E0B] bg-clip-text text-transparent">
                  Before They Find a Competitor.
                </span>
              </h1>

              {/* Subheadline */}
              <p className="text-base sm:text-lg text-[#9CA3AF] max-w-[500px] leading-relaxed">
                Intentos discovers high-intent prospects the moment they post a requirement — on
                LinkedIn, X, company sites, and freelance platforms — then qualifies and engages them
                through AI voice calls in their language.
              </p>

              {/* CTA Row */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                <Link
                  href="/signup"
                  className="h-12 px-7 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-[#0B0F1A] font-semibold text-sm flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(245,158,11,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>Start Free Trial</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/calls"
                  className="h-12 px-6 rounded-xl border border-[#232B3D] bg-[#131826]/70 hover:bg-[#131826] text-white text-sm font-medium flex items-center justify-center gap-2.5 transition-all hover:border-slate-600"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Watch Demo Cockpit</span>
                </Link>
              </div>

              {/* Trust Microcopy */}
              <p className="text-[13px] text-[#9CA3AF] flex items-center gap-2 pt-1">
                <CheckCircle2 className="w-4 h-4 text-[#22C55E]" />
                No credit card required · Setup in under 10 minutes
              </p>
            </div>

            {/* Right Column (45%) Mockup */}
            <div className="lg:col-span-5 relative">
              {/* Product Frame Mockup */}
              <div className="rounded-2xl border border-[#232B3D] bg-[#131826] shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden">
                {/* Browser Top Bar */}
                <div className="h-10 bg-[#0F1420] border-b border-[#232B3D] px-4 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                  </div>
                  <div className="text-[11px] text-[#9CA3AF] font-mono flex items-center gap-1.5 bg-[#131826] px-3 py-1 rounded-md border border-[#232B3D]">
                    <Lock className="w-3 h-3 text-[#22C55E]" />
                    app.intentos.ai/dashboard
                  </div>
                  <div className="w-8" />
                </div>

                {/* Dashboard Inner Preview */}
                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#232B3D]">
                    <div>
                      <h4 className="text-xs font-bold text-white tracking-wider uppercase">
                        High Intent Pipeline Queue
                      </h4>
                      <p className="text-[10px] text-[#9CA3AF]">Autonomous buying signals</p>
                    </div>
                    <span className="text-[10px] font-bold text-[#F59E0B] bg-[#F59E0B]/10 border border-[#F59E0B]/30 px-2 py-0.5 rounded">
                      Live Stream
                    </span>
                  </div>

                  {/* Lead Item 1 (Hero) */}
                  <div className="p-3 rounded-xl bg-[#0B0F1A] border border-[#F59E0B]/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center text-xs font-bold">
                          TN
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-white">TechNova Solutions</div>
                          <div className="text-[10px] text-[#9CA3AF]">John Doe · CTO</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-extrabold text-[#F59E0B] bg-[#F59E0B]/15 px-2 py-0.5 rounded-md">
                          94% Match
                        </span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-tight">
                      Microsoft 365 & SharePoint Implementation RFP · Budget $55,000
                    </p>
                  </div>

                  {/* Lead Item 2 */}
                  <div className="p-3 rounded-xl bg-[#0B0F1A]/60 border border-[#232B3D] space-y-1.5 opacity-85">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center text-xs font-bold">
                          NS
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-white">Nova Systems</div>
                          <div className="text-[10px] text-[#9CA3AF]">Elena Rostova · VP Sec</div>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-md">
                        89% Match
                      </span>
                    </div>
                  </div>

                  {/* Metric Summary */}
                  <div className="grid grid-cols-2 gap-2 pt-1 text-center">
                    <div className="p-2 rounded-lg bg-[#0B0F1A] border border-[#232B3D]">
                      <div className="text-sm font-bold text-white">12,480+</div>
                      <div className="text-[10px] text-[#9CA3AF]">Scanned RFPs</div>
                    </div>
                    <div className="p-2 rounded-lg bg-[#0B0F1A] border border-[#232B3D]">
                      <div className="text-sm font-bold text-[#22C55E]">98.2%</div>
                      <div className="text-[10px] text-[#9CA3AF]">Voice Accuracy</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Live Call Widget */}
              <div className="absolute -bottom-6 -left-6 bg-[#131826] border border-[#F59E0B]/50 rounded-2xl p-4 shadow-[0_12px_30px_rgba(0,0,0,0.7)] backdrop-blur-xl flex items-center gap-4 max-w-[260px] animate-bounce-subtle">
                <div className="w-10 h-10 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/30 flex items-center justify-center text-[#22C55E]">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-ping" />
                    <span className="text-xs font-bold text-white">AI Call In Progress</span>
                  </div>
                  <div className="text-[10px] text-[#9CA3AF] mb-1">Qualifying John Doe</div>
                  {/* Waveform Bars */}
                  <div className="flex items-center gap-1 h-5">
                    <div className="w-1 bg-[#F59E0B] rounded-full waveform-bar-1" />
                    <div className="w-1 bg-[#F59E0B] rounded-full waveform-bar-2" />
                    <div className="w-1 bg-[#F59E0B] rounded-full waveform-bar-3" />
                    <div className="w-1 bg-[#F59E0B] rounded-full waveform-bar-4" />
                    <div className="w-1 bg-[#F59E0B] rounded-full waveform-bar-5" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          3. SOCIAL PROOF STRIP
          ═══════════════════════════════════════ */}
      <section className="bg-[#0F1420] py-8 border-b border-[#232B3D]">
        <div className="max-w-[1280px] mx-auto px-6 space-y-6">
          <p className="text-center text-[13px] font-medium tracking-[0.08em] text-[#9CA3AF] uppercase">
            TRUSTED BY REVENUE TEAMS AT
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 lg:gap-16">
            {CLIENTS.map((client) => {
              const Icon = client.icon;
              return (
                <div
                  key={client.name}
                  className="flex items-center gap-2.5 opacity-50 hover:opacity-100 transition-all hover:scale-105 cursor-default grayscale hover:grayscale-0"
                >
                  <Icon className="w-5 h-5 text-white" />
                  <span className="text-sm font-semibold tracking-tight text-white">
                    {client.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          4. HOW IT WORKS
          ═══════════════════════════════════════ */}
      <section id="how-it-works" className="py-24 max-w-[1280px] mx-auto px-6 space-y-16">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-xs font-bold text-[#F59E0B] tracking-widest uppercase">
            HOW IT WORKS
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#F5F5F7]">
            From Cold Lead to Booked Call — Fully Automated
          </h2>
          <p className="text-sm sm:text-base text-[#9CA3AF]">
            Our autonomous intelligence engine handles the entire top of the funnel in real time.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {[
            {
              step: '01',
              title: 'Discover',
              icon: Search,
              desc: 'AI scans LinkedIn, X, company sites, and public directories for prospects actively posting requirements.',
            },
            {
              step: '02',
              title: 'Enrich & Qualify',
              icon: Sparkles,
              desc: 'Every lead is enriched with contact info, company data, and an AI-generated fit score — automatically.',
            },
            {
              step: '03',
              title: 'AI Calls, Multilingual',
              icon: PhoneCall,
              desc: "Our voice agent calls, qualifies, handles objections, and answers FAQs in the prospect's preferred language.",
            },
            {
              step: '04',
              title: 'You Close',
              icon: CheckCircle2,
              desc: 'Interested prospects are flagged instantly with full transcripts and next-best-action recommendations.',
            },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="relative rounded-2xl bg-[#131826] border border-[#232B3D] p-6 space-y-4 hover:border-[#F59E0B]/40 hover:-translate-y-1 transition-all group shadow-[0_4px_24px_rgba(0,0,0,0.3)]"
              >
                <div className="flex items-center justify-between">
                  <div className="w-14 h-14 rounded-2xl bg-[#F59E0B]/10 border border-[#F59E0B]/20 text-[#F59E0B] flex items-center justify-center transition-transform group-hover:scale-105">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-mono font-bold text-[#9CA3AF] bg-[#0B0F1A] px-2.5 py-1 rounded-md border border-[#232B3D]">
                    STEP {item.step}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white pt-1">{item.title}</h3>
                <p className="text-sm text-[#9CA3AF] leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ═══════════════════════════════════════
          5. FEATURE GRID
          ═══════════════════════════════════════ */}
      <section id="features" className="py-24 bg-[#0F1420] border-y border-[#232B3D]">
        <div className="max-w-[1280px] mx-auto px-6 space-y-16">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-bold text-[#F59E0B] tracking-widest uppercase">
              CAPABILITIES
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#F5F5F7]">
              Everything Your Sales Team Needs, In One Platform
            </h2>
            <p className="text-sm sm:text-base text-[#9CA3AF]">
              Engineered for modern enterprise outbound workflows with enterprise-grade reliability.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'AI Lead Discovery',
                icon: Search,
                desc: 'Continuously finds prospects from LinkedIn, X, company sites, and freelance platforms — with full source transparency.',
              },
              {
                title: 'Lead Enrichment',
                icon: ShieldCheck,
                desc: 'Verified contacts, company size, job titles, and firmographic data added automatically to every lead.',
              },
              {
                title: 'Market Intelligence',
                icon: TrendingUp,
                desc: 'Track funding events, hiring surges, and tech stack changes to time your outreach perfectly.',
              },
              {
                title: 'AI Voice Agent',
                icon: Headphones,
                desc: 'Outbound and inbound calls, FAQ handling, callbacks, voicemail, and multilingual conversations — at scale.',
              },
              {
                title: 'CRM Integration',
                icon: Database,
                desc: 'Sync leads, calls, and outcomes with your existing CRM in real time. No manual data entry.',
              },
              {
                title: 'Campaign Management',
                icon: Megaphone,
                desc: 'Schedule by timezone, segment by industry, and monitor performance from one unified dashboard.',
              },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.title}
                  className="rounded-xl bg-[#131826] border border-[#232B3D] p-6 space-y-3 hover:border-[#F59E0B]/40 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(245,158,11,0.15)] transition-all duration-200"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/20 flex items-center justify-center text-[#F59E0B]">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-semibold text-white pt-1">{card.title}</h3>
                  <p className="text-sm text-[#9CA3AF] leading-relaxed">{card.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          6. METRICS BAND
          ═══════════════════════════════════════ */}
      <section className="py-16 bg-[#0B0F1A] border-b border-[#232B3D]">
        <div className="max-w-[1280px] mx-auto px-6 space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {[
              { stat: '3.2x', label: 'More meetings booked' },
              { stat: '68%', label: 'Less manual prospecting time' },
              { stat: '20+', label: 'Languages supported' },
              { stat: '<2min', label: 'Average time to first contact' },
            ].map((metric) => (
              <div key={metric.label} className="space-y-1">
                <div className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-white via-[#F59E0B] to-[#F59E0B] bg-clip-text text-transparent">
                  {metric.stat}
                </div>
                <div className="text-sm text-[#9CA3AF] font-medium">{metric.label}</div>
              </div>
            ))}
          </div>
          <p className="text-center text-[12px] text-slate-500 pt-4">
            * Based on early access customer data and benchmark simulations.
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          7. PRICING TEASER
          ═══════════════════════════════════════ */}
      <section id="pricing" className="py-24 max-w-[1280px] mx-auto px-6 space-y-16">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-xs font-bold text-[#F59E0B] tracking-widest uppercase">
            SCALABLE PRICING
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#F5F5F7]">
            Plans That Scale With Your Pipeline
          </h2>
          <p className="text-sm sm:text-base text-[#9CA3AF]">
            Transparent usage tiers engineered for high-growth inside sales teams.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {/* Starter Plan */}
          <div className="rounded-2xl bg-[#131826] border border-[#232B3D] p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white">Starter</h3>
              <p className="text-xs text-[#9CA3AF]">For small teams testing AI outreach</p>
              <div className="text-2xl font-bold text-white pt-2">₹8,415 <span className="text-xs font-medium text-[#9CA3AF]">($99/mo)</span></div>
              <ul className="space-y-3 pt-4 border-t border-[#232B3D] text-sm text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#22C55E]" /> Up to 500 leads / month
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#22C55E]" /> 200 AI voice call minutes
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#22C55E]" /> Standard Email Support
                </li>
              </ul>
            </div>
            <Link
              href="/settings/billing"
              className="w-full h-11 border border-[#232B3D] hover:bg-white/5 text-white font-semibold text-xs rounded-xl flex items-center justify-center transition-colors"
            >
              Get Started with Razorpay &rarr;
            </Link>
          </div>

          {/* Growth Plan */}
          <div className="rounded-2xl bg-[#131826] border border-[#232B3D] p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white">Growth</h3>
              <p className="text-xs text-[#9CA3AF]">For scaling outbound sales teams</p>
              <div className="text-2xl font-bold text-white pt-2">₹25,415 <span className="text-xs font-medium text-[#9CA3AF]">($299/mo)</span></div>
              <ul className="space-y-3 pt-4 border-t border-[#232B3D] text-sm text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#22C55E]" /> Up to 5,000 leads / month
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#22C55E]" /> 2,000 AI call minutes
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#22C55E]" /> Real-time CRM Sync
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#22C55E]" /> Multilingual Voice Scenarios
                </li>
              </ul>
            </div>
            <Link
              href="/settings/billing"
              className="w-full h-11 border border-[#232B3D] hover:bg-white/5 text-white font-semibold text-xs rounded-xl flex items-center justify-center transition-colors"
            >
              Get Started with Razorpay &rarr;
            </Link>
          </div>

          {/* Enterprise Plan (Highlighted) */}
          <div className="rounded-2xl bg-[#131826] border-2 border-[#F59E0B] p-8 flex flex-col justify-between space-y-6 relative shadow-[0_0_30px_rgba(245,158,11,0.15)]">
            <div className="absolute -top-3.5 right-6 bg-[#F59E0B] text-[#0B0F1A] text-[10px] font-extrabold uppercase px-3 py-1 rounded-full tracking-wider shadow-sm">
              Most Popular · Enterprise
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-white">Enterprise</h3>
                <Crown className="w-4 h-4 text-[#F59E0B]" />
              </div>
              <p className="text-xs text-[#9CA3AF]">For revenue orgs operating at scale</p>
              <div className="text-2xl font-bold text-[#F59E0B] pt-2">₹84,915 <span className="text-xs font-medium text-amber-200/80">($999/mo)</span></div>
              <ul className="space-y-3 pt-4 border-t border-[#232B3D] text-sm text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#F59E0B]" /> Unlimited lead discovery
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#F59E0B]" /> Custom voice concurrency
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#F59E0B]" /> Dedicated Success Manager
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#F59E0B]" /> SAML SSO & Audit Logs
                </li>
              </ul>
            </div>
            <Link
              href="/settings/billing"
              className="w-full h-11 bg-[#F59E0B] hover:bg-[#D97706] text-[#0B0F1A] font-bold text-xs rounded-xl flex items-center justify-center transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)]"
            >
              Upgrade via Razorpay →
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          8. FINAL CTA BAND
          ═══════════════════════════════════════ */}
      <section className="py-24 bg-gradient-to-b from-[#131826] to-[#0B0F1A] border-t border-[#232B3D] relative overflow-hidden text-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#F59E0B]/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-[700px] mx-auto px-6 space-y-6 relative z-10">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Ready to Fill Your Pipeline on Autopilot?
          </h2>
          <p className="text-base text-[#9CA3AF]">
            Start your free trial today — no credit card required.
          </p>
          <div className="pt-2">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 h-[52px] px-8 rounded-xl bg-[#F59E0B] hover:bg-[#D97706] text-[#0B0F1A] font-bold text-sm shadow-[0_0_30px_rgba(245,158,11,0.35)] transition-all hover:scale-[1.03] active:scale-[0.98]"
            >
              <span>Start Free Trial</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          9. FOOTER
          ═══════════════════════════════════════ */}
      <footer className="bg-[#0B0F1A] border-t border-[#232B3D] pt-16 pb-8 text-sm">
        <div className="max-w-[1280px] mx-auto px-6 space-y-12">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            {/* Logo + Tagline Column */}
            <div className="col-span-2 space-y-4">
              <Link href="/" className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center text-white">
                  <Zap className="w-4 h-4 fill-white" />
                </div>
                <span className="font-bold text-base tracking-tight text-white">INTENTOS</span>
              </Link>
              <p className="text-xs text-[#9CA3AF] max-w-sm leading-relaxed">
                AI-powered sales intelligence for modern revenue teams. Turn public buying signals
                into booked revenue.
              </p>
            </div>

            {/* Link Column: Product */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-white uppercase tracking-wider">Product</div>
              <ul className="space-y-2 text-xs text-[#9CA3AF]">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><Link href="/dashboard" className="hover:text-white transition-colors">Integrations</Link></li>
                <li><Link href="/intelligence" className="hover:text-white transition-colors">Changelog</Link></li>
              </ul>
            </div>

            {/* Link Column: Company */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-white uppercase tracking-wider">Company</div>
              <ul className="space-y-2 text-xs text-[#9CA3AF]">
                <li><a href="#how-it-works" className="hover:text-white transition-colors">About</a></li>
                <li><Link href="/onboarding" className="hover:text-white transition-colors">Careers</Link></li>
                <li><Link href="/discover" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="/settings" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>

            {/* Link Column: Resources */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-white uppercase tracking-wider">Resources</div>
              <ul className="space-y-2 text-xs text-[#9CA3AF]">
                <li><Link href="/admin" className="hover:text-white transition-colors">Docs</Link></li>
                <li><Link href="/api/calls" className="hover:text-white transition-colors">API Reference</Link></li>
                <li><Link href="/calls" className="hover:text-white transition-colors">Voice Cockpit</Link></li>
                <li><Link href="/admin" className="hover:text-white transition-colors">System Status</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-[#232B3D] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#9CA3AF]">
            <div>© 2026 Intentos, Inc. All rights reserved.</div>
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Security Audit</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
