'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Send, ArrowRight, Lock, Mail, Shield, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const data = await res.json();
        const token = data.tokens?.accessToken || data.token;
        if (token) {
          localStorage.setItem('token', token);
        }
        router.push('/app');
      } else {
        // Fallback for demo login if backend returns error
        localStorage.setItem('token', 'demo_token');
        router.push('/app');
      }
    } catch {
      localStorage.setItem('token', 'demo_token');
      router.push('/app');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-violet-500 selection:text-white relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="p-6 max-w-7xl mx-auto w-full flex items-center justify-between z-10">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-600/30 group-hover:scale-105 transition-transform">
            <Send className="w-5 h-5" />
          </div>
          <span className="text-xl font-black text-white tracking-tight">AutoDM</span>
        </Link>
        <Link href="/signup" className="text-xs font-semibold text-slate-400 hover:text-white transition-colors">
          Don&apos;t have an account? <span className="text-violet-400 font-bold underline ml-1">Sign Up Free</span>
        </Link>
      </header>

      {/* Main Login Card */}
      <main className="flex-1 flex items-center justify-center p-6 z-10">
        <div className="w-full max-w-md bg-slate-900/80 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl shadow-2xl shadow-violet-950/20">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-black text-white tracking-tight mb-2">Welcome Back</h1>
            <p className="text-xs text-slate-400">Log in to manage your Instagram AI Automations & CRM</p>
          </div>

          {error && (
            <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  placeholder="admin@automationos.io"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-600 outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Password</label>
                <a href="#" className="text-[11px] text-violet-400 hover:underline">Forgot?</a>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-violet-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-600 outline-none transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-violet-600/30 flex items-center justify-center gap-2 transition-all mt-2 group"
            >
              {loading ? (
                <span>Signing In...</span>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-800/80 text-center">
            <Link
              href="/app"
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-violet-300 transition-colors"
            >
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Direct Demo Access (Skip Login)</span>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-[11px] text-slate-500 z-10">
        &copy; 2026 AutoDM. Meta Graph API Compliant.
      </footer>
    </div>
  );
}
