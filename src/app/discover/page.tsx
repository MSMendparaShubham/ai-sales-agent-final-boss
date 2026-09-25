'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/shared/status-badge';
import { TableLoadingSkeleton } from '@/components/shared/loading-skeleton';
import { OpportunityItem } from '@/types';
import { ImportCenter } from '@/components/discover/import-center';

export default function DiscoveryPage() {
  const [activeTab, setActiveTab] = useState<'ai' | 'import'>('ai');
  const [keyword, setKeyword] = useState('');
  const [source, setSource] = useState('');
  const [industry, setIndustry] = useState('');
  const [location, setLocation] = useState('');
  const [results, setResults] = useState<OpportunityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
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

  useEffect(() => {
    fetchDiscoveryResults();
  }, [fetchDiscoveryResults, source, industry, location]);

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
      const res = await fetch('/api/discover/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: source,
          source: source,
          keyword: keyword || '',
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
            `Discovered ${count} prospective ${count === 1 ? 'lead' : 'leads'} successfully from ${
              source === 'ALL' ? 'public channels' : source
            }!`,
            'success'
          );
        } else {
          showToast(
            'No leads discovered matching your query. Try broadening your keywords.',
            'error'
          );
        }
        // Immediately reload table data with newly discovered leads
        await fetchDiscoveryResults();
      } else {
        const errMsg = data.error || 'Discovery scan failed to find candidates. Please refine your search keyword.';
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

  const canTriggerScan = Boolean(
    keyword && keyword.trim().length > 0 &&
    source && source !== '' && source !== 'ALL' &&
    industry && industry !== '' && industry !== 'ALL' && industry !== 'All Industries' &&
    location && location !== '' && location !== 'ALL' && location !== 'All Regions'
  );

  const keywordPresets = [
    'SharePoint Migration',
    'Microsoft 365 Setup',
    'Cloud Infrastructure & AWS',
    'Salesforce Implementation',
    'HubSpot CRM Consulting',
    'Cybersecurity & Compliance',
    'SOC 2 Audit Prep',
    'DevOps & Kubernetes',
    'ERP Modernization (SAP / Oracle)',
    'Generative AI & LLM Integration',
    'Data Engineering & Snowflake',
    'Custom Mobile App Development',
    'Enterprise UI/UX Redesign',
    'Full-Stack Web Development',
    'IT Managed Services & Support',
    'B2B SaaS Sales Outsourcing',
    'Staff Augmentation & Hiring',
    'QA & Automated Testing',
  ];

  const sources = [
    { key: 'LINKEDIN', label: 'LinkedIn Executive RFPs' },
    { key: 'X', label: 'X / Twitter Signals' },
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
            title={!canTriggerScan ? 'Please fill in all 4 search criteria to trigger scan.' : undefined}
            className={`text-xs font-semibold flex items-center gap-2 shadow-sm transition-all ${
              !canTriggerScan || isScanning || activeTab !== 'ai'
                ? 'bg-slate-200 text-slate-400 border border-slate-300 opacity-60 cursor-not-allowed hover:bg-slate-200'
                : 'bg-[#2563EB] hover:bg-[#1d4ed8] text-white'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Scanning Public Channels...' : 'Trigger Scan Now'}</span>
          </Button>
          {!canTriggerScan && activeTab === 'ai' && (
            <span className="text-[10px] text-[#627D98] font-medium">
              Please fill in all 4 search criteria to trigger scan.
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
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
              {/* Keyword & Presets Dropdown */}
              <div className="md:col-span-5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-[#627D98] flex items-center gap-1">
                    <span>Keyword *</span>
                  </label>
                  <span className="text-[10px] text-[#2563EB] font-semibold">Required</span>
                </div>
                <div className="space-y-1.5">
                  <div className="relative">
                    <Search className="w-4 h-4 text-[#627D98] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <Input
                      type="text"
                      placeholder="e.g. SharePoint Migration, Cloud Modernization"
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          fetchDiscoveryResults();
                        }
                      }}
                      className="pl-9 h-9 bg-white border-[#D9E2EC] text-[#102A43] text-xs placeholder:text-[#627D98] focus-visible:ring-[#2563EB] font-sans font-medium"
                    />
                    {keyword && (
                      <button
                        onClick={() => setKeyword('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                        title="Clear keyword"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Preset Dropdown */}
                  <select
                    value={keywordPresets.includes(keyword) ? keyword : ''}
                    onChange={(e) => {
                      if (e.target.value) {
                        setKeyword(e.target.value);
                        if (!source) setSource('LINKEDIN');
                        if (!industry) setIndustry('Information Technology & Services');
                        if (!location) setLocation('United States');
                      }
                    }}
                    className="w-full h-8 bg-slate-50 border border-[#D9E2EC] rounded-md px-2.5 text-[11px] text-[#102A43] focus:outline-none focus:border-[#2563EB] font-medium"
                  >
                    <option value="">⚡ Or Choose from 18 High-Intent B2B Presets...</option>
                    {keywordPresets.map((preset) => (
                      <option key={preset} value={preset}>
                        {preset}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Public Channel */}
              <div className="md:col-span-3 space-y-1.5">
                <label className="text-[11px] font-bold text-[#627D98] block">
                  Public Channel *
                </label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="w-full h-9 bg-white border border-[#D9E2EC] rounded-md px-2.5 text-xs text-[#102A43] focus:outline-none focus:border-[#2563EB] font-sans font-semibold"
                >
                  <option value="">Select Channel...</option>
                  {sources.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Industry */}
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-[11px] font-bold text-[#627D98] block">
                  Target Industry *
                </label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full h-9 bg-white border border-[#D9E2EC] rounded-md px-2.5 text-xs text-[#102A43] focus:outline-none focus:border-[#2563EB] font-sans font-medium"
                >
                  <option value="">Select Target Industry...</option>
                  {industries.map((ind) => (
                    <option key={ind} value={ind}>
                      {ind}
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Location */}
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-[11px] font-bold text-[#627D98] block">
                  Target Location *
                </label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full h-9 bg-white border border-[#D9E2EC] rounded-md px-2.5 text-xs text-[#102A43] focus:outline-none focus:border-[#2563EB] font-sans font-medium"
                >
                  <option value="">Select Target Location...</option>
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
                Top Presets:
              </span>
              {[
                'SharePoint Migration',
                'Microsoft 365 Setup',
                'Cloud Infrastructure & AWS',
                'Generative AI & LLM Integration',
                'DevOps & Kubernetes',
                'Cybersecurity & Compliance',
                'Salesforce Implementation',
                'SOC 2 Audit Prep',
                'Data Engineering & Snowflake',
              ].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    setKeyword(p);
                    if (!source) setSource('LINKEDIN');
                    if (!industry) setIndustry('Information Technology & Services');
                    if (!location) setLocation('United States');
                  }}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                    keyword === p
                      ? 'bg-[#2563EB] text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-[#102A43] border border-slate-200/60'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </Card>

          {/* Discovery Results Count Header */}
          <div className="flex items-center justify-between text-xs text-[#627D98] px-1 font-medium">
            <span>Found {results.length} discovered prospects matching criteria</span>
            <span className="text-[#0F9D9A] font-bold">Autonomous Ingestion Queue Active</span>
          </div>

          {/* Results Cards */}
          {loading ? (
            <TableLoadingSkeleton rows={5} />
          ) : results.length === 0 ? (
            <div className="bg-white border border-slate-200/80 rounded-xl p-8 sm:p-12 text-center space-y-4 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-[#2563EB] mx-auto flex items-center justify-center border border-blue-100">
                <Search className="w-6 h-6" />
              </div>
              <div className="max-w-md mx-auto space-y-1.5">
                <h3 className="text-base font-bold text-[#102A43]">No Leads Discovered</h3>
                <p className="text-xs text-[#627D98] leading-relaxed">
                  No public executive profiles matched your search keyword and filter criteria. Try broadening your keyword (e.g. use &ldquo;SharePoint&rdquo; instead of long queries) or adjusting the region filter.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2.5 pt-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setKeyword('');
                    setSource('');
                    setIndustry('');
                    setLocation('');
                  }}
                  className="text-xs font-semibold border-slate-200 bg-white hover:bg-slate-50 text-[#102A43]"
                >
                  Clear Filters
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setKeyword('SharePoint Migration');
                    setSource('LINKEDIN');
                    setIndustry('Information Technology & Services');
                    setLocation('United States');
                  }}
                  className="text-xs font-semibold bg-[#2563EB] hover:bg-[#1d4ed8] text-white"
                >
                  Try Popular Presets
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.map((item) => {
                const req = item.requirements?.[0];
                const cleanLinkedinUrl = item.linkedinUrl
                  ? item.linkedinUrl.startsWith('http')
                    ? item.linkedinUrl
                    : `https://${item.linkedinUrl}`
                  : null;

                return (
                  <Card
                    key={item.id}
                    className="p-5 glass-card-interactive border-slate-200/80 space-y-3 rounded-xl shadow-sm hover:border-blue-400/40"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            href={`/opportunities/${item.id}`}
                            className="font-bold text-sm text-[#102A43] hover:text-[#2563EB] transition-colors"
                          >
                            {item.company.name}
                          </Link>
                          <StatusBadge status={item.source?.platform || 'LINKEDIN'} type="source" />
                        </div>
                        <p className="text-xs text-[#627D98] mt-0.5 font-medium">
                          {item.name} &bull; {item.title} &bull; {item.company.industry}
                        </p>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <div className="text-[10px] text-[#627D98] uppercase font-bold flex items-center gap-1 justify-end">
                          <MapPin className="w-3 h-3 text-[#627D98]" />
                          <span>LOCATION</span>
                        </div>
                        <div className="text-xs font-semibold text-[#102A43]">
                          {item.company.location || 'San Francisco, CA'}
                        </div>
                      </div>
                    </div>

                    {/* Requirement or Profile Snippet */}
                    <div className="space-y-1 bg-slate-50/70 p-3 rounded-lg border border-slate-200/80 backdrop-blur-sm">
                      <h4 className="text-xs font-bold text-[#102A43]">{req?.title || 'Executive Opportunity'}</h4>
                      <p className="text-xs text-[#627D98] line-clamp-2 leading-relaxed font-medium">
                        &ldquo;{req?.rawEvidence || req?.description || item.salesBrief || 'Discovered profile matching criteria.'}&rdquo;
                      </p>
                    </div>

                    {/* Footer Meta & Actions */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/80 text-xs">
                      <div className="flex items-center gap-3 text-slate-500 font-medium">
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          {item.company.size || '50-200 employees'}
                        </span>
                        {cleanLinkedinUrl ? (
                          <a
                            href={cleanLinkedinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md border border-blue-200 transition-colors"
                          >
                            <span>View LinkedIn Profile</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
                            No LinkedIn Profile Linked
                          </span>
                        )}
                      </div>
                      <Link href={`/opportunities/${item.id}`}>
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
