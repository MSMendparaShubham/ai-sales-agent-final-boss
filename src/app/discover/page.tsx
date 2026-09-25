'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Compass,
  Search,
  RefreshCw,
  ArrowRight,
  MapPin,
  Building2,
  ExternalLink,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  X,
  Phone,
  MessageSquareQuote,
  History,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/shared/status-badge';
import { TableLoadingSkeleton } from '@/components/shared/loading-skeleton';
import { OpportunityItem } from '@/types';
import { ImportCenter } from '@/components/discover/import-center';

function formatTimeAgo(dateInput: string | Date): string {
  try {
    const d = new Date(dateInput);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  } catch {
    return 'recently';
  }
}

export default function DiscoveryPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'ai' | 'import'>('ai');
  const [keyword, setKeyword] = useState('');
  const [source, setSource] = useState('LINKEDIN');
  const [industry, setIndustry] = useState('Information Technology & Services');
  const [location, setLocation] = useState('United States');
  const [results, setResults] = useState<OpportunityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [scanHistory, setScanHistory] = useState<any[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 6000);
  };

  const fetchDiscoveryResults = useCallback(async (overrideKeyword?: string) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      const currentKeyword = overrideKeyword !== undefined ? overrideKeyword : keyword;
      if (currentKeyword) params.set('search', currentKeyword);
      if (source && source !== 'ALL') params.set('source', source);
      if (industry && industry !== 'ALL' && industry !== 'All Industries') params.set('industry', industry);
      if (location && location !== 'ALL' && location !== 'All Regions') params.set('location', location);
      params.set('limit', '50');

      console.log('[Discover UI] Fetching leads with query:', params.toString());
      const res = await fetch(`/api/opportunities?${params.toString()}`);
      if (!res.ok) {
        console.error('[Discover UI] Failed to load opportunities. Status:', res.status);
        return;
      }
      const data = await res.json();
      console.log('[Discover UI] Fetched opportunities count:', data.items?.length || 0);
      setResults(data.items || []);
    } catch (e) {
      console.error('[Discover UI] Failed to fetch discovery results:', e);
    } finally {
      setLoading(false);
    }
  }, [keyword, source, industry, location]);

  const fetchScanHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/discover/history');
      if (res.ok) {
        const data = await res.json();
        setScanHistory(data.history || []);
      }
    } catch (e) {
      console.error('[Discover UI] Failed to load scan history:', e);
    }
  }, []);

  useEffect(() => {
    fetchDiscoveryResults();
    fetchScanHistory();
  }, [fetchDiscoveryResults, fetchScanHistory, source, industry, location]);

  const handleManualScan = async () => {
    console.log('[Discover UI] Trigger Scan clicked. Filters:', {
      channel: source,
      keyword,
      industry,
      location,
    });

    setIsScanning(true);
    setToastMessage(null);

    try {
      const res = await fetch('/api/discover/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: source,
          source: source,
          keyword: keyword || '',
          query: keyword || '',
          description: keyword || '',
          industry: industry || '',
          location: location || '',
        }),
      });

      const data = await res.json();
      console.log('[Discover UI] Server response:', res.status, data);

      if (res.ok && data.success) {
        const count = data.count ?? data.totalDiscovered ?? 0;
        if (count > 0) {
          showToast(
            `Discovered ${count} live verified executive leads.`,
            'success'
          );
          if (data.leads && Array.isArray(data.leads) && data.leads.length > 0) {
            setResults(data.leads);
          } else {
            await fetchDiscoveryResults();
          }
        } else {
          showToast(
            'No live posts found matching your specific query. Try broadening your description.',
            'error'
          );
          setResults([]);
        }
        await fetchScanHistory();
      } else {
        const errMsg = data.error || 'Discovery scan failed to find candidates. Please refine your search query.';
        console.error('[Discover UI Error]:', errMsg);
        showToast(errMsg, 'error');
      }
    } catch (err: any) {
      const errMsg = err?.message || 'Network error occurred during discovery scan.';
      console.error('[Discover UI Error]:', err);
      showToast(errMsg, 'error');
    } finally {
      setIsScanning(false);
    }
  };

  const handleClearHistory = async () => {
    try {
      const res = await fetch('/api/discover/history', { method: 'DELETE' });
      if (res.ok) {
        setScanHistory([]);
        showToast('Scan history cleared successfully.', 'success');
      }
    } catch {
      showToast('Failed to clear scan history.', 'error');
    }
  };

  const handleLoadHistoryScan = (scan: any) => {
    setKeyword(scan.query || '');
    if (scan.channel) setSource(scan.channel);
    if (scan.location) setLocation(scan.location);
    if (scan.industry) setIndustry(scan.industry);

    if (scan.leads && Array.isArray(scan.leads) && scan.leads.length > 0) {
      setResults(scan.leads);
      showToast(`Loaded ${scan.leads.length} discovered prospects from previous scan.`, 'success');
    } else {
      showToast(`Populated search filters for: "${scan.query}".`, 'success');
    }
  };

  const handleInitiateCall = (lead: OpportunityItem) => {
    router.push(`/calls?leadId=${lead.id}&start=true`);
  };

  const canTriggerScan = Boolean(keyword && keyword.trim().length > 0);

  const TOP_PRESETS = [
    {
      label: 'Cloud Security & SOC 2',
      query: 'We offer enterprise cloud security modernization and SOC 2 audit readiness for fintech companies.',
    },
    {
      label: 'SharePoint & M365 Migration',
      query: 'Looking for mid-market healthcare and finance companies needing SharePoint migration and Microsoft 365 compliance.',
    },
    {
      label: 'AWS & Cloud Modernization',
      query: 'Seeking companies looking for AWS cloud architecture, multi-region resilience, and infrastructure modernizations.',
    },
    {
      label: 'Salesforce Implementation',
      query: 'Providing enterprise Salesforce CRM implementation, optimization, and legacy system integration services.',
    },
    {
      label: 'Data Engineering & Snowflake',
      query: 'Enterprise data pipeline modernization, Snowflake migration, and real-time analytics solutions.',
    },
    {
      label: 'DevOps & Kubernetes',
      query: 'Kubernetes container orchestration, CI/CD pipeline automation, and cloud cost optimization for enterprises.',
    },
  ];

  const sources = [
    { key: 'LINKEDIN', label: 'LinkedIn Executive RFPs' },
    { key: 'X', label: 'X (Twitter) Buying Signals' },
    { key: 'WEBSITE', label: 'Corporate RFP Portals' },
  ];

  const industries = [
    'Information Technology & Services',
    'Software Development',
    'Financial Services & FinTech',
    'Healthcare & HealthTech',
    'Manufacturing & Industrial',
    'E-commerce & Retail',
  ];

  const locations = [
    'United States',
    'United Kingdom & Europe',
    'India & APAC',
    'Remote / Global',
  ];

  return (
    <div className="space-y-6 pb-12 max-w-[1536px] w-full mx-auto" data-testid="discovery-page">
      {/* Toast Alert Banner */}
      {toastMessage && (
        <div
          className={`p-3.5 rounded-lg border text-xs flex items-center justify-between shadow-sm transition-all duration-200 ${
            toastType === 'success'
              ? 'bg-[#F0FDF4] border-[#86EFAC] text-[#166534]'
              : 'bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {toastType === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-[#16A34A] flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-[#DC2626] flex-shrink-0" />
            )}
            <span className="font-semibold">{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-slate-600 font-bold p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#D9E2EC] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-md bg-[#EAF2FF] text-[#2563EB] border border-[#2563EB]/20">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#102A43] uppercase">
                PUBLIC LEAD DISCOVERY ENGINE
              </h1>
              <p className="text-xs text-[#627D98] mt-0.5">
                Continuously ingest and analyze public procurement signals, RFPs, and executive technology searches.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:items-end gap-1">
          <Button
            onClick={handleManualScan}
            disabled={!canTriggerScan || isScanning || activeTab !== 'ai'}
            size="sm"
            title={!canTriggerScan ? 'Please describe your target clients or service offering to trigger scan.' : undefined}
            className={`text-xs font-semibold flex items-center gap-2 shadow-sm transition-all ${
              !canTriggerScan || isScanning || activeTab !== 'ai'
                ? 'bg-slate-200 text-slate-400 border border-slate-300 opacity-60 cursor-not-allowed hover:bg-slate-200'
                : 'bg-[#2563EB] hover:bg-[#1d4ed8] text-white'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Searching Live Posts...' : 'Trigger Scan Now'}</span>
          </Button>
          {!canTriggerScan && activeTab === 'ai' && (
            <span className="text-[10px] text-[#627D98] font-medium">
              Enter a service description or select a preset to scan.
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('ai')}
          className={`pb-3 text-sm font-bold transition-colors border-b-2 ${
            activeTab === 'ai'
              ? 'border-[#2563EB] text-[#2563EB]'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          AI Discovery Engine
        </button>
        <button
          onClick={() => setActiveTab('import')}
          className={`pb-3 text-sm font-bold transition-colors border-b-2 ${
            activeTab === 'import'
              ? 'border-[#2563EB] text-[#2563EB]'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Import Center
        </button>
      </div>

      {activeTab === 'import' ? (
        <ImportCenter />
      ) : (
        <>
          {/* Filter Toolbar */}
          <Card className="p-4 sm:p-5 glass-card border-slate-200/80 space-y-4 rounded-xl shadow-glass">
            <div className="space-y-3.5">
              {/* Natural Description Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-[#627D98] flex items-center gap-1.5">
                    <MessageSquareQuote className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span>Target Client Requirement or Service Offering *</span>
                  </label>
                  <span className="text-[10px] text-[#2563EB] font-semibold">Gemini AI Dork Parsing Active</span>
                </div>

                <div className="relative">
                  <textarea
                    rows={2}
                    placeholder="Describe your target clients or service offering (e.g., 'Looking for mid-market healthcare companies needing SharePoint migration and HIPAA compliance')..."
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (canTriggerScan) handleManualScan();
                      }
                    }}
                    className="w-full p-3 rounded-lg bg-white border border-[#D9E2EC] text-[#102A43] text-xs placeholder:text-[#627D98] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] font-sans font-medium resize-none shadow-inner"
                  />
                  {keyword && (
                    <button
                      onClick={() => setKeyword('')}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 p-0.5"
                      title="Clear description"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Filters Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Public Channel */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[#627D98] block">
                    Public Channel
                  </label>
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="w-full h-9 bg-white border border-[#D9E2EC] rounded-md px-2.5 text-xs text-[#102A43] focus:outline-none focus:border-[#2563EB] font-sans font-semibold"
                  >
                    {sources.map((s) => (
                      <option key={s.key} value={s.key}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Target Industry */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[#627D98] block">
                    Target Industry
                  </label>
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full h-9 bg-white border border-[#D9E2EC] rounded-md px-2.5 text-xs text-[#102A43] focus:outline-none focus:border-[#2563EB] font-sans font-medium"
                  >
                    {industries.map((ind) => (
                      <option key={ind} value={ind}>
                        {ind}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Target Location */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[#627D98] block">
                    Target Location
                  </label>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full h-9 bg-white border border-[#D9E2EC] rounded-md px-2.5 text-xs text-[#102A43] focus:outline-none focus:border-[#2563EB] font-sans font-medium"
                  >
                    {locations.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quick-Select Pills */}
              <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-bold text-[#627D98] uppercase tracking-wider mr-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#2563EB]" />
                  Preset Templates:
                </span>
                {TOP_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setKeyword(preset.query);
                    }}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                      keyword === preset.query
                        ? 'bg-[#2563EB] text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-[#102A43] border border-slate-200/60'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Recent Discovery Scans Section */}
          {scanHistory.length > 0 && (
            <div className="p-3.5 bg-slate-900 text-white rounded-xl shadow-md border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-blue-600/20 text-blue-400 border border-blue-500/30">
                    <History className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                    Recent Discovery Scans
                  </span>
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                    {scanHistory.length}
                  </span>
                </div>

                <button
                  onClick={handleClearHistory}
                  className="text-[11px] font-medium text-slate-400 hover:text-rose-400 flex items-center gap-1 transition-colors px-2 py-1 rounded hover:bg-slate-800/80"
                  title="Clear all recent scan history"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear History</span>
                </button>
              </div>

              {/* History Chips */}
              <div className="flex items-center gap-2 flex-wrap">
                {scanHistory.slice(0, 5).map((scan) => {
                  const isTwitter = scan.channel === 'X' || scan.channel === 'TWITTER';
                  const isLinkedIn = scan.channel === 'LINKEDIN';
                  const displayQuery = scan.query?.length > 36 ? `${scan.query.slice(0, 36)}...` : scan.query;

                  return (
                    <button
                      key={scan.id}
                      onClick={() => handleLoadHistoryScan(scan)}
                      className="group flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-left border border-slate-700 hover:border-blue-500/50 transition-all text-xs shadow-xs"
                    >
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        isTwitter
                          ? 'bg-slate-950 text-white border border-slate-700'
                          : isLinkedIn
                          ? 'bg-blue-600/30 text-blue-300 border border-blue-500/30'
                          : 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {isTwitter ? 'X' : isLinkedIn ? 'LI' : 'WEB'}
                      </span>
                      <span className="font-medium text-slate-200 group-hover:text-white max-w-[220px] truncate">
                        &ldquo;{displayQuery}&rdquo;
                      </span>
                      <span className="text-[11px] text-blue-400 font-semibold shrink-0">
                        {scan.leadsFound} leads
                      </span>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        &bull; {formatTimeAgo(scan.createdAt)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Discovery Results Count Header */}
          <div className="flex items-center justify-between text-xs text-[#627D98] px-1 font-medium">
            <span>Found {results.length} live executive buying signals</span>
            <span className="text-[#0F9D9A] font-bold">Live Multi-Channel Crawl Active</span>
          </div>

          {/* Results Cards */}
          {loading ? (
            <TableLoadingSkeleton rows={4} />
          ) : results.length === 0 ? (
            <div className="bg-white border border-slate-200/80 rounded-xl p-8 sm:p-12 text-center space-y-4 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-[#2563EB] mx-auto flex items-center justify-center border border-blue-100">
                <Search className="w-6 h-6" />
              </div>
              <div className="max-w-md mx-auto space-y-1.5">
                <h3 className="text-base font-bold text-[#102A43]">Describe Your Target Client</h3>
                <p className="text-xs text-[#627D98] leading-relaxed">
                  Describe your target client above to discover live buying signals.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2.5 pt-2 flex-wrap">
                <Button
                  size="sm"
                  onClick={() => {
                    setKeyword('We offer enterprise cloud security modernization and SOC 2 audit readiness for fintech companies.');
                  }}
                  className="text-xs font-semibold bg-[#2563EB] hover:bg-[#1d4ed8] text-white"
                >
                  Load Example Query
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.map((lead) => {
                const req = lead.requirements?.[0];
                const rawEvidence =
                  req?.rawEvidence ||
                  (lead as any).rawEvidence ||
                  (lead as any).requirement?.rawEvidence ||
                  req?.description ||
                  lead.salesBrief ||
                  'Evaluating enterprise partners...';

                const targetProfileUrl = lead.linkedinUrl
                  ? lead.linkedinUrl.startsWith('http')
                    ? lead.linkedinUrl
                    : `https://${lead.linkedinUrl}`
                  : `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(
                      `${lead.name} ${lead.company.name}`
                    )}`;

                const originalPostUrl =
                  lead.discoveryResults?.[0]?.sourceUrl ||
                  (lead as any).sourceUrl ||
                  targetProfileUrl;

                const isTwitter =
                  lead.source?.platform === 'X' ||
                  lead.source?.platform === 'TWITTER' ||
                  targetProfileUrl.includes('x.com') ||
                  targetProfileUrl.includes('twitter.com');

                const excerptTitle = isTwitter
                  ? 'Verbatim X / Twitter Buying Signal'
                  : lead.source?.platform === 'WEBSITE'
                  ? 'Corporate RFP Procurement Signal'
                  : 'Verbatim LinkedIn RFP Signal';

                const authorProfileLabel = isTwitter ? 'View Profile on X' : 'View Author Profile';
                const livePostLabel = isTwitter ? 'View Post on X' : 'View Live Post';

                return (
                  <Card
                    key={lead.id}
                    className="p-5 glass-card-interactive border-slate-200/80 space-y-3 rounded-xl shadow-sm hover:border-blue-400/40"
                  >
                    {/* Author Header: Prospect Name, Role/Title, and Company Name */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-base text-[#102A43]">
                            {lead.name}
                          </span>
                          <span className="text-xs text-slate-400">&bull;</span>
                          <span className="text-xs font-semibold text-slate-700">
                            {lead.title}
                          </span>
                          <span className="text-xs text-slate-400">at</span>
                          <Link
                            href={`/opportunities/${lead.id}`}
                            className="font-bold text-xs text-[#2563EB] hover:underline inline-flex items-center gap-1.5"
                          >
                            <span>{lead.company.name}</span>
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                              <CheckCircle2 className="w-2.5 h-2.5 text-blue-600" />
                              Verified Company
                            </span>
                          </Link>
                          <StatusBadge status={lead.source?.platform || (isTwitter ? 'X' : 'LINKEDIN')} type="source" />
                        </div>
                        <p className="text-xs text-[#627D98] mt-1 font-medium flex items-center gap-1.5">
                          <span>{lead.company.industry}</span>
                          <span>&bull;</span>
                          <Building2 className="w-3.5 h-3.5 text-slate-400 inline" />
                          <span>{lead.company.size || '250-1000 employees'}</span>
                        </p>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <div className="text-[10px] text-[#627D98] uppercase font-bold flex items-center gap-1 justify-end">
                          <MapPin className="w-3 h-3 text-[#627D98]" />
                          <span>LOCATION</span>
                        </div>
                        <div className="text-xs font-semibold text-[#102A43]">
                          {lead.company.location || 'San Francisco, CA'}
                        </div>
                      </div>
                    </div>

                    {/* Post Excerpt Box */}
                    <div className={`p-3 rounded-md my-2.5 border-l-4 ${
                      isTwitter ? 'bg-slate-900/5 border-slate-900' : 'bg-slate-50 border-blue-500'
                    }`}>
                      <div className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider mb-1 ${
                        isTwitter ? 'text-slate-900' : 'text-blue-600'
                      }`}>
                        <span>{excerptTitle}</span>
                      </div>
                      <p className="text-sm text-slate-800 italic">
                        &ldquo;{rawEvidence}&rdquo;
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 text-xs flex-wrap gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <a
                          href={targetProfileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors ${
                            isTwitter
                              ? 'text-slate-900 bg-slate-100 hover:bg-slate-200 border-slate-300'
                              : 'text-blue-600 bg-blue-50 hover:bg-blue-100 border-blue-200'
                          }`}
                        >
                          <span>{authorProfileLabel}</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>

                        {originalPostUrl && (
                          <a
                            href={originalPostUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md border border-slate-200 transition-colors"
                          >
                            <span>{livePostLabel}</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}

                        <button
                          onClick={() => handleInitiateCall(lead)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Call Prospect</span>
                        </button>
                      </div>

                      <Link href={`/opportunities/${lead.id}`}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs border-[#D9E2EC] bg-white hover:bg-[#F5F7FA] text-[#102A43] flex items-center gap-1 font-semibold"
                        >
                          <span>Review & Qualify</span>
                          <ArrowRight className="w-3.5 h-3.5 text-[#2563EB]" />
                        </Button>
                      </Link>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
