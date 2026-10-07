import React, { useState, useEffect } from 'react';
import {
  Zap,
  Plus,
  Sparkles,
  Bot,
  Play,
  Pause,
  Copy,
  Trash2,
  ChevronRight,
  Sliders,
  RefreshCw,
  AlertCircle,
  Search,
  Filter,
  ArrowUpDown,
  History,
  Layers,
  FileCode,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';
import { WorkflowBuilder } from '../WorkflowBuilder';
import { VersionHistoryModal } from '../VersionHistoryModal';
import { api } from '../../services/api';

export type AutomationSubTab = 'MY_AUTOMATIONS' | 'BASIC' | 'KEYWORDS' | 'SEQUENCES' | 'RULES';

interface AutomationTabProps {
  initialSubTab?: AutomationSubTab;
}

export const AutomationTab: React.FC<AutomationTabProps> = ({ initialSubTab = 'MY_AUTOMATIONS' }) => {
  const [activeSubTab, setActiveSubTab] = useState<AutomationSubTab>(initialSubTab);
  const [viewMode, setViewMode] = useState<'list' | 'builder' | 'ai-modal'>('list');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'DRAFT' | 'PAUSED'>('ALL');
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);

  useEffect(() => {
    if (initialSubTab) setActiveSubTab(initialSubTab);
  }, [initialSubTab]);

  const fetchWorkflows = async () => {
    setLoading(true);
    try {
      const res = await api.getWorkflows();
      setWorkflows(res.data || []);
    } catch (err: any) {
      console.warn('Failed to fetch workflows:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    try {
      if (currentStatus === 'ACTIVE') {
        await api.pauseWorkflow(id);
      } else {
        await api.activateWorkflow(id);
      }
      fetchWorkflows();
    } catch (err: any) {
      alert(`Status update failed: ${err.message}`);
    }
  };

  const handleGenerateAI = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const result = await api.generateAIWorkflow(aiPrompt);
      setGeneratedPlan({
        prompt: aiPrompt,
        steps: [
          { name: 'Trigger', detail: 'Instagram Comment contains keyword "PRICE"' },
          { name: 'Condition', detail: 'User is not already a customer' },
          { name: 'Public Reply', detail: 'Public reply: "Check your DMs for pricing details! 📥"' },
          { name: 'Private Message', detail: 'Send DM with product catalog PDF & pricing table' },
          { name: 'Tag Contact', detail: 'Apply Tag: #Lead-PriceInquiry' },
          { name: 'Create Lead', detail: 'Add to CRM Pipeline under "New Instagram Leads"' },
          { name: 'Goal', detail: 'Convert to Paid Subscription' },
        ],
        warnings: ['Requires instagram_manage_comments and instagram_manage_messages permissions'],
        estimatedMonthlyActions: 1450,
      });
      setIsGenerating(false);
    } catch (err: any) {
      alert(`AI Generation failed: ${err.message}`);
      setIsGenerating(false);
    }
  };

  const handleConfirmAIWorkflow = () => {
    setGeneratedPlan(null);
    setAiPrompt('');
    setViewMode('builder');
    fetchWorkflows();
  };

  const filteredWorkflows = workflows.filter((w) => {
    const matchesSearch = w.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (w.triggerKeywords || []).some((k: string) => k.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || w.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (viewMode === 'builder') {
    return (
      <div className="relative h-[calc(100vh-3.5rem)]">
        <div className="absolute top-3 left-64 z-30 flex items-center gap-2">
          <button
            onClick={() => setViewMode('list')}
            className="px-3 py-1 rounded bg-slate-900 border border-slate-700 text-slate-300 text-xs font-semibold hover:bg-slate-800"
          >
            ← Back to Automations List
          </button>
        </div>
        <WorkflowBuilder />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-100">
      {/* Header & Sub-Tabs Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Zap className="w-6 h-6 text-amber-400" />
            <span>Automation Center</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            ManyChat-style Instagram automation flows, keyword triggers, drip sequences, and smart rules.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setGeneratedPlan(null);
              setViewMode('ai-modal');
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-violet-600/25 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Workflow Builder</span>
          </button>

          <button
            onClick={() => setViewMode('builder')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 text-xs font-bold transition-all"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>New Automation</span>
          </button>

          <button
            onClick={fetchWorkflows}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Sub-Tabs Selector */}
      <div className="flex items-center gap-2 bg-slate-900/60 p-1.5 rounded-xl border border-slate-800 w-fit">
        {[
          { id: 'MY_AUTOMATIONS', label: 'My Automations' },
          { id: 'BASIC', label: 'Basic Automations' },
          { id: 'KEYWORDS', label: 'Keywords Trigger' },
          { id: 'SEQUENCES', label: 'Drip Sequences' },
          { id: 'RULES', label: 'Smart Rules' },
        ].map((sub) => (
          <button
            key={sub.id}
            onClick={() => setActiveSubTab(sub.id as AutomationSubTab)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === sub.id
                ? 'bg-violet-600 text-white shadow-md shadow-violet-600/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            {sub.label}
          </button>
        ))}
      </div>

      {/* AI Workflow Generator Entry Point Modal */}
      {viewMode === 'ai-modal' && (
        <div className="bg-slate-900 border border-violet-500/30 p-6 rounded-2xl space-y-4 backdrop-blur-xl relative shadow-2xl">
          <button
            onClick={() => setViewMode('list')}
            className="absolute top-4 right-4 text-slate-400 hover:text-white text-xs font-bold"
          >
            ✕ Close
          </button>
          <div className="flex items-center gap-2 text-violet-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>Natural Language AI Automation Builder</span>
          </div>
          <h2 className="text-lg font-bold text-white">What do you want to automate on Instagram?</h2>

          <textarea
            rows={3}
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="e.g. When someone comments PRICE on my Instagram post, reply publicly with 'Check DMs' and send them product details, tag them as a lead, and notify sales."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
          />

          {!generatedPlan ? (
            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-400">
                AI automatically designs triggers, logic conditions, public comments, DMs, CRM tagging, and goals.
              </span>
              <button
                onClick={handleGenerateAI}
                disabled={isGenerating || !aiPrompt.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-lg shadow-violet-600/25 transition-all disabled:opacity-50"
              >
                {isGenerating ? (
                  <span>Generating Workflow Plan...</span>
                ) : (
                  <>
                    <Bot className="w-4 h-4" />
                    <span>Generate AI Plan</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            /* Generated Workflow Breakdown & Approval */
            <div className="bg-slate-950 p-4 rounded-xl border border-violet-500/40 space-y-4 mt-2">
              <h3 className="text-xs font-bold text-violet-300 uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Generated Automation Execution Structure</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {generatedPlan.steps.map((step: any, i: number) => (
                  <div key={i} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                    <span className="font-bold text-violet-400 block">{i + 1}. {step.name}</span>
                    <span className="text-slate-300 text-[11px] block mt-0.5">{step.detail}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800">
                <div className="flex items-center gap-2 text-amber-400 text-[11px]">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Requires user confirmation before activation</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setGeneratedPlan(null)}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 text-xs font-semibold"
                  >
                    Modify Prompt
                  </button>
                  <button
                    onClick={handleConfirmAIWorkflow}
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                  >
                    Approve & Open Visual Builder
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filter, Search & Sort Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search automations or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e: any) => setStatusFilter(e.target.value)}
              className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="PAUSED">Paused</option>
              <option value="DRAFT">Draft</option>
            </select>
          </div>
        </div>
      </div>

      {/* My Automations List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs">Loading automation rules from database...</div>
        ) : filteredWorkflows.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-10 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-slate-500 mx-auto" />
            <h4 className="text-base font-semibold text-slate-300">No Automations Found</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              No automations match your search criteria. Create a new flow or adjust filters.
            </p>
            <button
              onClick={() => setViewMode('builder')}
              className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all"
            >
              Create New Flow
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filteredWorkflows.map((auto) => (
              <div
                key={auto.id}
                className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-violet-600/10 text-violet-400 border border-violet-500/20">
                    <Zap className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">{auto.name}</h4>
                      <button
                        onClick={() => handleToggleStatus(auto.id, auto.status)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border cursor-pointer hover:opacity-80 transition-opacity ${
                          auto.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}
                      >
                        {auto.status}
                      </button>
                    </div>
                    <span className="text-xs text-slate-400 block mt-0.5">
                      Trigger Keywords: {(auto.triggerKeywords || []).join(', ') || 'Any Post Comment'}
                    </span>
                  </div>
                </div>

                {/* Automation Metrics */}
                <div className="flex items-center gap-6 text-xs text-slate-300">
                  <div>
                    <span className="text-slate-500 text-[11px] block">Runs</span>
                    <span className="font-bold text-white">{auto.triggerCount || 0}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px] block">DM Response</span>
                    <span className="font-medium text-slate-300 truncate max-w-[160px] block">
                      {auto.privateDMText || 'Automated PDF & Link'}
                    </span>
                  </div>
                </div>

                {/* Actions Group */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedWorkflowId(auto.id);
                      setHistoryModalOpen(true);
                    }}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                    title="Version History"
                  >
                    <History className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setViewMode('builder')}
                    className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-white font-semibold flex items-center gap-1 transition-colors"
                  >
                    <span>Edit Flow</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Version History Modal */}
      {historyModalOpen && selectedWorkflowId && (
        <VersionHistoryModal
          isOpen={historyModalOpen}
          onClose={() => {
            setHistoryModalOpen(false);
            setSelectedWorkflowId(null);
          }}
          versions={[
            { version: 2, status: 'ACTIVE', createdAt: 'Today, 2:15 PM', nodesCount: 6, graphData: { nodes: [], edges: [] } },
            { version: 1, status: 'ARCHIVED', createdAt: 'Yesterday, 11:30 AM', nodesCount: 4, graphData: { nodes: [], edges: [] } },
          ]}
          currentVersion={2}
          onRestoreVersion={(verNum) => {
            fetchWorkflows();
            setHistoryModalOpen(false);
          }}
        />
      )}
    </div>
  );
};
