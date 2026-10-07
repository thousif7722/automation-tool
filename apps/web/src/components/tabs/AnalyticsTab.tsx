import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Sparkles,
  Send,
  HelpCircle,
  DollarSign,
  MessageSquare,
  Zap,
  RefreshCw,
  Clock,
  CheckCircle2,
  Users,
  Target,
  Bot,
  AlertCircle,
} from 'lucide-react';
import { api } from '../../services/api';

export const AnalyticsTab: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);
  const [question, setQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState<any>(null);
  const [asking, setAsking] = useState(false);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.getAnalytics();
      setAnalytics(res.analytics);
    } catch (err: any) {
      console.warn('Failed to fetch analytics:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleAsk = async () => {
    if (!question.trim()) return;
    setAsking(true);
    try {
      const res = await api.askAI(question);
      setAiAnswer(res);
    } catch (err: any) {
      alert(`AI Query failed: ${err.message}`);
    } finally {
      setAsking(false);
    }
  };

  const hasData = analytics && (analytics.commentsProcessed > 0 || analytics.dmsSent > 0 || analytics.leadsCaptured > 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-400" />
            <span>Analytics & Business Outcomes</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time business performance analytics, conversion rates, response velocity, and AI resolution metrics.
          </p>
        </div>

        <button onClick={fetchAnalytics} disabled={loading} className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Business Outcome KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Contacts</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white">{analytics?.totalContacts ?? 0}</div>
          <span className="text-[10px] text-slate-400 block">
            {hasData ? 'Active CRM Contacts' : 'No data yet'}
          </span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Conversations</span>
            <MessageSquare className="w-4 h-4 text-violet-400" />
          </div>
          <div className="text-2xl font-bold text-white">{analytics?.commentsProcessed ?? 0}</div>
          <span className="text-[10px] text-slate-400">
            {hasData ? 'Processed comments & DMs' : 'No data yet'}
          </span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Leads Captured</span>
            <Target className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">{analytics?.leadsCaptured ?? 0}</div>
          <span className="text-[10px] text-slate-400 block">
            {hasData ? `Conversion Rate: ${analytics?.conversionRate || 0}%` : 'No data yet'}
          </span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Avg Response Speed</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {analytics?.avgResponseTime ? `${analytics.avgResponseTime}s` : 'No data yet'}
          </div>
          <span className="text-[10px] text-slate-400">Meta Webhook Latency</span>
        </div>
      </div>

      {/* AI & Agent Performance Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Bot className="w-4 h-4 text-cyan-400" />
            <span>AI Resolution Rate vs Human Takeover</span>
          </h3>
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
            {hasData ? (
              <>
                <div className="flex justify-between">
                  <span className="text-slate-400">Fully Automated by AI</span>
                  <span className="font-bold text-emerald-400">{analytics?.aiResolutionRate || 100}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-400 h-full rounded-full"
                    style={{ width: `${analytics?.aiResolutionRate || 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 pt-1">
                  <span>Human Interventions: {100 - (analytics?.aiResolutionRate || 100)}%</span>
                  <span>Total Runs: {analytics?.dmsSent || 0}</span>
                </div>
              </>
            ) : (
              <div className="py-4 text-center text-slate-500 space-y-1">
                <AlertCircle className="w-5 h-5 mx-auto text-slate-600" />
                <p>Connect your Instagram account to see AI resolution metrics.</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Top Performing Automation Flows</span>
          </h3>
          <div className="space-y-2 text-xs">
            {analytics?.topFlows && analytics.topFlows.length > 0 ? (
              analytics.topFlows.map((flow: any, i: number) => (
                <div key={i} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white block">{flow.name}</span>
                    <span className="text-[10px] text-slate-400">{flow.runs} triggers executed</span>
                  </div>
                  <span className="font-bold text-emerald-400">{flow.conversion}</span>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-slate-500 bg-slate-950 p-4 rounded-xl border border-slate-800">
                <p>No active automation runs recorded yet.</p>
                <p className="text-[10px] text-slate-600 mt-0.5">Automations will report performance data after receiving triggers.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Conversational AI Query Box */}
      <div className="bg-slate-900/80 border border-violet-500/30 p-5 rounded-2xl space-y-3 shadow-xl">
        <div className="flex items-center gap-2 text-violet-400 text-xs font-semibold uppercase tracking-wider">
          <Sparkles className="w-4 h-4" />
          <span>Ask AI Business Analyst</span>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
            placeholder="e.g. Which automation workflow produced the highest lead conversion rate this week?"
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
          />
          <button
            onClick={handleAsk}
            disabled={asking}
            className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold flex items-center gap-2"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Query</span>
          </button>
        </div>

        {aiAnswer && (
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-1">
            <span className="font-bold text-violet-300 block">AI Evidence-Based Response:</span>
            <p className="text-slate-300">{aiAnswer.answer}</p>
          </div>
        )}
      </div>
    </div>
  );
};
