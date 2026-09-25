'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Zap,
  Lock,
  Mail,
  User,
  Building2,
  Phone,
  ArrowRight,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  CheckCircle2,
  Briefcase,
  Target,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuthBrandingPanel } from '@/components/auth/AuthBrandingPanel';

const LOOKING_FOR_OPTIONS = [
  { value: 'leads_discovery', label: 'Find Leads / Prospects (AI Lead Discovery)' },
  { value: 'voice_outreach', label: 'AI Voice Calling / Outreach' },
  { value: 'both_leads_voice', label: 'Both Lead Discovery + AI Calling' },
  { value: 'market_intel', label: 'Market Intelligence & Competitor Insights' },
  { value: 'exploring', label: 'Just Exploring' },
];

export default function SignUpPage() {
  const router = useRouter();

  // Form fields
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [workEmail, setWorkEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [lookingFor, setLookingFor] = useState('');
  const [industryOffering, setIndustryOffering] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'microsoft' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Password strength calculator
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, text: '', color: 'bg-slate-700' };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 1) return { score: 1, text: 'Weak', color: 'bg-red-500' };
    if (score === 2 || score === 3) return { score: 2, text: 'Medium', color: 'bg-amber-500' };
    return { score: 3, text: 'Strong', color: 'bg-emerald-500' };
  };

  const passwordStrength = getPasswordStrength(password);

  const validateForm = () => {
    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return false;
    }
    if (!companyName.trim()) {
      setError('Please enter your business / company name.');
      return false;
    }
    if (!workEmail.trim()) {
      setError('Please enter your work email address.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(workEmail)) {
      setError('Please provide a valid work email format (e.g. name@company.com).');
      return false;
    }
    if (!phoneNumber.trim()) {
      setError('Please enter your phone number.');
      return false;
    }
    if (!password) {
      setError('Please create a password.');
      return false;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify both fields.');
      return false;
    }
    if (!lookingFor) {
      setError('Please select what you are looking for.');
      return false;
    }
    if (!industryOffering.trim()) {
      setError("Please describe your industry / what you offer (e.g., Marketing agency, SEO & paid ads).");
      return false;
    }
    if (!agreeTerms) {
      setError('You must agree to the Terms & Conditions and Privacy Policy to create an account.');
      return false;
    }

    return true;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!validateForm()) return;

    setLoading(true);

    try {
      // Simulate account provisioning
      await new Promise((resolve) => setTimeout(resolve, 900));

      setSuccessMsg('Account created successfully! Preparing your 14-day enterprise trial...');
      setTimeout(() => {
        router.push('/dashboard');
        router.refresh();
      }, 700);
    } catch {
      setError('An error occurred during account creation. Please try again.');
    } finally {
      setTimeout(() => setLoading(false), 900);
    }
  };

  const handleSocialAuth = async (provider: 'google' | 'microsoft') => {
    setSocialLoading(provider);
    setError(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      router.push('/dashboard');
      router.refresh();
    } catch {
      setError(`Unable to connect with ${provider === 'google' ? 'Google' : 'Microsoft'}. Please try again.`);
    } finally {
      setSocialLoading(null);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#0B0F1A] text-slate-100 font-sans antialiased selection:bg-amber-500/30 selection:text-white" data-testid="signup-page">
      {/* Left Branding Panel (Desktop) */}
      <AuthBrandingPanel mode="signup" />

      {/* Right Form Panel */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-10 lg:p-14 relative overflow-y-auto min-h-screen">
        {/* Ambient background glow */}
        <div className="absolute top-10 right-10 w-96 h-96 bg-amber-500/5 rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-blue-600/5 rounded-full blur-[120px] pointer-events-none" />

        {/* Top Navigation Bar */}
        <div className="flex items-center justify-between z-10 w-full mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors group"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform">&larr;</span> Back to Home
          </Link>

          {/* Quick Switch to Sign In */}
          <div className="text-xs text-slate-400 font-medium">
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-blue-400 hover:text-blue-300 font-semibold underline underline-offset-4 transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>

        {/* Form Container Card */}
        <div className="w-full max-w-[540px] mx-auto z-10 my-auto py-2">
          {/* Mobile Logo Header */}
          <div className="lg:hidden flex items-center gap-2.5 mb-5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-amber-500 flex items-center justify-center text-white shadow-md">
              <Zap className="w-4.5 h-4.5 fill-white" />
            </div>
            <div>
              <span className="font-bold text-lg text-white">INTENTOS</span>
              <span className="text-[10px] ml-2 text-amber-400 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded font-bold uppercase">
                AI Agent
              </span>
            </div>
          </div>

          {/* Title and Subtitle */}
          <div className="mb-6">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-[11px] font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3 h-3 text-amber-400" />
              14-Day Free Enterprise Trial • No CC Required
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Create your IntentOS account
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">
              Launch your autonomous sales team in minutes. 50 free AI call minutes included.
            </p>
          </div>

          {/* Social Sign Up Options */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            {/* Google */}
            <button
              type="button"
              onClick={() => handleSocialAuth('google')}
              disabled={socialLoading !== null || loading}
              className="py-2.5 px-3 bg-[#131B2E] hover:bg-[#1A253E] border border-slate-700/80 hover:border-slate-600 rounded-xl text-xs font-semibold text-slate-200 transition-all flex items-center justify-center gap-2.5 shadow-sm disabled:opacity-50 active:scale-[0.98]"
            >
              {socialLoading === 'google' ? (
                <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
              ) : (
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>Sign up with Google</span>
            </button>

            {/* Microsoft */}
            <button
              type="button"
              onClick={() => handleSocialAuth('microsoft')}
              disabled={socialLoading !== null || loading}
              className="py-2.5 px-3 bg-[#131B2E] hover:bg-[#1A253E] border border-slate-700/80 hover:border-slate-600 rounded-xl text-xs font-semibold text-slate-200 transition-all flex items-center justify-center gap-2.5 shadow-sm disabled:opacity-50 active:scale-[0.98]"
            >
              {socialLoading === 'microsoft' ? (
                <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
              ) : (
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 23 23">
                  <path fill="#f35325" d="M1 1h10v10H1z" />
                  <path fill="#81bc06" d="M12 1h10v10H12z" />
                  <path fill="#05a6f0" d="M1 12h10v10H1z" />
                  <path fill="#ffba08" d="M12 12h10v10H12z" />
                </svg>
              )}
              <span>Sign up with Microsoft</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-5">
            <div className="border-t border-slate-800 w-full" />
            <span className="bg-[#0B0F1A] px-3 text-[11px] text-slate-400 font-medium whitespace-nowrap uppercase tracking-wider">
              or register with work email
            </span>
            <div className="border-t border-slate-800 w-full" />
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3.5 rounded-xl bg-red-950/40 border border-red-500/30 flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs text-red-300 leading-relaxed">{error}</p>
            </div>
          )}

          {/* Success Notification */}
          {successMsg && (
            <div className="mb-4 p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-start gap-2.5 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-xs text-emerald-300 leading-relaxed">{successMsg}</p>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSignUp} className="space-y-4">
            {/* Row 1: Full Name & Business/Company Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Full Name <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <Input
                    type="text"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="Alex Morgan"
                    className="pl-10 bg-[#131B2E] border-slate-800 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-slate-100 placeholder:text-slate-600 text-xs sm:text-sm h-11 rounded-xl transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Business / Company Name <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <Input
                    type="text"
                    value={companyName}
                    onChange={(e) => {
                      setCompanyName(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="Acme Growth Inc."
                    className="pl-10 bg-[#131B2E] border-slate-800 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-slate-100 placeholder:text-slate-600 text-xs sm:text-sm h-11 rounded-xl transition-all"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Row 2: Work Email & Phone Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Work Email <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <Input
                    type="email"
                    value={workEmail}
                    onChange={(e) => {
                      setWorkEmail(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="alex@acmegrowth.com"
                    className="pl-10 bg-[#131B2E] border-slate-800 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-slate-100 placeholder:text-slate-600 text-xs sm:text-sm h-11 rounded-xl transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Phone Number <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <Input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => {
                      setPhoneNumber(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="+1 (555) 234-5678"
                    className="pl-10 bg-[#131B2E] border-slate-800 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-slate-100 placeholder:text-slate-600 text-xs sm:text-sm h-11 rounded-xl transition-all"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Row 3: Password & Confirm Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">
                    Password <span className="text-amber-400">*</span>
                  </label>
                  {password && (
                    <span className="text-[10px] font-semibold text-slate-400">
                      Strength: <span className={passwordStrength.score === 3 ? 'text-emerald-400' : passwordStrength.score === 2 ? 'text-amber-400' : 'text-red-400'}>{passwordStrength.text}</span>
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="Min 8 characters"
                    className="pl-10 pr-10 bg-[#131B2E] border-slate-800 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-slate-100 placeholder:text-slate-600 text-xs sm:text-sm h-11 rounded-xl transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Confirm Password <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="Re-enter password"
                    className="pl-10 pr-10 bg-[#131B2E] border-slate-800 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-slate-100 placeholder:text-slate-600 text-xs sm:text-sm h-11 rounded-xl transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Row 4: "What are you looking for?" (Required Dropdown) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-amber-400" />
                  What are you looking for? <span className="text-amber-400">*</span>
                </span>
                <span className="text-[10px] text-slate-500">Select primary goal</span>
              </label>
              <div className="relative">
                <select
                  value={lookingFor}
                  onChange={(e) => {
                    setLookingFor(e.target.value);
                    if (error) setError(null);
                  }}
                  className="w-full bg-[#131B2E] border border-slate-800 hover:border-slate-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-slate-100 text-xs sm:text-sm h-11 rounded-xl px-3.5 transition-all appearance-none cursor-pointer"
                  required
                >
                  <option value="" disabled className="text-slate-500 bg-[#0B0F1A]">
                    Select your primary objective...
                  </option>
                  {LOOKING_FOR_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-[#131B2E] text-slate-200 py-1">
                      {opt.label}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                  ▼
                </div>
              </div>
            </div>

            {/* Row 5: "What's your industry / what do you offer?" (Free text) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-blue-400" />
                  What&apos;s your industry / what do you offer? <span className="text-amber-400">*</span>
                </span>
              </label>
              <Input
                type="text"
                value={industryOffering}
                onChange={(e) => {
                  setIndustryOffering(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="e.g., Marketing agency, SEO & paid ads, B2B SaaS analytics"
                className="bg-[#131B2E] border-slate-800 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-slate-100 placeholder:text-slate-600 text-xs sm:text-sm h-11 rounded-xl transition-all"
                required
              />
            </div>

            {/* Terms & Conditions Checkbox */}
            <div className="pt-2">
              <label className="flex items-start gap-2.5 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => {
                    setAgreeTerms(e.target.checked);
                    if (error) setError(null);
                  }}
                  className="w-4 h-4 mt-0.5 rounded border-slate-700 bg-[#131B2E] text-amber-500 focus:ring-amber-500 focus:ring-offset-0 transition-colors cursor-pointer accent-amber-500 shrink-0"
                  required
                />
                <span className="text-xs text-slate-400 group-hover:text-slate-300 leading-relaxed transition-colors">
                  I agree to the{' '}
                  <Link href="#" className="text-slate-300 underline hover:text-white">
                    Terms &amp; Conditions
                  </Link>{' '}
                  and{' '}
                  <Link href="#" className="text-slate-300 underline hover:text-white">
                    Privacy Policy
                  </Link>
                  .
                </span>
              </label>
            </div>

            {/* Submit CTA Button */}
            <Button
              type="submit"
              disabled={loading || socialLoading !== null}
              className="w-full text-xs sm:text-sm font-bold bg-gradient-to-r from-[#E8590C] via-[#F59E0B] to-[#D9480F] hover:opacity-95 text-white h-11 rounded-xl flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(232,89,12,0.35)] transition-all active:scale-[0.99] mt-4"
            >
              <span>{loading ? 'Creating workspace...' : 'Start Free Trial'}</span>
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              )}
            </Button>
          </form>

          {/* Switch to Sign In CTA */}
          <div className="mt-6 pt-5 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-400">
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-bold text-blue-400 hover:text-blue-300 underline underline-offset-4 ml-1 transition-colors"
              >
                Sign in here &rarr;
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-[11px] text-slate-500 py-2 z-10">
          No credit card required • Instant access to 50 AI minutes • Cancel anytime
        </div>
      </div>
    </div>
  );
}
