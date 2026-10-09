'use client';

import React, { useState, useEffect } from 'react';
import {
  Home,
  Zap,
  MessageSquare,
  Users,
  Camera,
  Bot,
  Calendar,
  BarChart3,
  UserPlus,
  Sliders,
  Send,
  Sparkles,
  ChevronDown,
  Menu,
  X,
  Building2,
  Check,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  RefreshCw,
} from 'lucide-react';
import { HomeTab } from './tabs/HomeTab';
import { AutomationTab } from './tabs/AutomationTab';
import { InboxTab } from './tabs/InboxTab';
import { ContactsTab } from './tabs/ContactsTab';
import { InstagramTab } from './tabs/InstagramTab';
import { AITab } from './tabs/AITab';
import { ContentTab } from './tabs/ContentTab';
import { AnalyticsTab } from './tabs/AnalyticsTab';
import { TeamTab } from './tabs/TeamTab';
import { SettingsTab } from './tabs/SettingsTab';
import { api } from '../services/api';

export type MainTabType =
  | 'HOME'
  | 'AUTOMATION'
  | 'INBOX'
  | 'CONTACTS'
  | 'INSTAGRAM'
  | 'AI'
  | 'CONTENT'
  | 'ANALYTICS'
  | 'TEAM'
  | 'SETTINGS';

export type AutomationSubTabType = 'MY_AUTOMATIONS' | 'BASIC' | 'KEYWORDS' | 'SEQUENCES' | 'RULES';

export const MainLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<MainTabType>('HOME');
  const [automationSubTab, setAutomationSubTab] = useState<AutomationSubTabType>('MY_AUTOMATIONS');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const [conversationCount, setConversationCount] = useState<number | null>(null);

  // Authentication & Session state
  const [loadingUser, setLoadingUser] = useState(true);
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [userWorkspaces, setUserWorkspaces] = useState<any[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<any | null>(null);

  useEffect(() => {
    async function initSession() {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        window.location.href = '/login';
        return;
      }

      try {
        const res = await api.getCurrentUser();
        if (res.success && res.user) {
          setCurrentUser(res.user);
          const wsList = res.workspaces || [];
          setUserWorkspaces(wsList);

          const savedWsId = localStorage.getItem('active_workspace_id');
          const primaryWs = wsList.find((w: any) => w.id === savedWsId) || wsList[0] || {
            id: 'ws_default',
            name: `${res.user.name}'s Workspace`,
            type: 'Primary Account',
          };
          setActiveWorkspace(primaryWs);
          if (primaryWs?.id) {
            localStorage.setItem('active_workspace_id', primaryWs.id);
          }
          setLoadingUser(false);
        } else {
          throw new Error('Invalid user session');
        }
      } catch (err: any) {
        console.warn('Session verification failed:', err.message);
        localStorage.removeItem('token');
        localStorage.removeItem('active_workspace_id');
        window.location.href = '/login';
      }
    }

    initSession();
  }, []);

  useEffect(() => {
    if (!loadingUser) {
      api.getConversations()
        .then((res) => setConversationCount(res.count || (res.data ? res.data.length : 0)))
        .catch(() => setConversationCount(0));
    }
  }, [loadingUser]);

  const handleLogout = async () => {
    try {
      await api.logout().catch(() => {});
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user_id');
      localStorage.removeItem('active_workspace_id');
      window.location.href = '/login';
    }
  };

  const handleSelectWorkspace = (ws: any) => {
    setActiveWorkspace(ws);
    if (ws?.id) {
      localStorage.setItem('active_workspace_id', ws.id);
    }
    setWorkspaceMenuOpen(false);
  };

  const handleNavClick = (tabId: MainTabType, subTab?: AutomationSubTabType) => {
    setActiveTab(tabId);
    if (subTab) setAutomationSubTab(subTab);
    setMobileOpen(false);
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4 text-slate-100 font-sans">
        <div className="p-3 rounded-2xl bg-gradient-to-tr from-violet-600 to-purple-600 text-white shadow-xl shadow-violet-600/30 animate-pulse">
          <Send className="w-8 h-8" />
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
          <RefreshCw className="w-4 h-4 animate-spin text-violet-400" />
          <span>Verifying authentication & restoring workspace...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans select-none overflow-x-hidden">
      {/* Mobile Top Bar */}
      <header className="lg:hidden h-14 bg-slate-950/95 border-b border-slate-800 px-4 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md w-full">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-gradient-to-tr from-violet-600 to-purple-600 text-white">
            <Send className="w-4 h-4" />
          </div>
          <span className="text-sm font-extrabold text-white tracking-tight">AutoDM OS</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg bg-slate-900 text-slate-300 border border-slate-800"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Professional Left Sidebar Navigation */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen bg-slate-950 border-r border-slate-800/80 flex flex-col justify-between z-50 transition-all duration-300 ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Top Branding & Workspace Selector */}
        <div className="p-3 border-b border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between px-1">
            {!isCollapsed && (
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-gradient-to-tr from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-600/30">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-sm font-extrabold text-white tracking-tight block leading-none">AutoDM OS</span>
                  <span className="text-[10px] text-violet-400 font-semibold block mt-0.5 tracking-wider uppercase">AI Automation SaaS</span>
                </div>
              </div>
            )}
            {isCollapsed && (
              <div className="p-2 rounded-xl bg-gradient-to-tr from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-600/30 mx-auto">
                <Send className="w-4 h-4" />
              </div>
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
              title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {isCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>
          </div>

          {/* Workspace Switcher Selector */}
          <div className="relative">
            <button
              onClick={() => setWorkspaceMenuOpen(!workspaceMenuOpen)}
              className={`w-full bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-xl px-3 py-2 text-xs flex items-center justify-between transition-all ${
                isCollapsed ? 'justify-center px-1' : ''
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                {!isCollapsed && <span className="font-bold text-slate-200 truncate">{activeWorkspace?.name || 'My Workspace'}</span>}
              </div>
              {!isCollapsed && <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
            </button>

            {/* Workspace Dropdown Popover */}
            {workspaceMenuOpen && !isCollapsed && (
              <div className="absolute top-12 left-0 right-0 bg-slate-900 border border-slate-800 rounded-xl p-2 shadow-2xl z-50 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 block py-1">Workspaces</span>
                {userWorkspaces.length > 0 ? (
                  userWorkspaces.map((ws) => (
                    <button
                      key={ws.id}
                      onClick={() => handleSelectWorkspace(ws)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between hover:bg-slate-800 ${
                        activeWorkspace?.id === ws.id ? 'bg-violet-600/20 text-violet-300 font-semibold' : 'text-slate-300'
                      }`}
                    >
                      <div className="truncate">
                        <span className="block truncate font-medium">{ws.name}</span>
                        <span className="text-[10px] text-slate-400 block">{ws.plan || 'Workspace'}</span>
                      </div>
                      {activeWorkspace?.id === ws.id && <Check className="w-3.5 h-3.5 text-violet-400 shrink-0" />}
                    </button>
                  ))
                ) : (
                  <button
                    onClick={() => setWorkspaceMenuOpen(false)}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-slate-800"
                  >
                    {activeWorkspace?.name || 'Default Workspace'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Navigation Items List */}
        <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-1 custom-scrollbar">
          {/* Home */}
          <button
            onClick={() => handleNavClick('HOME')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'HOME'
                ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md shadow-violet-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            } ${isCollapsed ? 'justify-center px-0' : ''}`}
            title="Home Command Center"
          >
            <Home className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>Home</span>}
          </button>

          {/* Inbox with Badge */}
          <button
            onClick={() => handleNavClick('INBOX')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'INBOX'
                ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md shadow-violet-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            } ${isCollapsed ? 'justify-center px-0' : ''}`}
            title="Inbox"
          >
            <div className="flex items-center gap-3">
              <MessageSquare className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span>Inbox</span>}
            </div>
            {!isCollapsed && (conversationCount !== null && conversationCount > 0) && (
              <span className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 text-[10px] font-bold border border-violet-500/30">
                {conversationCount}
              </span>
            )}
          </button>

          {/* Contacts */}
          <button
            onClick={() => handleNavClick('CONTACTS')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'CONTACTS'
                ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md shadow-violet-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            } ${isCollapsed ? 'justify-center px-0' : ''}`}
            title="Contacts CRM"
          >
            <Users className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>Contacts</span>}
          </button>

          {/* Automation Sub-Navigation Group */}
          <div>
            <button
              onClick={() => handleNavClick('AUTOMATION', 'MY_AUTOMATIONS')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'AUTOMATION'
                  ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md shadow-violet-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              } ${isCollapsed ? 'justify-center px-0' : ''}`}
              title="Automation Center"
            >
              <div className="flex items-center gap-3">
                <Zap className="w-4 h-4 shrink-0 text-amber-400" />
                {!isCollapsed && <span>Automation</span>}
              </div>
              {!isCollapsed && <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${activeTab === 'AUTOMATION' ? 'rotate-180' : ''}`} />}
            </button>

            {/* Sub-items for Automation */}
            {activeTab === 'AUTOMATION' && !isCollapsed && (
              <div className="ml-7 mt-1 border-l border-slate-800 pl-3 space-y-1">
                {[
                  { id: 'MY_AUTOMATIONS', label: 'My Automations' },
                  { id: 'BASIC', label: 'Basic Automations' },
                  { id: 'KEYWORDS', label: 'Keywords Trigger' },
                  { id: 'SEQUENCES', label: 'Drip Sequences' },
                  { id: 'RULES', label: 'Smart Rules' },
                ].map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => handleNavClick('AUTOMATION', sub.id as AutomationSubTabType)}
                    className={`w-full text-left py-1 px-2 rounded-lg text-xs font-medium transition-colors ${
                      automationSubTab === sub.id
                        ? 'text-violet-400 font-bold bg-violet-500/10'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
                    }`}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Instagram Channel */}
          <button
            onClick={() => handleNavClick('INSTAGRAM')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'INSTAGRAM'
                ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md shadow-violet-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            } ${isCollapsed ? 'justify-center px-0' : ''}`}
            title="Instagram Channel Center"
          >
            <Camera className="w-4 h-4 shrink-0 text-pink-400" />
            {!isCollapsed && <span>Instagram</span>}
          </button>

          {/* AI Studio */}
          <button
            onClick={() => handleNavClick('AI')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'AI'
                ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md shadow-violet-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            } ${isCollapsed ? 'justify-center px-0' : ''}`}
            title="AI Studio & Agents"
          >
            <div className="flex items-center gap-3">
              <Bot className="w-4 h-4 shrink-0 text-cyan-400" />
              {!isCollapsed && <span>AI Studio</span>}
            </div>
            {!isCollapsed && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                PRO
              </span>
            )}
          </button>

          {/* Content */}
          <button
            onClick={() => handleNavClick('CONTENT')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'CONTENT'
                ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md shadow-violet-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            } ${isCollapsed ? 'justify-center px-0' : ''}`}
            title="Content Planner"
          >
            <Calendar className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>Content</span>}
          </button>

          {/* Analytics */}
          <button
            onClick={() => handleNavClick('ANALYTICS')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'ANALYTICS'
                ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md shadow-violet-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            } ${isCollapsed ? 'justify-center px-0' : ''}`}
            title="Analytics"
          >
            <BarChart3 className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>Analytics</span>}
          </button>

          {/* Team */}
          <button
            onClick={() => handleNavClick('TEAM')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'TEAM'
                ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md shadow-violet-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            } ${isCollapsed ? 'justify-center px-0' : ''}`}
            title="Team & Permissions"
          >
            <UserPlus className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>Team</span>}
          </button>

          {/* Settings */}
          <button
            onClick={() => handleNavClick('SETTINGS')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'SETTINGS'
                ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md shadow-violet-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            } ${isCollapsed ? 'justify-center px-0' : ''}`}
            title="Settings"
          >
            <Sliders className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>Settings</span>}
          </button>
        </nav>

        {/* Footer User Profile & Logout Action */}
        <div className="p-3 border-t border-slate-800/80 space-y-2">
          {!isCollapsed ? (
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <div className="flex items-center gap-2 truncate">
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center font-bold text-xs text-white shrink-0">
                  {(currentUser?.name || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="truncate">
                  <span className="block text-xs font-bold text-white truncate">{currentUser?.name || 'User'}</span>
                  <span className="block text-[10px] text-slate-400 truncate">{currentUser?.email || ''}</span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-red-400 transition-colors shrink-0"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-1">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center font-bold text-xs text-white">
                {(currentUser?.name || 'U').charAt(0).toUpperCase()}
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-red-400 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main View Area */}
      <main className="flex-1 min-w-0 bg-slate-950 overflow-y-auto min-h-screen">
        {activeTab === 'HOME' && <HomeTab />}
        {activeTab === 'AUTOMATION' && <AutomationTab initialSubTab={automationSubTab} />}
        {activeTab === 'INBOX' && <InboxTab />}
        {activeTab === 'CONTACTS' && <ContactsTab />}
        {activeTab === 'INSTAGRAM' && <InstagramTab />}
        {activeTab === 'AI' && <AITab />}
        {activeTab === 'CONTENT' && <ContentTab />}
        {activeTab === 'ANALYTICS' && <AnalyticsTab />}
        {activeTab === 'TEAM' && <TeamTab />}
        {activeTab === 'SETTINGS' && <SettingsTab />}
      </main>
    </div>
  );
};
