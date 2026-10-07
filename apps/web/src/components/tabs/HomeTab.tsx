import React, { useEffect, useState } from 'react';
import { Camera, Zap, MessageSquare, Users, TrendingUp, AlertCircle, ArrowUpRight, CheckCircle2, ShieldCheck, Sparkles, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';

export const HomeTab: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);

  const fetchHomeData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getAnalytics();
      setAnalytics(res.analytics);
    } catch (err: any) {
      setError(err.message || 'Failed to load workspace metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomeData();
  }, []);

  const isConnected = analytics?.connectedAccounts > 0;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-100">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <span>Workspace Command Center</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
              Live Engine
            </span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time analytics and automation performance across connected Instagram channels.
          </p>
        </div>

        <button
          onClick={fetchHomeData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Account Connection Alert */}
      {!isConnected && !loading && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <p className="font-semibold">Instagram Connection Awaiting Configuration</p>
              <p className="text-xs text-amber-400/80">Connect an Instagram Professional account in the Instagram tab to activate live comment monitoring and DM automation.</p>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-slate-900/50 p-5 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Connected Accounts</span>
            <Camera className="w-4 h-4 text-pink-400" />
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-white">
              {loading ? '...' : analytics?.connectedAccounts || 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {isConnected ? 'Active Graph API connection' : 'Not connected'}
            </p>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-slate-900/50 p-5 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Workflows</span>
            <Zap className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-white">
              {loading ? '...' : analytics?.activeWorkflows || 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">Automation rules active</p>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-slate-900/50 p-5 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Leads Captured</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-white">
              {loading ? '...' : analytics?.leadsCaptured || 0}
            </div>
            <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>Conversion Rate: {analytics?.conversionRate || 0}%</span>
            </p>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-slate-900/50 p-5 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Revenue Attribution</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-4">
            <div className="text-sm font-medium text-slate-400">
              Revenue attribution not configured
            </div>
            <p className="text-xs text-slate-500 mt-1">Connect Razorpay / payment provider</p>
          </div>
        </div>
      </div>

      {/* Operational Highlights Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900/50 p-6 rounded-2xl border border-slate-800 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            <span>AI & Security Runtime Status</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-xs text-slate-400">XML Boundary Protection</span>
              <p className="text-sm font-semibold text-emerald-400 mt-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Prompt Injection Filter Active</span>
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-xs text-slate-400">Token Storage</span>
              <p className="text-sm font-semibold text-emerald-400 mt-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>AES-256-GCM Encryption</span>
              </p>
            </div>
          </div>
        </div>

        {/* System Info */}
        <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 space-y-4">
          <h2 className="text-base font-bold text-white">System Environment</h2>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400">Graph API Version</span>
              <span className="font-mono text-slate-200">v19.0</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400">Rate Limiter</span>
              <span className="font-mono text-emerald-400">Active (100 req/min)</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-400">Event Queue</span>
              <span className="font-mono text-slate-200">BullMQ + Redis Engine</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
