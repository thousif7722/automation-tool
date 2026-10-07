import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Shield, Mail, CheckCircle2, RefreshCw, Activity, Lock, Clock } from 'lucide-react';
import { api } from '../../services/api';

export const TeamTab: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('AGENT');
  const [inviting, setInviting] = useState(false);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await api.getMembers();
      setMembers(res.members || []);
    } catch (err: any) {
      console.warn('Failed to fetch members:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      await api.inviteMember(inviteEmail, inviteRole);
      setInviteEmail('');
      alert(`Invitation sent to ${inviteEmail}`);
      fetchMembers();
    } catch (err: any) {
      alert(`Invite failed: ${err.message}`);
    } finally {
      setInviting(false);
    }
  };

  const activityLog = [
    { action: 'Updated Instagram Default Reply', user: 'Admin User', time: '10 mins ago' },
    { action: 'Intervened in conversation @customer_alex', user: 'Sarah Agent', time: '1 hour ago' },
    { action: 'Activated AI Workflow #PriceInquiry', user: 'Admin User', time: '3 hours ago' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-400" />
            <span>Team & Human Inbox Seats</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage workspace members, assign inbox takeover agent seats, and inspect team audit logs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300">
            Inbox Seats: <span className="text-emerald-400 font-bold">{members.length || 1} / 5 Seats Occupied</span>
          </div>
          <button onClick={fetchMembers} disabled={loading} className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Invite Member Box */}
      <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-3 shadow-xl">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-violet-400" />
          <span>Invite New Team Member</span>
        </h3>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            placeholder="agent@company.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
          >
            <option value="AGENT">Support Agent (Inbox Only)</option>
            <option value="MANAGER">Marketing Manager</option>
            <option value="ADMIN">Workspace Admin</option>
          </select>
          <button
            onClick={handleInvite}
            disabled={inviting}
            className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-all"
          >
            {inviting ? 'Inviting...' : 'Send Invitation'}
          </button>
        </div>
      </div>

      {/* Members & Activity Log Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Members Table */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 font-bold text-xs uppercase text-slate-300">
            Active Workspace Members
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-semibold uppercase border-b border-slate-800">
              <tr>
                <th className="p-3.5">Member Name</th>
                <th className="p-3.5">Email</th>
                <th className="p-3.5">Role</th>
                <th className="p-3.5">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {members.map((m, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40">
                  <td className="p-3.5 font-bold text-white flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-violet-600/30 text-violet-300 font-bold text-[10px] flex items-center justify-center">
                      {m.name?.charAt(0) || 'U'}
                    </div>
                    <span>{m.name}</span>
                  </td>
                  <td className="p-3.5 text-slate-400">{m.email}</td>
                  <td className="p-3.5 font-semibold text-violet-400">{m.role}</td>
                  <td className="p-3.5 text-slate-400">{m.joinedAt ? new Date(m.joinedAt).toLocaleDateString() : 'Owner'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Activity Log */}
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-4 shadow-xl">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>Team Activity Log</span>
          </h3>

          <div className="space-y-3 text-xs">
            {activityLog.map((log, i) => (
              <div key={i} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="font-bold text-slate-200 block">{log.action}</span>
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                  <span>{log.user}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {log.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
