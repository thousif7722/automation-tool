'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Send,
  Zap,
  Bot,
  MessageSquare,
  Users,
  BarChart3,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Play,
  Layers,
  Check,
  ChevronDown,
  ChevronUp,
  Camera,
  Lock,
  Cpu,
  Globe,
  Sliders,
  LifeBuoy,
  RefreshCw,
  Clock,
  LayoutDashboard,
  ShieldAlert,
  Building2,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [selectedFlowTrigger, setSelectedFlowTrigger] = useState<'PRICE' | 'BOOK' | 'INFO'>('PRICE');

  const faqs = [
    {
      q: 'Is AutoDM fully compliant with Instagram and Meta policies?',
      a: 'Yes, 100%. AutoDM connects directly using the official Meta Graph API and Meta Webhook framework. We never ask for your Instagram password, and all automations comply with Meta rate limits and Messaging Terms.',
    },
    {
      q: 'Do I need technical skills or coding to build workflows?',
      a: 'Not at all. AutoDM features a no-code visual workflow builder and pre-configured AI templates. You can set up your first comment-to-DM automation in under 3 minutes.',
    },
    {
      q: 'How does the AI Customer Agent answer specific questions about my business?',
      a: 'You can upload your website link, FAQ documents, or product catalog into the AutoDM AI Studio. The agent learns your brand voice and accurate business details to respond autonomously.',
    },
    {
      q: 'Can I manage multiple Instagram accounts or client brands?',
      a: 'Yes! Our Pro and Agency plans support multi-workspace management, team permission roles, and unified client reporting.',
    },
    {
      q: 'Is there a free trial available?',
      a: 'Yes! You can start on our Free Tier with 500 automated DMs per month, or test the Pro Plan with a 14-day free trial without entering a credit card.',
    },
  ];

  const flowScenarios = {
    PRICE: {
      trigger: 'User comments "PRICE" on your Reel',
      dm: 'Hey Sarah! 🌟 Thanks for asking about the Pro Creator Bundle! It\'s currently on a 30% flash sale ($49). Would you like me to send over the direct checkout link or answer any questions?',
      qualification: 'Intent: High Purchasing Interest • Tag: #sale_lead',
      crmAction: 'Lead "Sarah Jenkins" created with score 85/100',
    },
    BOOK: {
      trigger: 'User comments "BOOK" on your Post',
      dm: 'Hi Mark! 🚀 I\'d love to help you schedule your 1-on-1 strategy call with our team. What date works best for you this week?',
      qualification: 'Intent: Consultation Request • Tag: #coaching_lead',
      crmAction: 'Lead "Mark Davis" qualified & Calendly link dispatched',
    },
    INFO: {
      trigger: 'User mentions your handle in a Story',
      dm: 'Thank you so much for the shoutout! 💖 Here is your exclusive 15% VIP discount code for your next order: VIP15. Enjoy!',
      qualification: 'Intent: Brand Advocate • Tag: #story_mention',
      crmAction: 'Lead "Elena Rostova" tagged as Brand Advocate',
    },
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-violet-500 selection:text-white overflow-x-hidden">
      {/* Top Announcement Bar */}
      <div className="bg-gradient-to-r from-violet-700 via-purple-600 to-indigo-700 text-white text-xs py-2 px-4 text-center font-medium flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5 animate-pulse" />
        <span>AutoDM 2.0 Released: Autonomous AI Customer Agents & Meta Graph API v20.0 Compliant</span>
        <Link href="/signup" className="underline font-bold hover:text-slate-200 ml-1">
          Try Free &rarr;
        </Link>
      </div>

      {/* Main Navigation Header */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-violet-600 to-purple-600 text-white shadow-xl shadow-violet-600/30 group-hover:scale-105 transition-transform">
              <Send className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black text-white tracking-tight leading-none">AutoDM</span>
              <span className="text-[10px] text-violet-400 font-bold uppercase tracking-wider mt-0.5">AI Platform</span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-300">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#builder" className="hover:text-white transition-colors">AI Builder</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </nav>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-3">
            <Link
              href="/app"
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-bold text-slate-200 hover:text-white transition-all shadow-sm"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-violet-400" />
              <span>Launch App</span>
            </Link>

            <Link
              href="/login"
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition-colors"
            >
              Login
            </Link>

            <Link
              href="/signup"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-violet-600/30 transition-all hover:scale-[1.02] flex items-center gap-1.5"
            >
              <span>Start Free</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-20 pb-28 px-6 overflow-hidden">
        {/* Glowing Orbs Background */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-violet-600/20 rounded-full blur-[160px] pointer-events-none" />
        <div className="absolute top-1/2 right-10 w-[450px] h-[450px] bg-purple-600/15 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center space-y-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-950/80 border border-violet-800/50 text-violet-300 text-xs font-bold shadow-inner">
            <Camera className="w-4 h-4 text-pink-400" />
            <span>Official Meta Graph API Integration</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-[1.1]">
            Turn Conversations Into Customers with{' '}
            <span className="bg-gradient-to-r from-violet-400 via-purple-300 to-indigo-400 bg-clip-text text-transparent">
              AI Automation.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed font-medium">
            AutoDM automates Instagram conversations, comments, DMs, lead qualification, follow-ups and customer support with intelligent AI workflows.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/signup"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-2xl shadow-violet-600/40 hover:scale-105 transition-all flex items-center justify-center gap-3 group"
            >
              <span>Start Free Trial</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <a
              href="#how-it-works"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white font-bold text-sm transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 text-violet-400 fill-violet-400" />
              <span>See How It Works</span>
            </a>
          </div>

          {/* Key Feature Pills */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-semibold">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>No Password Needed</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Meta Graph API Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Setup in 3 Minutes</span>
            </div>
          </div>
        </div>

        {/* HERO INTERACTIVE PRODUCT VISUAL SHOWCASE */}
        <div className="max-w-6xl mx-auto mt-16 z-10 relative">
          <div className="p-1 rounded-3xl bg-gradient-to-b from-slate-700/50 via-slate-800/40 to-slate-950 shadow-2xl shadow-violet-950/40">
            <div className="bg-slate-950 rounded-[22px] p-6 sm:p-8 border border-slate-800/80 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  </div>
                  <span className="text-xs font-mono text-slate-400">Live AI Conversation & Lead Capture Engine</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Real-time Active</span>
                </div>
              </div>

              {/* Interactive Trigger Selector */}
              <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
                <span className="text-xs font-bold text-slate-300">Select Sample Keyword Trigger:</span>
                <div className="flex gap-2">
                  {(['PRICE', 'BOOK', 'INFO'] as const).map((keyword) => (
                    <button
                      key={keyword}
                      onClick={() => setSelectedFlowTrigger(keyword)}
                      className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        selectedFlowTrigger === keyword
                          ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                          : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                      }`}
                    >
                      Comment &quot;{keyword}&quot;
                    </button>
                  ))}
                </div>
              </div>

              {/* Interactive Flow Visual Columns */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Step 1: Instagram Trigger */}
                <div className="bg-slate-900/70 rounded-2xl p-5 border border-slate-800/80 space-y-3">
                  <div className="flex items-center gap-2 text-pink-400 text-xs font-bold">
                    <Camera className="w-4 h-4" />
                    <span>1. Instagram Comment Event</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                    <span className="text-slate-400 font-bold block">@sarah_jenkins_</span>
                    <p className="text-slate-200">{flowScenarios[selectedFlowTrigger].trigger}</p>
                  </div>
                </div>

                {/* Step 2: Auto DM & AI Conversation */}
                <div className="bg-slate-900/70 rounded-2xl p-5 border border-slate-800/80 space-y-3">
                  <div className="flex items-center gap-2 text-purple-400 text-xs font-bold">
                    <Bot className="w-4 h-4" />
                    <span>2. AI Intent & Automated DM</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
                    <p className="text-slate-200 leading-relaxed">{flowScenarios[selectedFlowTrigger].dm}</p>
                    <span className="text-[10px] text-violet-400 font-bold block">{flowScenarios[selectedFlowTrigger].qualification}</span>
                  </div>
                </div>

                {/* Step 3: CRM Lead Created */}
                <div className="bg-slate-900/70 rounded-2xl p-5 border border-slate-800/80 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                    <Users className="w-4 h-4" />
                    <span>3. CRM & Sales Notification</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-emerald-500/20 text-xs space-y-2">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{flowScenarios[selectedFlowTrigger].crmAction}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block">Synced to AutoDM CRM & Team Webhook</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PLATFORM COMPLIANCE BANNER */}
      <section className="py-10 border-y border-slate-800/80 bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap items-center justify-around gap-8 text-center">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            <div className="text-left">
              <span className="block text-xs font-bold text-white uppercase tracking-wider">Built with official Meta APIs</span>
              <span className="text-[11px] text-slate-400">100% Official Graph Webhook Architecture</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Lock className="w-6 h-6 text-violet-400" />
            <div className="text-left">
              <span className="block text-xs font-bold text-white uppercase tracking-wider">Passwordless OAuth</span>
              <span className="text-[11px] text-slate-400">Never share your Instagram login credentials</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Cpu className="w-6 h-6 text-cyan-400" />
            <div className="text-left">
              <span className="block text-xs font-bold text-white uppercase tracking-wider">Autonomous AI Engine</span>
              <span className="text-[11px] text-slate-400">Custom business knowledge & voice guardrails</span>
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEM VS SOLUTION SECTION */}
      <section id="features" className="py-24 px-6 max-w-7xl mx-auto space-y-16">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <h2 className="text-xs font-extrabold text-violet-400 uppercase tracking-widest">Why AutoDM</h2>
          <p className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Stop Losing Sales To Delayed Replies & Manual DMs
          </p>
          <p className="text-xs sm:text-sm text-slate-400">
            Instagram users expect immediate responses. Manual DM replies lead to missed opportunities, low conversion rates, and burnt-out support teams.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Problem Card */}
          <div className="bg-red-950/20 border border-red-900/40 rounded-3xl p-8 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold">
              <span>The Old Manual Way</span>
            </div>
            <ul className="space-y-4 text-xs sm:text-sm text-slate-300">
              <li className="flex items-start gap-3">
                <span className="p-1 rounded-lg bg-red-500/20 text-red-400 font-bold">✕</span>
                <span>Missed DMs while sleeping or away from your phone</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="p-1 rounded-lg bg-red-500/20 text-red-400 font-bold">✕</span>
                <span>Average 4 to 12 hour reply delays killing customer interest</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="p-1 rounded-lg bg-red-500/20 text-red-400 font-bold">✕</span>
                <span>Repetitive copy-pasting of price links and catalog details</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="p-1 rounded-lg bg-red-500/20 text-red-400 font-bold">✕</span>
                <span>Zero lead scoring or organized CRM contact records</span>
              </li>
            </ul>
          </div>

          {/* Solution Card */}
          <div className="bg-emerald-950/20 border border-emerald-900/40 rounded-3xl p-8 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
              <span>The AutoDM AI Way</span>
            </div>
            <ul className="space-y-4 text-xs sm:text-sm text-slate-300">
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>Sub-second automated DM responses 24 hours a day, 7 days a week</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>AI intent recognition for complex inquiries and FAQ support</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>Automated lead qualification, email capture & checkout links</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>Unified Social Inbox & instant team notifications for qualified leads</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* AI WORKFLOW BUILDER SHOWCASE SECTION */}
      <section id="builder" className="py-24 px-6 bg-slate-900/30 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-bold">
              <Zap className="w-3.5 h-3.5" />
              <span>No-Code AI Builder</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Build Powerful Visual Automation Workflows
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Design complex comment-to-DM triggers, AI keyword branches, drip sequences, and webhook actions visually. Drag, drop, and publish in seconds.
            </p>

            <div className="space-y-4 text-xs text-slate-300">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="p-2 rounded-lg bg-violet-600/20 text-violet-400 font-bold">1</div>
                <div>
                  <span className="font-bold text-white block">Comment & Mention Triggers</span>
                  <span className="text-slate-400">Trigger flows when users comment specific keywords on Posts, Reels, or Live streams.</span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="p-2 rounded-lg bg-purple-600/20 text-purple-400 font-bold">2</div>
                <div>
                  <span className="font-bold text-white block">AI Agent Intent Branching</span>
                  <span className="text-slate-400">Let AI evaluate customer sentiment and route conversations to direct purchase links or support reps.</span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400 font-bold">3</div>
                <div>
                  <span className="font-bold text-white block">Automated Lead Scoring</span>
                  <span className="text-slate-400">Automatically tag leads as Hot, Warm, or Cold based on their conversation intent.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Visual Mockup Card */}
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-violet-400" />
                Workflow Canvas: Comment &quot;PRICE&quot; &rarr; Lead Qualification
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">Published</span>
            </div>

            {/* Workflow Node Mockups */}
            <div className="space-y-4 py-2">
              <div className="p-4 rounded-xl bg-slate-950 border border-violet-500/30 text-xs flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-pink-500/20 text-pink-400">
                    <Camera className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white block">Trigger: Comment Keyword</span>
                    <span className="text-slate-400">Matches: &quot;PRICE&quot;, &quot;COST&quot;, &quot;BUY&quot;</span>
                  </div>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>

              <div className="h-4 w-0.5 bg-violet-600 mx-auto" />

              <div className="p-4 rounded-xl bg-slate-950 border border-purple-500/30 text-xs flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white block">Action: Send AI DM & Qualify</span>
                    <span className="text-slate-400">Prompt: Product catalog & 15% discount code</span>
                  </div>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>

              <div className="h-4 w-0.5 bg-purple-600 mx-auto" />

              <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30 text-xs flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white block">Action: Create Lead & Notify Team</span>
                    <span className="text-slate-400">Set Score: 90 • Tag: #hot_prospect</span>
                  </div>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE DEEP-DIVE GRID (INBOX, CRM, ANALYTICS, AI AGENT, AGENCY) */}
      <section className="py-20 px-6 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <h2 className="text-xs font-extrabold text-violet-400 uppercase tracking-widest">Platform Capabilities</h2>
          <p className="text-3xl font-black text-white tracking-tight">Everything You Need to Scale Instagram Sales</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1: AI Customer Agent */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 w-fit">
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Autonomous AI Customer Agent</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Upload your website, FAQs, or product catalog into AI Studio. Your agent answers business questions 24/7 in your exact brand voice.
            </p>
          </div>

          {/* Card 2: Unified Social Inbox */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400 w-fit">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Unified Social Inbox</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              View and respond to all Instagram comments, DMs, and story mentions in a single high-speed inbox with human takeover options.
            </p>
          </div>

          {/* Card 3: Built-in CRM & Lead Qualification */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 w-fit">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">CRM & Lead Qualification</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Automatically build rich contact profiles. Score leads based on intent, capture emails/phone numbers, and trigger webhook notifications.
            </p>
          </div>

          {/* Card 4: Conversion & Content Analytics */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 w-fit">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Conversion & Analytics</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Track comment-to-DM conversion rates, workflow engagement, AI token efficiency, and lead pipeline growth in real-time.
            </p>
          </div>

          {/* Card 5: Agency & Multi-Workspace Control */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="p-3 rounded-2xl bg-violet-500/10 text-violet-400 w-fit">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Agency & Multi-Workspace Control</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Manage multiple client Instagram accounts, assign granular team permission roles, and generate white-label performance reports.
            </p>
          </div>

          {/* Card 6: 100% Meta Graph API Compliant */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="p-3 rounded-2xl bg-pink-500/10 text-pink-400 w-fit">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Meta Graph API Compliant</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Built on official Meta Graph Webhooks and Messaging APIs. Zero password sharing required, maintaining 100% account safety.
            </p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section id="how-it-works" className="py-24 px-6 max-w-7xl mx-auto space-y-16">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <h2 className="text-xs font-extrabold text-violet-400 uppercase tracking-widest">Simple 3-Step Setup</h2>
          <p className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Launch Your First AI Automation in 3 Easy Steps
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 space-y-4 relative">
            <span className="text-4xl font-black text-violet-500/30">01</span>
            <h3 className="text-lg font-bold text-white">Connect Instagram</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Connect your Instagram Professional or Creator account in 1-click via official Meta OAuth authorization.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 space-y-4 relative">
            <span className="text-4xl font-black text-purple-500/30">02</span>
            <h3 className="text-lg font-bold text-white">Select AI Workflow</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Choose from pre-built high-converting templates or customize your own AI comment-to-DM triggers.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 space-y-4 relative">
            <span className="text-4xl font-black text-emerald-500/30">03</span>
            <h3 className="text-lg font-bold text-white">Automate & Scale</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Watch comments instantly turn into DMs, qualified leads, and direct online sales on autopilot.
            </p>
          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing" className="py-24 px-6 bg-slate-900/30 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <h2 className="text-xs font-extrabold text-violet-400 uppercase tracking-widest">Transparent Pricing</h2>
            <p className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Flexible Plans for Creators, Businesses & Agencies
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Starter Plan */}
            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-8 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white">Starter</h3>
                <p className="text-xs text-slate-400 mt-1">Perfect for solo creators getting started</p>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-white">$0</span>
                <span className="text-xs text-slate-400">/ forever free</span>
              </div>
              <ul className="space-y-3 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>1 Connected Instagram Account</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>500 Automated DMs / month</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Basic Keyword Triggers</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Unified Social Inbox</span>
                </li>
              </ul>
              <Link
                href="/signup"
                className="w-full block text-center py-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-bold text-white transition-colors"
              >
                Get Started Free
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="bg-slate-900 border-2 border-violet-500 rounded-3xl p-8 space-y-6 relative shadow-2xl shadow-violet-950/50">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 text-white text-[10px] font-black uppercase tracking-wider">
                Most Popular
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Pro Growth</h3>
                <p className="text-xs text-slate-400 mt-1">For growing brands & e-commerce stores</p>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-white">$29</span>
                <span className="text-xs text-slate-400">/ month</span>
              </div>
              <ul className="space-y-3 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>3 Connected Instagram Accounts</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>10,000 Automated DMs / month</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Visual AI Workflow Builder</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Autonomous AI Customer Agent</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>CRM & Lead Scoring</span>
                </li>
              </ul>
              <Link
                href="/signup"
                className="w-full block text-center py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-xs font-bold text-white shadow-lg shadow-violet-600/30 hover:scale-[1.02] transition-all"
              >
                Start 14-Day Free Trial
              </Link>
            </div>

            {/* Agency Plan */}
            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-8 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white">Agency Scale</h3>
                <p className="text-xs text-slate-400 mt-1">For marketing agencies & high-volume teams</p>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-white">$79</span>
                <span className="text-xs text-slate-400">/ month</span>
              </div>
              <ul className="space-y-3 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>10+ Connected Instagram Accounts</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>50,000 Automated DMs / month</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Multi-Workspace Management</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Custom AI Knowledge Base</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Priority 24/7 Dedicated Support</span>
                </li>
              </ul>
              <Link
                href="/signup"
                className="w-full block text-center py-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-bold text-white transition-colors"
              >
                Scale Your Agency
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ ACCORDION SECTION */}
      <section id="faq" className="py-24 px-6 max-w-4xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-xs font-extrabold text-violet-400 uppercase tracking-widest">Frequently Asked Questions</h2>
          <p className="text-3xl font-black text-white tracking-tight">Everything You Need to Know</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden transition-all"
            >
              <button
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                className="w-full p-5 text-left font-bold text-xs sm:text-sm text-white flex items-center justify-between gap-4"
              >
                <span>{faq.q}</span>
                {activeFaq === idx ? (
                  <ChevronUp className="w-4 h-4 text-violet-400 shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                )}
              </button>
              {activeFaq === idx && (
                <div className="px-5 pb-5 text-xs text-slate-300 leading-relaxed border-t border-slate-800/80 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA SECTION */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <div className="rounded-3xl bg-gradient-to-r from-violet-900 via-purple-900 to-indigo-900 border border-violet-700/50 p-10 sm:p-16 text-center space-y-6 relative overflow-hidden shadow-2xl">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-600/30 rounded-full blur-[100px] pointer-events-none" />

          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight relative z-10">
            Ready to Automate Your Instagram & Scale Your Sales?
          </h2>
          <p className="text-xs sm:text-sm text-slate-200 max-w-2xl mx-auto relative z-10">
            Turn Instagram comments into qualified leads and direct sales with AutoDM.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
            <Link
              href="/signup"
              className="px-8 py-4 rounded-2xl bg-white text-slate-950 font-black text-xs shadow-2xl hover:scale-105 transition-all"
            >
              Start Free Trial Now
            </Link>
            <Link
              href="/app"
              className="px-8 py-4 rounded-2xl bg-slate-950/80 border border-slate-700 text-white font-bold text-xs hover:border-slate-500 transition-all"
            >
              Open Application Dashboard &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-800/80 py-12 px-6 bg-slate-950 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-violet-600 text-white">
                <Send className="w-4 h-4" />
              </div>
              <span className="text-sm font-extrabold text-white">AutoDM</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Enterprise Instagram AI Automation & Marketing Platform. Meta Graph API Compliant.
            </p>
          </div>

          <div>
            <span className="text-xs font-bold text-white uppercase tracking-wider block mb-3">Product</span>
            <ul className="space-y-2 text-[11px]">
              <li><a href="#features" className="hover:text-white">Features</a></li>
              <li><a href="#builder" className="hover:text-white">Workflow Builder</a></li>
              <li><a href="#pricing" className="hover:text-white">Pricing</a></li>
              <li><Link href="/app" className="text-violet-400 hover:text-violet-300 font-bold">App Dashboard</Link></li>
            </ul>
          </div>

          <div>
            <span className="text-xs font-bold text-white uppercase tracking-wider block mb-3">Resources</span>
            <ul className="space-y-2 text-[11px]">
              <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white">Terms of Service</Link></li>
              <li><a href="#faq" className="hover:text-white">FAQ</a></li>
            </ul>
          </div>

          <div>
            <span className="text-xs font-bold text-white uppercase tracking-wider block mb-3">Platform</span>
            <ul className="space-y-2 text-[11px]">
              <li><Link href="/login" className="hover:text-white">Customer Login</Link></li>
              <li><Link href="/signup" className="hover:text-white">Sign Up Free</Link></li>
              <li><Link href="/admin" className="hover:text-amber-400 font-bold">Super Admin</Link></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 border-t border-slate-900 flex flex-wrap items-center justify-between gap-4 text-[11px]">
          <span>&copy; 2026 AutoDM Platform. Meta Graph API Authorized Application.</span>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/terms" className="hover:text-white">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
