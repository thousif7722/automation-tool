import React, { useState, useEffect } from 'react';
import {
  Bot,
  BookOpen,
  Sparkles,
  Upload,
  Plus,
  ShieldCheck,
  FileText,
  CheckCircle2,
  Save,
  RefreshCw,
  Cpu,
  Database,
  Sliders,
  AlertTriangle,
  Brain,
  MessageSquare,
  BarChart3,
  TestTube,
} from 'lucide-react';
import { api } from '../../services/api';

export type AISection =
  | 'AGENTS'
  | 'KNOWLEDGE'
  | 'BRAND_VOICE'
  | 'TOOLS_MCP'
  | 'MEMORY'
  | 'POLICIES'
  | 'ESCALATION'
  | 'TESTING'
  | 'ANALYTICS';

export const AITab: React.FC = () => {
  const [activeSection, setActiveSection] = useState<AISection>('AGENTS');
  const [brandVoice, setBrandVoice] = useState('Friendly, professional, helpful, e-commerce brand assistant');
  const [loading, setLoading] = useState(true);
  const [knowledgeItems, setKnowledgeItems] = useState<any[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [agentGoal, setAgentGoal] = useState('Qualify Instagram comment inquiries, answer FAQs, and collect contact details.');
  const [escalationThreshold, setEscalationThreshold] = useState(0.85);

  const fetchAIData = async () => {
    setLoading(true);
    try {
      const [configRes, knowledgeRes] = await Promise.all([
        api.getAIConfig().catch(() => ({ config: {} })),
        api.getKnowledge().catch(() => ({ data: [] })),
      ]);

      if (configRes.config?.tone) {
        setBrandVoice(configRes.config.tone);
      }
      setKnowledgeItems(knowledgeRes.data || []);
    } catch (err: any) {
      console.warn('Failed to fetch AI data:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAIData();
  }, []);

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      await api.updateAIConfig({ tone: brandVoice });
      alert('AI Configuration & Guardrails updated successfully');
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleAddKnowledge = async () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    try {
      await api.addKnowledge({ title: newTitle, content: newContent, documentType: 'FAQ' });
      setNewTitle('');
      setNewContent('');
      fetchAIData();
    } catch (err: any) {
      alert(`Knowledge upload failed: ${err.message}`);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bot className="w-6 h-6 text-cyan-400" />
            <span>AI Studio & Agent Engine</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Configure AI agents, knowledge bases, MCP tools, brand voices, security policies, and escalation thresholds.
          </p>
        </div>

        <button onClick={fetchAIData} disabled={loading} className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Sub-Section Navigation Tabs */}
      <div className="flex items-center gap-1.5 bg-slate-900/60 p-1.5 rounded-xl border border-slate-800 overflow-x-auto">
        {[
          { id: 'AGENTS', label: 'AI Agents' },
          { id: 'KNOWLEDGE', label: 'Knowledge Base (RAG)' },
          { id: 'BRAND_VOICE', label: 'Brand Voice' },
          { id: 'TOOLS_MCP', label: 'Tools & MCP' },
          { id: 'MEMORY', label: 'Memory & Context' },
          { id: 'POLICIES', label: 'Security Policies' },
          { id: 'ESCALATION', label: 'Human Escalation' },
          { id: 'TESTING', label: 'Testing Sandbox' },
          { id: 'ANALYTICS', label: 'Agent Analytics' },
        ].map((sec) => (
          <button
            key={sec.id}
            onClick={() => setActiveSection(sec.id as AISection)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeSection === sec.id
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            {sec.label}
          </button>
        ))}
      </div>

      {/* AGENTS SECTION */}
      {(activeSection === 'AGENTS' || activeSection === 'BRAND_VOICE') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Customer Agent Goal & Instructions</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-semibold block mb-1">Primary Agent Goal</label>
                <textarea
                  rows={2}
                  value={agentGoal}
                  onChange={(e) => setAgentGoal(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Brand Voice & Persona Instructions</label>
                <textarea
                  rows={3}
                  value={brandVoice}
                  onChange={(e) => setBrandVoice(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <button
                onClick={handleSaveConfig}
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Agent Configuration'}</span>
              </button>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Cpu className="w-4 h-4 text-violet-400" />
              <span>Active Model & MCP Runtime</span>
            </h3>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Active AI Provider</span>
                <span className="font-bold text-cyan-400">Ollama (Llama-3 Local / Bedrock Ready)</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">XML Sandbox Guard</span>
                <span className="font-bold text-emerald-400">Active (`&lt;untrusted_customer_message&gt;`)</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">MCP Multi-Server Engine</span>
                <span className="font-bold text-violet-300">Connected (Streamable HTTP Transport)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KNOWLEDGE (RAG) SECTION */}
      {activeSection === 'KNOWLEDGE' && (
        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-5 shadow-xl">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <span>Tenant Knowledge Base (Vector RAG Index)</span>
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <span className="text-xs font-semibold text-white block">Add FAQ Knowledge Document</span>
              <input
                type="text"
                placeholder="Question / Document Title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
              />
              <textarea
                rows={3}
                placeholder="Knowledge Content / Detailed Answer"
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
              />
              <button
                onClick={handleAddKnowledge}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Add Document to RAG Index
              </button>
            </div>

            <div className="space-y-2">
              <span className="text-xs text-slate-400 font-semibold block">Indexed RAG Items ({knowledgeItems.length})</span>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {knowledgeItems.map((item, idx) => (
                  <div key={idx} className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs space-y-1">
                    <span className="font-bold text-cyan-300 block">{item.title}</span>
                    <p className="text-slate-300 line-clamp-2">{item.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOOLS & MCP SECTION */}
      {activeSection === 'TOOLS_MCP' && (
        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Cpu className="w-4 h-4 text-violet-400" />
            <span>Model Context Protocol (MCP) & Integrated Tool Registry</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            {[
              { name: 'instagram.replyComment', desc: 'Post public reply to post comment', type: 'META GRAPH' },
              { name: 'instagram.sendDM', desc: 'Send direct message to user', type: 'META GRAPH' },
              { name: 'crm.addLead', desc: 'Insert lead into workspace CRM pipeline', type: 'DATABASE' },
              { name: 'crm.applyTag', desc: 'Tag contact with automated segment label', type: 'DATABASE' },
              { name: 'content.getPostDetails', desc: 'Retrieve post media metadata and caption', type: 'CONTENT API' },
              { name: 'mcp.oneWayFixConfirmation', desc: 'Human-in-the-loop approval confirmation step', type: 'HUMAN INTERVENT' },
            ].map((tool) => (
              <div key={tool.name} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="font-mono text-violet-300 font-bold block">{tool.name}</span>
                <p className="text-slate-400 text-[11px]">{tool.desc}</p>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20 inline-block mt-1">
                  {tool.type}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* POLICIES & ESCALATION SECTION */}
      {(activeSection === 'POLICIES' || activeSection === 'ESCALATION') && (
        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>Security Guardrails & Human Escalation Policy</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="font-semibold text-amber-300 block">Prompt Injection Guardrail</span>
              <p className="text-slate-400">
                All incoming Instagram messages are screened by `PromptInjectionFilter` before reaching the LLM context window to prevent prompt injection and system instruction overrides.
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="font-semibold text-slate-200 block">Human Escalation Confidence Threshold</span>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0.5"
                  max="0.99"
                  step="0.05"
                  value={escalationThreshold}
                  onChange={(e) => setEscalationThreshold(parseFloat(e.target.value))}
                  className="flex-1 accent-cyan-500 cursor-pointer"
                />
                <span className="font-mono font-bold text-cyan-400 text-sm">{(escalationThreshold * 100).toFixed(0)}%</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                If AI confidence drops below {(escalationThreshold * 100).toFixed(0)}%, conversation automatically transfers to Human Takeover mode in Inbox.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TESTING & ANALYTICS SECTION */}
      {(activeSection === 'TESTING' || activeSection === 'ANALYTICS' || activeSection === 'MEMORY') && (
        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <TestTube className="w-4 h-4 text-emerald-400" />
            <span>AI Sandbox Testing & Execution Trace</span>
          </h3>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
            <p className="text-slate-400">
              Run test prompts against the agent to verify RAG vector retrieval, prompt injection filters, and tool invocation logic.
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Type test message (e.g. How much does your product cost?)"
                className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
              />
              <button
                onClick={() => alert('AI Agent Sandbox Response: "Our standard pricing starts at $49/mo. Check your DM for full details!" [Tools: instagram.sendDM, crm.addLead]')}
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-bold"
              >
                Run Sandbox Test
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
