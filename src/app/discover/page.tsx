'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Compass,
  Search,
  RefreshCw,
  ArrowRight,
  MapPin,
  Building2,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/shared/status-badge';
import { EmptyState } from '@/components/shared/empty-state';
import { TableLoadingSkeleton } from '@/components/shared/loading-skeleton';
import { OpportunityItem } from '@/types';
import { ImportCenter } from '@/components/discover/import-center';

export default function DiscoveryPage() {
  const [activeTab, setActiveTab] = useState<'ai' | 'import'>('ai');
  const [keyword, setKeyword] = useState('');
  const [source, setSource] = useState('ALL');
  const [industry, setIndustry] = useState('ALL');
  const [location, setLocation] = useState('ALL');
  const [results, setResults] = useState<OpportunityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  const fetchDiscoveryResults = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (keyword) params.set('search', keyword);
      if (source !== 'ALL') params.set('source', source);
      if (industry !== 'ALL') params.set('industry', industry);
      if (location !== 'ALL') params.set('location', location);
      params.set('limit', '50');

      const res = await fetch(`/api/opportunities?${params.toString()}`);
      const data = await res.json();
      setResults(data.items || []);
    } catch (e) {
      console.error('Failed to fetch discovery results:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscoveryResults();
  }, [source, industry, location]);

  const handleManualScan = async () => {
    try {
      setScanning(true);
      await fetch('/api/discover/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: source,
          source,
          keyword,
          industry,
          location,
        }),
      });
      await fetchDiscoveryResults();
    } catch (err) {
      console.error('Failed to trigger scan:', err);
    } finally {
      setScanning(false);
    }
  };

  const sources = [
    { key: 'ALL', label: 'All Public Channels' },
    { key: 'LINKEDIN', label: 'LinkedIn Executive RFPs' },
    { key: 'X', label: 'X / Twitter Signals' },
    { key: 'WEBSITE', label: 'Corporate RFP Portals' },
    { key: 'PUBLIC_DIRECTORY', label: 'Public Procurement Registers' },
    { key: 'FREELANCE_PLATFORM', label: 'Enterprise Contract Boards' },
  ];

  const industries = [
    'ALL',
    'Enterprise Cloud Services',
    'Financial Technology',
    'Healthcare & EHR',
    'Cybersecurity & IAM',
    'Smart Logistics & Supply Chain',
    'Industrial IoT & Manufacturing',
    'Clean Energy & Smart Grid',
    'E-Commerce & Retail AI',
  ];

  const locations = [
    'ALL',
    'Austin, TX',
    'San Francisco, CA',
    'Boston, MA',
    'Seattle, WA',
    'New York, NY',
    'Chicago, IL',
  ];

  return (
    <div className="space-y-6 pb-12 max-w-[1536px] w-full mx-auto" data-testid="discovery-page">
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

        <Button
          onClick={handleManualScan}
          disabled={scanning || activeTab !== 'ai'}
          size="sm"
          className="bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-xs font-semibold flex items-center gap-2 shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} />
          <span>{scanning ? 'Scanning Public Channels...' : 'Trigger Scan Now'}</span>
        </Button>
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
              {/* Keyword */}
              <div className="md:col-span-5">
                <label className="text-[11px] font-bold text-[#627D98] block mb-1">
                  Keyword
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-[#627D98] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <Input
                    type="text"
                    placeholder="e.g. SharePoint, Cloud Migration, Head of IT"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    className="pl-9 h-9 bg-white border-[#D9E2EC] text-[#102A43] text-xs placeholder:text-[#627D98] focus-visible:ring-[#2563EB] font-sans font-medium"
                  />
                </div>
              </div>

              {/* Public Channel */}
              <div className="md:col-span-3">
                <label className="text-[11px] font-bold text-[#627D98] block mb-1">
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
              <div className="md:col-span-2">
                <label className="text-[11px] font-bold text-[#627D98] block mb-1">
                  Target Industry
                </label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full h-9 bg-white border border-[#D9E2EC] rounded-md px-2.5 text-xs text-[#102A43] focus:outline-none focus:border-[#2563EB] font-sans font-medium"
                >
                  {industries.map((ind) => (
                    <option key={ind} value={ind}>
                      {ind === 'ALL' ? 'All Industries' : ind}
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Location */}
              <div className="md:col-span-2">
                <label className="text-[11px] font-bold text-[#627D98] block mb-1">
                  Target Location
                </label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full h-9 bg-white border border-[#D9E2EC] rounded-md px-2.5 text-xs text-[#102A43] focus:outline-none focus:border-[#2563EB] font-sans font-medium"
                >
                  {locations.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc === 'ALL' ? 'All Regions' : loc}
                    </option>
                  ))}
                </select>
              </div>
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
            <EmptyState
              title="No discovery signals matched your parameters"
              description="Adjust your keyword, channel, or industry filter to discover more leads."
              actionLabel="Reset to Default Discovery Scan"
              onAction={() => {
                setKeyword('');
                setSource('ALL');
                setIndustry('ALL');
                setLocation('ALL');
              }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.map((item) => {
                const req = item.requirements?.[0];

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
                        {item.linkedinUrl && (
                          <a
                            href={item.linkedinUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#2563EB] hover:underline flex items-center gap-0.5 text-[11px]"
                          >
                            LinkedIn <ExternalLink className="w-2.5 h-2.5" />
                          </a>
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
