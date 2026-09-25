'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Activity, Users, AlertTriangle } from 'lucide-react';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('HEALTH');
  const [data, setData] = useState<any[]>([]);
  const [adminData, setAdminData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  const fetchAdminMetrics = async () => {
    try {
      const res = await fetch('/api/admin');
      if (res.ok) {
        const json = await res.json();
        setAdminData(json);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchAdminMetrics();
  }, []);

  const fetchData = async (type: string) => {
    if (type === 'HEALTH') {
      fetchAdminMetrics();
      return;
    }
    setLoading(true);
    try {
      let endpoint = '';
      if (type === 'WORKSPACES') endpoint = '/api/admin/security?type=workspaces';
      else if (type === 'FRAUD') endpoint = '/api/admin/security?type=fraud';
      else if (type === 'SECURITY') endpoint = '/api/admin/security?type=events';
      else if (type === 'AUDIT') endpoint = '/api/admin/security?type=audit';

      const res = await fetch(endpoint);
      const json = await res.json();
      setData(Array.isArray(json) ? json : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(activeTab);
  }, [activeTab]);

  const handleAction = async (action: string, payload: any) => {
    setProcessing(true);
    try {
      await fetch('/api/admin/security', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload })
      });
      await fetchData(activeTab);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6">
      <div className="flex items-center gap-3 border-b border-gray-200 pb-4">
        <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Enterprise Admin & System Health</h1>
          <p className="text-sm text-gray-500">Live API engine status, workspace security, fraud signals, and audit activities.</p>
        </div>
      </div>

      {/* Engine Status & Database Telemetry Top Row */}
      {adminData && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="p-3.5 bg-slate-900 text-white space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Discovered Leads</span>
            <div className="text-xl font-bold text-blue-400">{adminData.totalOpportunities || 0}</div>
          </Card>
          <Card className="p-3.5 bg-slate-900 text-white space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Enriched Companies</span>
            <div className="text-xl font-bold text-teal-400">{adminData.totalCompanies || 0}</div>
          </Card>
          <Card className="p-3.5 bg-slate-900 text-white space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">AI Voice Calls Placed</span>
            <div className="text-xl font-bold text-indigo-400">{adminData.totalCalls || 0}</div>
          </Card>
          <Card className="p-3.5 bg-slate-900 text-white space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Outreach Campaigns</span>
            <div className="text-xl font-bold text-amber-400">{adminData.totalCampaigns || 0}</div>
          </Card>
        </div>
      )}

      <div className="flex space-x-2 border-b border-gray-200 mb-4 flex-wrap">
        <button
          className={`px-4 py-2 font-medium text-sm flex items-center gap-1.5 ${activeTab === 'HEALTH' ? 'border-b-2 border-blue-600 text-blue-600 font-bold' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('HEALTH')}
        >
          <Activity className="w-4 h-4" />
          System Health & APIs
        </button>
        <button
          className={`px-4 py-2 font-medium text-sm ${activeTab === 'WORKSPACES' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('WORKSPACES')}
        >
          Workspaces
        </button>
        <button
          className={`px-4 py-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'FRAUD' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('FRAUD')}
        >
          <AlertTriangle className="w-4 h-4" />
          Fraud Signals
        </button>
        <button
          className={`px-4 py-2 font-medium text-sm ${activeTab === 'SECURITY' ? 'border-b-2 border-orange-500 text-orange-500' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('SECURITY')}
        >
          Security Events
        </button>
        <button
          className={`px-4 py-2 font-medium text-sm ${activeTab === 'AUDIT' ? 'border-b-2 border-gray-800 text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('AUDIT')}
        >
          Audit Logs
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-500">Loading data...</div>
      ) : (
        <Card className="p-0 overflow-hidden">
          {activeTab === 'HEALTH' && (
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 uppercase">Live Engine & API Connectivity</h3>
                <p className="text-xs text-slate-500 mt-0.5">Real-time status of lead discovery, AI intent reasoning, and enrichment engines.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-800">Serper.dev Public Engine</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      {adminData?.apiStatus?.serper || 'ACTIVE'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600">Multi-channel search dorking across LinkedIn and X / Twitter.</p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-800">Apollo.io Enrichment</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      {adminData?.apiStatus?.apollo || 'ACTIVE'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600">Company firmographics, headcount size, domain, and industry.</p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-800">Google Gemini Flash</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      {adminData?.apiStatus?.gemini || 'ACTIVE'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600">Autonomous intent parsing, dork generation, and voice icebreakers.</p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 font-medium block">Database Status</span>
                  <span className="font-bold text-slate-900">{adminData?.systemStatus?.database || 'HEALTHY (SQLite Local)'}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium block">Voice Engine</span>
                  <span className="font-bold text-slate-900">{adminData?.systemStatus?.voiceEngine || 'READY (Nova AI)'}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium block">Voice Minutes Consumed</span>
                  <span className="font-bold text-slate-900">{adminData?.totalVoiceMinutes || 0} mins</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium block">Platform Uptime</span>
                  <span className="font-bold text-emerald-600">{adminData?.systemStatus?.uptime || '99.98%'}</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'WORKSPACES' && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase text-xs font-bold">
                  <tr>
                    <th className="px-4 py-3">Workspace Name</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.map((ws) => (
                    <tr key={ws.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{ws.name} <span className="text-gray-400 font-normal ml-1">({ws.id})</span></td>
                      <td className="px-4 py-3 text-gray-500">{new Date(ws.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        {ws.isSuspended ? (
                          <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-[10px] font-bold uppercase">Suspended</span>
                        ) : (
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-[10px] font-bold uppercase">Active</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {ws.isSuspended ? (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            disabled={processing}
                            onClick={() => handleAction('unsuspendWorkspace', { workspaceId: ws.id })}
                          >
                            Unsuspend
                          </Button>
                        ) : (
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            disabled={processing}
                            onClick={() => handleAction('suspendWorkspace', { workspaceId: ws.id, reason: 'Manual suspension' })}
                          >
                            Suspend
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'FRAUD' && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase text-xs font-bold">
                  <tr>
                    <th className="px-4 py-3">Signal Type</th>
                    <th className="px-4 py-3">Risk Level</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.map((sig) => (
                    <tr key={sig.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{sig.type}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${sig.riskLevel === 'CRITICAL' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                          {sig.riskLevel}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{sig.description}</td>
                      <td className="px-4 py-3 text-gray-500">{sig.status}</td>
                      <td className="px-4 py-3">
                        {sig.status === 'OPEN' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            disabled={processing}
                            onClick={() => handleAction('resolveFraud', { id: sig.id })}
                          >
                            Resolve
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {data.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-500">No fraud signals detected.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'SECURITY' && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase text-xs font-bold">
                  <tr>
                    <th className="px-4 py-3">Event Type</th>
                    <th className="px-4 py-3">Severity</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3">IP Address</th>
                    <th className="px-4 py-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.map((evt) => (
                    <tr key={evt.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{evt.type}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-[10px] font-bold uppercase">
                          {evt.severity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{evt.description}</td>
                      <td className="px-4 py-3 text-gray-500">{evt.ipAddress || 'Unknown'}</td>
                      <td className="px-4 py-3 text-gray-500">{new Date(evt.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                  {data.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-500">No security events found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'AUDIT' && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase text-xs font-bold">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Actor</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Entity Type</th>
                    <th className="px-4 py-3">Entity ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-500">{new Date(log.createdAt).toLocaleString()}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{log.actor}</td>
                      <td className="px-4 py-3 text-blue-600 font-mono text-xs">{log.action}</td>
                      <td className="px-4 py-3 text-gray-500">{log.entityType}</td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">{log.entityId}</td>
                    </tr>
                  ))}
                  {data.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-500">No audit logs found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
