import React from 'react';
import Link from 'next/link';
import { Send, ArrowLeft } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 max-w-4xl mx-auto font-sans">
      <header className="py-6 border-b border-slate-800 flex items-center justify-between mb-8">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-violet-600 to-purple-600 text-white">
            <Send className="w-5 h-5" />
          </div>
          <span className="text-xl font-black text-white">AutoDM</span>
        </Link>
        <Link href="/" className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-semibold">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
      </header>

      <main className="space-y-6 text-slate-300 text-sm leading-relaxed">
        <h1 className="text-3xl font-black text-white tracking-tight">Terms of Service</h1>
        <p className="text-xs text-slate-400">Last updated: October 2026</p>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">1. Acceptance of Terms</h2>
          <p>
            By accessing or using AutoDM, you agree to be bound by these Terms of Service and all applicable Meta Graph API Platform Policies.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">2. Permitted Use</h2>
          <p>
            AutoDM is designed for legitimate business messaging, customer support, and lead qualification. Users must not use the platform for spam, harassment, or unauthorized promotional messaging.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">3. Account Responsibility</h2>
          <p>
            You are responsible for maintaining the security of your account credentials and for all automation workflows published under your account.
          </p>
        </section>
      </main>

      <footer className="mt-12 pt-6 border-t border-slate-800 text-xs text-slate-500 text-center">
        &copy; 2026 AutoDM Platform. All rights reserved.
      </footer>
    </div>
  );
}
