import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Search,
  Bot,
  User,
  Send,
  Tag,
  MapPin,
  Mail,
  Sparkles,
  RefreshCw,
  AlertCircle,
  Filter,
  CheckCircle2,
  Clock,
  UserPlus,
  Play,
  Pause,
  RotateCcw,
  FileText,
  Sliders,
} from 'lucide-react';
import { api } from '../../services/api';

export const InboxTab: React.FC = () => {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConv, setSelectedConv] = useState<any | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'OPEN' | 'CLOSED' | 'ALL' | 'UNREAD'>('OPEN');
  const [channelFilter, setChannelFilter] = useState('INSTAGRAM');
  const [agentFilter, setAgentFilter] = useState('ALL');
  const [noteText, setNoteText] = useState('');
  const [showNoteModal, setShowNoteModal] = useState(false);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const res = await api.getConversations();
      const list = res.data || [];
      setConversations(list);
      if (list.length > 0 && !selectedConv) {
        setSelectedConv(list[0]);
      }
    } catch (err: any) {
      console.warn('Failed to fetch conversations:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  const handleSend = async () => {
    if (!inputMessage.trim() || !selectedConv) return;
    const content = inputMessage;
    setInputMessage('');

    try {
      const res = await api.replyToConversation(selectedConv.conversationId || selectedConv.id, content);
      fetchConversations();
      if (selectedConv) {
        setSelectedConv((prev: any) => ({
          ...prev,
          messages: [...(prev.messages || []), res.message],
          lastMessage: content,
          aiStatus: 'HUMAN_TAKEOVER',
        }));
      }
    } catch (err: any) {
      alert(`Failed to send message: ${err.message}`);
    }
  };

  const toggleAI = async () => {
    if (!selectedConv) return;
    const convId = selectedConv.conversationId || selectedConv.id;
    try {
      if (selectedConv.aiStatus === 'HUMAN_TAKEOVER') {
        const res = await api.returnToAIConversation(convId);
        setSelectedConv((prev: any) => ({ ...prev, aiStatus: res.aiStatus }));
      } else {
        const res = await api.takeoverConversation(convId);
        setSelectedConv((prev: any) => ({ ...prev, aiStatus: res.aiStatus }));
      }
      fetchConversations();
    } catch (err: any) {
      alert(`Takeover toggle failed: ${err.message}`);
    }
  };

  const handleAddNote = () => {
    if (!noteText.trim() || !selectedConv) return;
    alert(`Internal note added for @${selectedConv.customer?.username}: ${noteText}`);
    setNoteText('');
    setShowNoteModal(false);
  };

  const filteredConversations = conversations.filter((c) => {
    if (statusFilter === 'OPEN') return c.status !== 'CLOSED';
    if (statusFilter === 'CLOSED') return c.status === 'CLOSED';
    if (statusFilter === 'UNREAD') return c.unreadCount > 0;
    return true;
  });

  return (
    <div className="h-[calc(100vh-3.5rem)] bg-slate-950 text-slate-100 flex overflow-hidden">
      {/* COLUMN 1: Conversation List & Filters */}
      <div className="w-80 border-r border-slate-800 flex flex-col bg-slate-900/60">
        {/* Top Filters Header */}
        <div className="p-3.5 border-b border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-violet-400" />
              <span>Unified Inbox</span>
            </h2>
            <button onClick={fetchConversations} disabled={loading} className="text-slate-400 hover:text-white">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Quick Tabs Filter: Open, Closed, All, Unread */}
          <div className="grid grid-cols-4 gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px] font-semibold text-center">
            {(['OPEN', 'CLOSED', 'ALL', 'UNREAD'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`py-1 rounded ${
                  statusFilter === st ? 'bg-violet-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search contacts, text, tags..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500"
            />
          </div>
        </div>

        {/* Conversation Cards Stream */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-500">Loading conversations...</div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 space-y-2">
              <AlertCircle className="w-6 h-6 text-slate-600 mx-auto" />
              <p>No conversations found.</p>
              <p className="text-[10px] text-slate-600">Simulate a comment or message to generate conversation records.</p>
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <div
                key={conv.conversationId || conv.id}
                onClick={() => setSelectedConv(conv)}
                className={`p-3.5 cursor-pointer transition-colors hover:bg-slate-800/50 ${
                  selectedConv?.conversationId === conv.conversationId ? 'bg-slate-800/80 border-l-2 border-violet-500' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-white truncate">
                    {conv.customer?.name || conv.customer?.username || 'Customer'}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {conv.lastMessageTimestamp ? new Date(conv.lastMessageTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 line-clamp-1 mb-2">
                  @{conv.customer?.username}: {conv.lastMessage || 'No messages'}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
                    Score: <strong className="text-emerald-400">{conv.customer?.leadScore || 0}</strong>
                  </span>
                  {conv.aiStatus === 'AI_HANDLING' ? (
                    <span className="flex items-center gap-1 text-[10px] text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-1.5 py-0.5 rounded">
                      <Bot className="w-3 h-3" /> AI Active
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded">
                      <User className="w-3 h-3" /> Human Takeover
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* COLUMN 2: Message Thread & Action Controls */}
      <div className="flex-1 flex flex-col bg-slate-950">
        {selectedConv ? (
          <>
            {/* Thread Header & Quick Action Buttons */}
            <div className="border-b border-slate-800 px-4 py-3 bg-slate-900/40 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-violet-600/30 border border-violet-500/40 flex items-center justify-center font-bold text-violet-300 text-sm">
                    {(selectedConv.customer?.name || selectedConv.customer?.username || 'C').charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      {selectedConv.customer?.name || selectedConv.customer?.username}
                    </h3>
                    <span className="text-xs text-slate-400">@{selectedConv.customer?.username} • Instagram DM</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleAI}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      selectedConv.aiStatus === 'AI_HANDLING'
                        ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/20'
                        : 'bg-amber-500/10 border-amber-500/40 text-amber-300 hover:bg-amber-500/20'
                    }`}
                  >
                    {selectedConv.aiStatus === 'AI_HANDLING' ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                    <span>{selectedConv.aiStatus === 'AI_HANDLING' ? 'Takeover as Human' : 'Return to AI'}</span>
                  </button>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center gap-2 pt-1 overflow-x-auto text-xs">
                <button
                  onClick={() => setShowNoteModal(true)}
                  className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300 hover:text-white flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  <span>Add Note</span>
                </button>

                <button
                  onClick={() => alert(`Assigned to Admin Agent`)}
                  className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300 hover:text-white flex items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Assign</span>
                </button>

                <button
                  onClick={() => alert(`Automation paused for 24h for @${selectedConv.customer?.username}`)}
                  className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300 hover:text-white flex items-center gap-1.5"
                >
                  <Pause className="w-3.5 h-3.5 text-pink-400" />
                  <span>Pause Automation</span>
                </button>

                <button
                  onClick={() => alert(`Triggered automation sequence for @${selectedConv.customer?.username}`)}
                  className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300 hover:text-white flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Run Automation</span>
                </button>
              </div>
            </div>

            {/* Note Modal */}
            {showNoteModal && (
              <div className="bg-slate-900 border-b border-slate-800 p-3 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Type internal note for team..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                />
                <button onClick={handleAddNote} className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-bold">
                  Save Note
                </button>
                <button onClick={() => setShowNoteModal(false)} className="text-slate-400 text-xs font-bold px-2">
                  Cancel
                </button>
              </div>
            )}

            {/* Message Stream */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {(selectedConv.messages || []).map((m: any, idx: number) => (
                <div
                  key={idx}
                  className={`flex flex-col ${m.sender === 'CUSTOMER' ? 'items-start' : 'items-end'}`}
                >
                  <div
                    className={`max-w-md p-3 rounded-2xl text-xs space-y-1 ${
                      m.sender === 'CUSTOMER'
                        ? 'bg-slate-900 text-slate-200 border border-slate-800'
                        : m.sender === 'AI'
                        ? 'bg-gradient-to-r from-violet-900/60 to-purple-900/40 text-violet-100 border border-violet-500/30'
                        : 'bg-violet-600 text-white'
                    }`}
                  >
                    {m.sender === 'AI' && (
                      <div className="flex items-center gap-1 text-[10px] text-violet-300 font-semibold mb-1">
                        <Sparkles className="w-3 h-3" /> Generated by AI Customer Agent
                      </div>
                    )}
                    <p className="leading-relaxed">{m.content}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input Bar */}
            <div className="p-3 border-t border-slate-800 bg-slate-900/60 flex items-center gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={
                  selectedConv.aiStatus === 'AI_HANDLING'
                    ? 'AI is responding automatically (Type to intervene as human)...'
                    : 'Reply as human agent...'
                }
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
              />
              <button
                onClick={handleSend}
                className="p-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs">
            Select a conversation to view message thread.
          </div>
        )}
      </div>

      {/* COLUMN 3: Contact Profile CRM */}
      {selectedConv && (
        <div className="w-80 border-l border-slate-800 bg-slate-900/60 p-4 space-y-5 overflow-y-auto">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-full bg-violet-600/30 border-2 border-violet-500/40 flex items-center justify-center font-bold text-violet-200 text-xl mx-auto">
              {(selectedConv.customer?.name || selectedConv.customer?.username || 'C').charAt(0)}
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">{selectedConv.customer?.name || selectedConv.customer?.username}</h4>
              <span className="text-xs text-slate-400">@{selectedConv.customer?.username}</span>
            </div>
          </div>

          {/* Lead Score & Intent */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Lead Score</span>
              <span className="font-bold text-emerald-400 text-sm">{selectedConv.customer?.leadScore || 0} / 100</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${selectedConv.customer?.leadScore || 0}%` }} />
            </div>
          </div>

          {/* Applied Tags */}
          <div className="space-y-2">
            <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider block">Applied Tags</span>
            <div className="flex flex-wrap gap-1.5">
              {(selectedConv.customer?.tags || ['#InstagramLead', '#PriceInquiry']).map((t: string, idx: number) => (
                <span key={idx} className="bg-violet-500/10 border border-violet-500/30 text-violet-300 px-2 py-0.5 rounded text-[11px] flex items-center gap-1">
                  <Tag className="w-3 h-3" /> {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
