import React, { useState, useEffect } from 'react';
import {
  Users,
  Tag,
  Filter,
  Search,
  Plus,
  UserCheck,
  ArrowRight,
  LayoutGrid,
  List,
  RefreshCw,
  AlertCircle,
  Download,
  Upload,
  CheckSquare,
  X,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { api } from '../../services/api';

export const ContactsTab: React.FC = () => {
  const [view, setView] = useState<'list' | 'kanban'>('list');
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('ALL');
  const [selectedContact, setSelectedContact] = useState<any | null>(null);

  const fetchCRMData = async () => {
    setLoading(true);
    try {
      const res = await api.getLeads();
      setLeads(res.data || []);
    } catch (err: any) {
      console.warn('Failed to fetch CRM leads:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCRMData();
  }, []);

  const stages = ['NEW', 'CONTACTED', 'QUALIFIED', 'HOT', 'CONVERTED'];

  const handleStageMove = async (leadId: string, newStage: string) => {
    try {
      await api.updateLeadStage(leadId, newStage);
      fetchCRMData();
    } catch (err: any) {
      alert(`Failed to update lead stage: ${err.message}`);
    }
  };

  const handleExportCSV = () => {
    const csvContent = 'data:text/csv;charset=utf-8,Username,Stage,LeadScore,Source\n' +
      leads.map((l) => `${l.instagramUsername},${l.status},${l.score || 0},${l.source || 'DM'}`).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'contacts_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLeads = leads.filter((l) => {
    const username = l.instagramUsername || l.name || '';
    const matchesSearch = username.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-100">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-cyan-400" />
            <span>Contacts & CRM</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage Instagram contacts, lead scores, automated sequence tags, and CRM pipelines.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-semibold"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => alert('Import CSV tool opened')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-semibold"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import</span>
          </button>

          <div className="bg-slate-900 border border-slate-800 p-1 rounded-xl flex items-center gap-1">
            <button
              onClick={() => setView('list')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                view === 'list' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Table View</span>
            </button>
            <button
              onClick={() => setView('kanban')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                view === 'kanban' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Pipeline Kanban</span>
            </button>
          </div>

          <button onClick={fetchCRMData} disabled={loading} className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by username, name, tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-semibold">{filteredLeads.length} contacts total</span>
        </div>
      </div>

      {/* Table View */}
      {view === 'list' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          {filteredLeads.length === 0 ? (
            <div className="p-10 text-center text-slate-500 text-xs">No contacts match your criteria.</div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Name / Instagram Username</th>
                  <th className="p-3.5">Channel</th>
                  <th className="p-3.5">Status / Stage</th>
                  <th className="p-3.5">Tags</th>
                  <th className="p-3.5">Lead Score</th>
                  <th className="p-3.5">Created</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {filteredLeads.map((l) => (
                  <tr
                    key={l.id}
                    onClick={() => setSelectedContact(l)}
                    className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    <td className="p-3.5 font-bold text-white flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-cyan-600/30 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-bold text-xs">
                        {(l.instagramUsername || 'C').charAt(0).toUpperCase()}
                      </div>
                      <span>@{l.instagramUsername}</span>
                    </td>
                    <td className="p-3.5 text-slate-300">
                      <span className="px-2 py-0.5 rounded bg-pink-500/10 text-pink-400 border border-pink-500/20 text-[10px] font-bold">
                        Instagram DM
                      </span>
                    </td>
                    <td className="p-3.5 font-semibold text-violet-400">{l.status}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded bg-violet-500/10 text-violet-300 text-[10px] font-semibold">
                        #InstagramLead
                      </span>
                    </td>
                    <td className="p-3.5 font-bold text-emerald-400">{l.score || 0}</td>
                    <td className="p-3.5 text-slate-400">
                      {l.capturedAt ? new Date(l.capturedAt).toLocaleDateString() : 'Recent'}
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedContact(l);
                        }}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold"
                      >
                        View Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Kanban Pipeline View */}
      {view === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
          {stages.map((stage) => {
            const stageLeads = filteredLeads.filter((l) => l.status === stage);
            return (
              <div key={stage} className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 space-y-3 min-w-[220px]">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-slate-300 tracking-wider">{stage}</span>
                  <span className="text-[10px] bg-slate-800 text-slate-400 font-semibold px-2 py-0.5 rounded-full">
                    {stageLeads.length}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {stageLeads.map((lead) => (
                    <div
                      key={lead.id}
                      onClick={() => setSelectedContact(lead)}
                      className="bg-slate-950 border border-slate-800 hover:border-violet-500/40 p-3 rounded-lg space-y-2 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white truncate">@{lead.instagramUsername}</span>
                        <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                          Score {lead.score || 0}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 block">Source: {lead.source || 'DM'}</span>

                      <div className="flex items-center justify-end gap-1 pt-1" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={lead.status}
                          onChange={(e) => handleStageMove(lead.id, e.target.value)}
                          className="bg-slate-900 text-[10px] text-slate-300 border border-slate-800 rounded px-1.5 py-0.5"
                        >
                          {stages.map((st) => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                  {stageLeads.length === 0 && (
                    <div className="p-4 border border-dashed border-slate-800 rounded-lg text-center text-slate-600 text-xs">
                      No leads in {stage}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Contact Profile Drawer Drawer */}
      {selectedContact && (
        <div className="fixed inset-y-0 right-0 w-96 bg-slate-900 border-l border-slate-800 shadow-2xl z-50 p-6 space-y-6 overflow-y-auto">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Contact Details Profile</h3>
            <button onClick={() => setSelectedContact(null)} className="text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="text-center space-y-2">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center font-bold text-white text-2xl mx-auto shadow-lg shadow-violet-600/30">
              {(selectedContact.instagramUsername || 'C').charAt(0).toUpperCase()}
            </div>
            <div>
              <h4 className="text-base font-bold text-white">@{selectedContact.instagramUsername}</h4>
              <span className="text-xs text-slate-400">Instagram Creator Lead</span>
            </div>
          </div>

          {/* Lead Details */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Pipeline Stage</span>
              <span className="font-bold text-violet-400">{selectedContact.status}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Lead Score</span>
              <span className="font-bold text-emerald-400">{selectedContact.score || 0} / 100</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Source</span>
              <span className="font-medium text-slate-200">{selectedContact.source || 'Instagram DM'}</span>
            </div>
          </div>

          {/* Applied Tags & Sequences */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Applied Tags & Sequences</span>
            <div className="flex flex-wrap gap-1.5">
              <span className="px-2.5 py-1 rounded bg-violet-500/10 text-violet-300 text-xs font-semibold border border-violet-500/30">
                #PriceInquiry
              </span>
              <span className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/30">
                #HotLead
              </span>
              <span className="px-2.5 py-1 rounded bg-cyan-500/10 text-cyan-300 text-xs font-semibold border border-cyan-500/30">
                Sequence: Product Onboarding
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
