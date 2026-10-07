import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Sparkles,
  Image,
  Clock,
  CheckCircle2,
  FileText,
  Plus,
  Zap,
  Film,
  Link,
  Bot,
  Layers,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { api } from '../../services/api';

export const ContentTab: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'POSTS' | 'REELS' | 'STORIES' | 'AI_GENERATOR'>('POSTS');
  const [topic, setTopic] = useState('');
  const [generatedCaption, setGeneratedCaption] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [drafts, setDrafts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchContentData = async () => {
    setLoading(true);
    try {
      const res = await api.getContentDrafts();
      setDrafts(res.data || []);
    } catch (err: any) {
      console.warn('Content drafts fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContentData();
  }, []);

  const handleGenerateCaption = () => {
    if (!topic.trim()) return;
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setGeneratedCaption(
        `🚀 Want to automate 90% of your Instagram lead inquiries?\n\nHere's the exact framework top creators are using:\n1. Hook them with a high-value free resource\n2. Trigger instant DMs when they comment 'SCALE'\n3. Qualify with AI agents in real time\n\nComment 'SCALE' below to get our free playbook! 📩\n\n#InstagramAutomation #MarketingOS #AILeadGen`
      );
    }, 600);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-purple-400" />
            <span>Content Studio & Automation Linker</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Schedule Posts, Reels, and Stories, generate AI captions, and link Instagram posts directly to active automation flows.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button onClick={fetchContentData} disabled={loading} className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setActiveTab('AI_GENERATOR')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-600/25 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Caption Generator</span>
          </button>
        </div>
      </div>

      {/* Stats Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase">Content Drafts</span>
            <FileText className="w-4 h-4 text-violet-400" />
          </div>
          <span className="text-2xl font-bold text-white">{drafts.length}</span>
          <p className="text-xs text-slate-400">{drafts.length > 0 ? 'Ready for review' : 'No drafts queued'}</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase">Scheduled Reels</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="text-2xl font-bold text-white">0 Queued</span>
          <p className="text-xs text-slate-400">Connect Instagram account to schedule</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase">Published Posts</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-2xl font-bold text-white">0</span>
          <p className="text-xs text-slate-400">Published post history</p>
        </div>
      </div>

      {/* AI Caption Generator Panel */}
      {activeTab === 'AI_GENERATOR' && (
        <div className="bg-slate-900/90 border border-purple-500/30 p-6 rounded-2xl space-y-4 shadow-xl">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>AI Caption & Trigger Keyword Generator</span>
          </h3>

          <div className="space-y-3">
            <input
              type="text"
              placeholder="Topic or offer details (e.g. Free E-book on Instagram Growth)..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
            <button
              onClick={handleGenerateCaption}
              disabled={isGenerating || !topic.trim()}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all disabled:opacity-50"
            >
              {isGenerating ? 'Generating Caption...' : 'Generate High-Converting Caption'}
            </button>

            {generatedCaption && (
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                <span className="font-bold text-purple-300 block">Generated Result:</span>
                <textarea
                  rows={6}
                  value={generatedCaption}
                  onChange={(e) => setGeneratedCaption(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-slate-200"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Content Posts List */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Content & Automation Linking</h3>
          <span className="text-xs text-slate-400">{drafts.length} items</span>
        </div>

        {drafts.length > 0 ? (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-3.5">Post Title</th>
                <th className="p-3.5">Type</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Linked Automation Flow</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {drafts.map((post) => (
                <tr key={post.id || post._id} className="hover:bg-slate-800/40">
                  <td className="p-3.5 font-bold text-white">{post.title}</td>
                  <td className="p-3.5 text-purple-400 font-semibold">{post.type || 'POST'}</td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                      {post.status || 'DRAFT'}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span className="px-2.5 py-1 rounded bg-violet-500/10 text-violet-300 border border-violet-500/30 text-[11px] font-bold flex items-center gap-1 w-fit">
                      <Zap className="w-3 h-3 text-amber-400" />
                      {post.linkedAutomation || 'None'}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => alert(`Link automation to post`)}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold"
                    >
                      Link Automation
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-8 text-center text-slate-500 space-y-2">
            <AlertCircle className="w-6 h-6 mx-auto text-slate-600" />
            <p className="text-xs text-slate-400 font-medium">No content posts queued yet.</p>
            <p className="text-[11px] text-slate-600">Connect your Instagram account or generate captions using AI Studio.</p>
          </div>
        )}
      </div>
    </div>
  );
};
