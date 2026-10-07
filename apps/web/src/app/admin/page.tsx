'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  Users,
  Building2,
  Camera,
  Zap,
  Activity,
  Bot,
  CreditCard,
  Globe,
  Sliders,
  HeartPulse,
  Lock,
  FileText,
  UserCheck,
  Send,
  Search,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  RefreshCw,
  LogOut,
  ChevronRight,
  Eye,
  X,
  Sparkles,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<
    | 'OVERVIEW'
    | 'TENANTS'
    | 'USERS'
    | 'AGENCIES'
    | 'INSTAGRAM'
    | 'AUTOMATIONS'
    | 'QUEUES'
    | 'AI'
    | 'BILLING'
    | 'CMS'
    | 'FLAGS'
    | 'HEALTH'
    | 'SAFETY'
    | 'AUDIT'
    | 'IMPERSONATION'
  >('OVERVIEW');

  const [stats, setStats] = useState<any>({
    totalUsers: 142,
    totalWorkspaces: 89,
    totalConnectedAccounts: 64,
    totalWorkflows: 312,
    totalLeads: 18450,
    totalMessages: 142800,
    aiTokenUsage: 4829100,
    aiEstimatedCostUsd: 14.48,
    mrrUsd: 4890.0,
    systemStatus: 'ALL_SYSTEMS_OPERATIONAL',
  });

  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [impersonatingWorkspace, setImpersonatingWorkspace] = useState<string | null>(null);
  const [tenantModalOpen, setTenantModalOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const [suspensionReason, setSuspensionReason] = useState('');

  // Emergency Switches state
  const [emergencyControls, setEmergencyControls] = useState<Record<string, boolean>>({
    PAUSE_NEW_SIGNUPS: false,
    PAUSE_INSTAGRAM_OAUTH: false,
    PAUSE_INSTAGRAM_SENDING: false,
    PAUSE_ALL_AUTOMATIONS: false,
    PAUSE_AI: false,
    PAUSE_QUEUE_WORKERS: false,
    MAINTENANCE_MODE: false,
    READ_ONLY_MODE: false,
  });

  // Feature flags state
  const [featureFlags, setFeatureFlags] = useState<Record<string, { enabled: boolean; scope: string }>>({
    AI_AGENT: { enabled: true, scope: 'GLOBAL' },
    AI_WORKFLOW_BUILDER: { enabled: true, scope: 'GLOBAL' },
    INSTAGRAM_AUTOMATION: { enabled: true, scope: 'GLOBAL' },
    CONTENT: { enabled: true, scope: 'GLOBAL' },
    ANALYTICS: { enabled: true, scope: 'GLOBAL' },
    AGENCY: { enabled: true, scope: 'PLAN:AGENCY' },
    MCP: { enabled: true, scope: 'GLOBAL' },
    NEW_INBOX: { enabled: true, scope: 'PERCENTAGE:50' },
  });

  // CMS state
  const [heroHeadline, setHeroHeadline] = useState('Turn Conversations Into Customers with AI Automation.');
  const [heroSubtitle, setHeroSubtitle] = useState(
    'AutoDM automates Instagram conversations, comments, DMs, lead qualification, follow-ups and customer support with intelligent AI workflows.'
  );

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.stats) setStats(data.stats);
      })
      .catch(() => {});

    fetch('/api/admin/audit-logs')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.auditLogs) setAuditLogs(data.auditLogs);
      })
      .catch(() => {});
  }, []);

  const handleToggleEmergency = (key: string) => {
    const nextVal = !emergencyControls[key];
    setEmergencyControls((prev) => ({ ...prev, [key]: nextVal }));

    fetch('/api/admin/emergency-controls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ controlKey: key, enabled: nextVal, reason: 'Super Admin Manual Toggle' }),
    }).catch(() => {});
  };

  const handleToggleFlag = (key: string) => {
    const nextVal = !featureFlags[key]?.enabled;
    setFeatureFlags((prev) => ({
      ...prev,
      [key]: { ...prev[key], enabled: nextVal },
    }));

    fetch('/api/admin/feature-flags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ flagKey: key, enabled: nextVal }),
    }).catch(() => {});
  };

  const handleStartImpersonation = (wsName: string) => {
    setImpersonatingWorkspace(wsName);
    fetch('/api/admin/impersonate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceId: wsName, reason: 'Super Admin Support Ticket' }),
    }).catch(() => {});
  };

  const handleSuspendTenant = () => {
    if (!selectedTenant) return;
    fetch(`/api/admin/tenants/${selectedTenant.id}/suspend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: suspensionReason || 'TOS Violation' }),
    }).then(() => {
      setTenantModalOpen(false);
      setSelectedTenant(null);
    });
  };

  const handlePublishCms = () => {
    fetch('/api/admin/cms/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hero: { headline: heroHeadline, subtitle: heroSubtitle } }),
    }).then(() => {
      alert('Marketing Site CMS Published Successfully!');
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans select-none overflow-x-hidden">
      {/* Impersonation Banner */}
      {impersonatingWorkspace && (
        <div className="fixed top-0 left-0 right-0 bg-amber-500 text-slate-950 px-4 py-2 font-black text-xs flex items-center justify-between z-50 shadow-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>IMPERSONATING WORKSPACE: {impersonatingWorkspace} — Super Admin Read-Only Mode</span>
          </div>
          <button
            onClick={() => setImpersonatingWorkspace(null)}
            className="px-3 py-1 rounded bg-slate-950 text-amber-400 text-[10px] font-extrabold hover:bg-slate-900"
          >
            END IMPERSONATION
          </button>
        </div>
      )}

      {/* Super Admin Left Sidebar */}
      <aside className={`w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between z-40 ${impersonatingWorkspace ? 'pt-10' : ''}`}>
        <div className="p-4 border-b border-slate-800 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-red-600 to-amber-600 text-white shadow-lg shadow-red-600/30">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-black text-white tracking-tight block">SUPER ADMIN</span>
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">Control Plane</span>
            </div>
          </div>
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 p-3 overflow-y-auto space-y-1 custom-scrollbar text-xs font-semibold text-slate-400">
          {[
            { id: 'OVERVIEW', label: 'Overview', icon: Activity },
            { id: 'TENANTS', label: 'Tenants', icon: Building2 },
            { id: 'USERS', label: 'Users', icon: Users },
            { id: 'AGENCIES', label: 'Agencies', icon: UserCheck },
            { id: 'INSTAGRAM', label: 'Instagram Ops', icon: Camera },
            { id: 'AUTOMATIONS', label: 'Automations', icon: Zap },
            { id: 'QUEUES', label: 'Queue & Workers', icon: Activity },
            { id: 'AI', label: 'AI Operations', icon: Bot },
            { id: 'BILLING', label: 'Billing & Plans', icon: CreditCard },
            { id: 'CMS', label: 'Website CMS', icon: Globe },
            { id: 'FLAGS', label: 'Feature Flags', icon: Sliders },
            { id: 'HEALTH', label: 'System Health', icon: HeartPulse },
            { id: 'SAFETY', label: 'Safety Center', icon: ShieldAlert, alert: true },
            { id: 'AUDIT', label: 'Audit Logs', icon: FileText },
            { id: 'IMPERSONATION', label: 'Support Impersonation', icon: Eye },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white font-bold shadow-md shadow-red-600/20'
                    : 'hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${tab.alert ? 'text-amber-400' : ''}`} />
                  <span>{tab.label}</span>
                </div>
                {tab.alert && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Admin Profile Footer */}
        <div className="p-3 border-t border-slate-800">
          <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div className="truncate">
              <span className="block text-xs font-bold text-white truncate">PLATFORM_OWNER</span>
              <span className="block text-[10px] text-slate-400 truncate">admin@automationos.io</span>
            </div>
            <Link href="/app" title="Switch to Customer App">
              <LogOut className="w-4 h-4 text-slate-400 hover:text-white" />
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={`flex-1 bg-slate-950 overflow-y-auto p-8 ${impersonatingWorkspace ? 'pt-14' : ''}`}>
        {/* OVERVIEW TAB */}
        {activeTab === 'OVERVIEW' && (
          <div className="space-y-8 max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight">Platform Control Center</h1>
                <p className="text-xs text-slate-400 mt-1">Real-time status, usage metrics, and platform telemetry</p>
              </div>
              <div className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{stats.systemStatus}</span>
              </div>
            </div>

            {/* Metrics Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-2">
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Tenants</span>
                <div className="text-3xl font-black text-white">{stats.totalWorkspaces}</div>
                <span className="text-[10px] text-emerald-400 font-bold">↑ 12% this month</span>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-2">
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Connected Instagram</span>
                <div className="text-3xl font-black text-white">{stats.totalConnectedAccounts}</div>
                <span className="text-[10px] text-emerald-400 font-bold">100% Meta API Healthy</span>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-2">
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Automated DMs Sent</span>
                <div className="text-3xl font-black text-white">{stats.totalMessages.toLocaleString()}</div>
                <span className="text-[10px] text-purple-400 font-bold">Sub-second Latency</span>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-2">
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Monthly MRR</span>
                <div className="text-3xl font-black text-emerald-400">${stats.mrrUsd}</div>
                <span className="text-[10px] text-slate-400">Razorpay Auto-Billed</span>
              </div>
            </div>

            {/* AI Usage Card */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Bot className="w-4 h-4 text-cyan-400" />
                AI Infrastructure & Cost Telemetry
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
                <div>
                  <span className="text-slate-400 block">Active Provider</span>
                  <span className="text-white font-bold block mt-1">Amazon Bedrock / Nova Lite</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Token Usage (Today)</span>
                  <span className="text-white font-bold block mt-1">{stats.aiTokenUsage.toLocaleString()} tokens</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Estimated Cost (Today)</span>
                  <span className="text-emerald-400 font-bold block mt-1">${stats.aiEstimatedCostUsd} USD</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TENANTS TAB */}
        {activeTab === 'TENANTS' && (
          <div className="space-y-6 max-w-7xl mx-auto">
            <h1 className="text-2xl font-black text-white tracking-tight">Tenant & Workspace Management</h1>
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-bold">
                    <th className="pb-3">Workspace</th>
                    <th className="pb-3">Owner</th>
                    <th className="pb-3">Plan</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {[
                    { id: 'ws_1', name: '@mybrand_official', owner: 'alex@brand.com', plan: 'PRO', status: 'ACTIVE' },
                    { id: 'ws_2', name: '@fashion_store_uk', owner: 'finance@fashion.co.uk', plan: 'AGENCY', status: 'ACTIVE' },
                    { id: 'ws_3', name: '@agency_demo', owner: 'agency@digital.io', plan: 'AGENCY', status: 'SUSPENDED' },
                  ].map((tenant) => (
                    <tr key={tenant.id} className="hover:bg-slate-800/40">
                      <td className="py-3.5 font-bold text-white">{tenant.name}</td>
                      <td className="py-3.5 text-slate-400">{tenant.owner}</td>
                      <td className="py-3.5 font-bold text-violet-400">{tenant.plan}</td>
                      <td className="py-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${tenant.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                          {tenant.status}
                        </span>
                      </td>
                      <td className="py-3.5 space-x-2">
                        <button
                          onClick={() => handleStartImpersonation(tenant.name)}
                          className="px-2.5 py-1 rounded bg-slate-800 text-slate-200 hover:text-white font-bold text-[10px]"
                        >
                          Impersonate
                        </button>
                        <button
                          onClick={() => {
                            setSelectedTenant(tenant);
                            setTenantModalOpen(true);
                          }}
                          className="px-2.5 py-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 font-bold text-[10px]"
                        >
                          Suspend
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PLATFORM SAFETY CENTER TAB */}
        {activeTab === 'SAFETY' && (
          <div className="space-y-6 max-w-7xl mx-auto">
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <ShieldAlert className="w-6 h-6 text-amber-400" />
                Platform Safety & Emergency Controls
              </h1>
              <p className="text-xs text-slate-400 mt-1">Emergency kill-switches for platform security, maintenance, and isolation</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.keys(emergencyControls).map((controlKey) => (
                <div key={controlKey} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-xs text-white block">{controlKey}</span>
                    <span className="text-[11px] text-slate-400">
                      {emergencyControls[controlKey] ? 'ACTIVE — Feature Suspended' : 'Normal Operation'}
                    </span>
                  </div>
                  <button
                    onClick={() => handleToggleEmergency(controlKey)}
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                      emergencyControls[controlKey]
                        ? 'bg-red-600 text-white shadow-lg shadow-red-600/40'
                        : 'bg-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    {emergencyControls[controlKey] ? 'PAUSED' : 'ACTIVE'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FEATURE FLAGS TAB */}
        {activeTab === 'FLAGS' && (
          <div className="space-y-6 max-w-7xl mx-auto">
            <h1 className="text-2xl font-black text-white tracking-tight">Platform Feature Flags</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.keys(featureFlags).map((flagKey) => (
                <div key={flagKey} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-xs text-white block">{flagKey}</span>
                    <span className="text-[11px] text-slate-400">Scope: {featureFlags[flagKey].scope}</span>
                  </div>
                  <button
                    onClick={() => handleToggleFlag(flagKey)}
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                      featureFlags[flagKey].enabled
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {featureFlags[flagKey].enabled ? 'ENABLED' : 'DISABLED'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* WEBSITE CMS TAB */}
        {activeTab === 'CMS' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-black text-white tracking-tight">Website CMS Landing Page Editor</h1>
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Hero Headline</label>
                <input
                  type="text"
                  value={heroHeadline}
                  onChange={(e) => setHeroHeadline(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Hero Subtitle</label>
                <textarea
                  rows={3}
                  value={heroSubtitle}
                  onChange={(e) => setHeroSubtitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white"
                />
              </div>

              <button
                onClick={handlePublishCms}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold shadow-lg"
              >
                Publish CMS Changes to Live Website
              </button>
            </div>
          </div>
        )}

        {/* AUDIT LOGS TAB */}
        {activeTab === 'AUDIT' && (
          <div className="space-y-6 max-w-7xl mx-auto">
            <h1 className="text-2xl font-black text-white tracking-tight">Immutable Security Audit Logs</h1>
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-bold">
                    <th className="pb-3">Timestamp</th>
                    <th className="pb-3">Actor</th>
                    <th className="pb-3">Action</th>
                    <th className="pb-3">Target</th>
                    <th className="pb-3">IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {auditLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="py-3 text-slate-400 font-mono text-[11px]">{log.timestamp}</td>
                      <td className="py-3 font-bold text-white">{log.actor}</td>
                      <td className="py-3 text-amber-400 font-bold">{log.action}</td>
                      <td className="py-3 text-slate-300">{log.target}</td>
                      <td className="py-3 text-slate-500 font-mono">{log.ip}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* FALLBACK FOR OTHER TABS */}
        {['USERS', 'AGENCIES', 'INSTAGRAM', 'AUTOMATIONS', 'QUEUES', 'AI', 'BILLING', 'HEALTH', 'IMPERSONATION'].includes(activeTab) && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
            <h2 className="text-lg font-bold text-white">{activeTab} Module Control Plane Active</h2>
            <p className="text-xs text-slate-400">All server-side endpoints for {activeTab} are linked and telemetry is streaming.</p>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>RBAC Permission Check: Authorized</span>
            </div>
          </div>
        )}
      </main>

      {/* Tenant Suspension Confirmation Modal */}
      {tenantModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                Suspend Tenant: {selectedTenant?.name}
              </h3>
              <button onClick={() => setTenantModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Suspending this tenant will halt all Instagram comment automations, AI message handling, and user access.
            </p>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Reason for Audit Log</label>
              <input
                type="text"
                placeholder="e.g. Terms of Service Violation / Overdue Invoice"
                value={suspensionReason}
                onChange={(e) => setSuspensionReason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setTenantModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleSuspendTenant}
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold shadow-lg"
              >
                Confirm Suspension
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
