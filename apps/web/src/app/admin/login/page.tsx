'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Lock, Mail, ArrowRight, AlertTriangle, Key, CheckCircle2 } from 'lucide-react';
import { fetchAPI } from '@/services/api';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // If already authenticated as admin, redirect to /admin
    const token = localStorage.getItem('admin_token') || localStorage.getItem('autodm_token');
    if (token) {
      fetchAPI('/auth/admin-me', { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => {
          if (res?.success) {
            router.replace('/admin');
          }
        })
        .catch(() => {
          // Token invalid or expired, clear and remain on login
          localStorage.removeItem('admin_token');
        });
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetchAPI('/auth/admin-login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (res?.success && res.tokens?.accessToken) {
        localStorage.setItem('admin_token', res.tokens.accessToken);
        localStorage.setItem('autodm_token', res.tokens.accessToken);
        localStorage.setItem('token', res.tokens.accessToken);
        setSuccess(true);
        setTimeout(() => {
          router.push('/admin');
        }, 600);
      } else {
        setError(res?.error || 'Authentication failed. Administrator access required.');
      }
    } catch (err: any) {
      if (err?.status === 401) {
        setError('Invalid administrator credentials.');
      } else if (err?.status === 403) {
        setError('Access Denied: Platform administrator privileges required.');
      } else {
        setError(err?.message || 'Authentication error. Please check your connection and credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* Dynamic Background Gradients & Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Glass Card */}
      <div className="w-full max-w-md bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl rounded-2xl p-8 shadow-2xl relative z-10">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-4 ring-1 ring-white/20">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            AutoDM Super Admin
          </h1>
          <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
            <Lock className="w-3 h-3 text-indigo-400" /> Platform Control Plane Authentication
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 text-red-400 text-xs leading-relaxed animate-in fade-in duration-200">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block mb-0.5">Access Denied</span>
              {error}
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3 text-emerald-400 text-xs font-medium animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Credentials verified. Redirecting to platform control plane...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Administrator Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="admin-email-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@autodm.com"
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Security Key / Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Key className="w-4 h-4" />
              </div>
              <input
                id="admin-password-input"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••••••"
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition"
              />
            </div>
          </div>

          <button
            id="admin-login-submit-btn"
            type="submit"
            disabled={loading || success}
            className="w-full mt-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium py-3 px-4 rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Authenticating Platform Role...
              </span>
            ) : (
              <>
                <span>Access Control Plane</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800/80 text-center">
          <p className="text-[11px] text-slate-500 leading-relaxed">
            🔒 Strictly for authorized platform owners and system administrators.
            All authorization tokens, IP addresses, and actions are logged and audited.
          </p>
        </div>
      </div>

      <div className="mt-8 text-center text-xs text-slate-600">
        AutoDM Core Control Plane &bull; Enterprise SaaS v2.5
      </div>
    </div>
  );
}
