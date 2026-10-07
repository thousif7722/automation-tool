import React from 'react';
import Link from 'next/link';
import { Send, ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
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
        <h1 className="text-3xl font-black text-white tracking-tight">Privacy Policy</h1>
        <p className="text-xs text-slate-400">Last updated: October 2026</p>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">1. Information We Collect</h2>
          <p>
            AutoDM collects information necessary to provide Instagram automation services in full compliance with the Meta Graph API Platform Policy. This includes Instagram account IDs, webhooks events, message metadata, and user preferences. We never ask for or store your Instagram password.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">2. How We Use Information</h2>
          <p>
            Collected information is solely used to execute your custom AI workflows, deliver automated direct messages, qualify leads, and provide analytical insights inside your AutoDM dashboard.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">3. Data Security & Storage</h2>
          <p>
            We implement enterprise-grade encryption for all access tokens and sensitive data at rest and in transit. Access tokens are stored securely in encrypted databases.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white">4. Meta Platform Compliance</h2>
          <p>
            AutoDM strictly adheres to Meta Graph API permissions, rate limits, and data protection requirements. Users have full control to disconnect their accounts or request data deletion at any time.
          </p>
        </section>
      </main>

      <footer className="mt-12 pt-6 border-t border-slate-800 text-xs text-slate-500 text-center">
        &copy; 2026 AutoDM Platform. All rights reserved.
      </footer>
    </div>
  );
}
