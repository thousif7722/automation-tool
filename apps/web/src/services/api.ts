const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export async function fetchAPI<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('admin_token') || localStorage.getItem('autodm_token') || localStorage.getItem('token')
      : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const err: any = new Error(errorData.error?.message || errorData.message || `API error (${response.status})`);
      err.status = response.status;
      err.data = errorData;
      throw err;
    }

    return await response.json();
  } catch (err: any) {
    console.warn(`[API Client Warning] ${endpoint} fetch failed:`, err.message);
    throw err;
  }
}

export const api = {
  // Analytics
  getAnalytics: () => fetchAPI<{ success: boolean; analytics: any }>('/analytics'),

  // Workflows
  getWorkflows: () => fetchAPI<{ success: boolean; data: any[]; count: number }>('/workflows'),
  getWorkflow: (id: string) => fetchAPI<{ success: boolean; data: any }>(`/workflows/${id}`),
  createWorkflow: (data: any) => fetchAPI<{ success: boolean; message: string; data: any }>('/workflows', { method: 'POST', body: JSON.stringify(data) }),
  updateWorkflow: (id: string, data: any) => fetchAPI<{ success: boolean; message: string; data: any }>(`/workflows/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  activateWorkflow: (id: string) => fetchAPI<{ success: boolean; message: string; data: any }>(`/workflows/${id}/activate`, { method: 'POST' }),
  pauseWorkflow: (id: string) => fetchAPI<{ success: boolean; message: string; data: any }>(`/workflows/${id}/pause`, { method: 'POST' }),
  testWorkflow: (id: string) => fetchAPI<{ success: boolean; trace: any; isTestMode: boolean }>(`/workflows/${id}/test`, { method: 'POST' }),
  generateAIWorkflow: (prompt: string) => fetchAPI<{ success: boolean; message: string; workflow: any }>('/workflows/generate-ai', { method: 'POST', body: JSON.stringify({ prompt }) }),

  // Messages & Inbox
  getConversations: () => fetchAPI<{ success: boolean; data: any[]; count: number }>('/messages/conversations'),
  getConversation: (id: string) => fetchAPI<{ success: boolean; data: any }>(`/messages/conversations/${id}`),
  replyToConversation: (id: string, content: string) => fetchAPI<{ success: boolean; message: any }>(`/messages/conversations/${id}/reply`, { method: 'POST', body: JSON.stringify({ content }) }),
  takeoverConversation: (id: string) => fetchAPI<{ success: boolean; message: string; aiStatus: string }>(`/messages/conversations/${id}/takeover`, { method: 'POST' }),
  returnToAIConversation: (id: string) => fetchAPI<{ success: boolean; message: string; aiStatus: string }>(`/messages/conversations/${id}/return-to-ai`, { method: 'POST' }),

  // Leads & CRM
  getLeads: (status?: string) => fetchAPI<{ success: boolean; data: any[]; count: number }>(`/leads${status ? `?status=${status}` : ''}`),
  createLead: (data: any) => fetchAPI<{ success: boolean; message: string; data: any }>('/leads', { method: 'POST', body: JSON.stringify(data) }),
  updateLeadStage: (id: string, status: string) => fetchAPI<{ success: boolean; message: string; data: any }>(`/leads/${id}/stage`, { method: 'PUT', body: JSON.stringify({ status }) }),
  getCustomers: () => fetchAPI<{ success: boolean; data: any[]; count: number }>('/customers'),

  // Instagram Accounts
  getInstagramAccounts: () => fetchAPI<{ success: boolean; data: any[] }>('/instagram/accounts'),
  getInstagramOAuthUrl: () => fetchAPI<{ success: boolean; url: string }>('/instagram/oauth/url'),
  getInstagramHealth: (instagramUserId: string) => fetchAPI<{ success: boolean; health: any }>(`/instagram/health/${instagramUserId}`, { method: 'POST' }),

  // AI & Knowledge
  getAIConfig: () => fetchAPI<{ success: boolean; config: any }>('/ai/config'),
  updateAIConfig: (data: any) => fetchAPI<{ success: boolean; message: string; config: any }>('/ai/config', { method: 'PUT', body: JSON.stringify(data) }),
  getKnowledge: () => fetchAPI<{ success: boolean; data: any[]; count: number }>('/ai/knowledge'),
  addKnowledge: (data: any) => fetchAPI<{ success: boolean; message: string; data: any }>('/ai/knowledge', { method: 'POST', body: JSON.stringify(data) }),
  askAI: (question: string) => fetchAPI<{ success: boolean; question: string; answer: string; confidence: number }>('/ai/ask', { method: 'POST', body: JSON.stringify({ question }) }),

  // Content
  getContentDrafts: () => fetchAPI<{ success: boolean; data: any[]; count: number }>('/content/drafts'),

  // Workspace & Team
  getCurrentWorkspace: () => fetchAPI<{ success: boolean; workspace: any }>('/workspaces/current'),
  getMembers: () => fetchAPI<{ success: boolean; members: any[]; count: number }>('/workspaces/current/members'),
  inviteMember: (email: string, role: string) => fetchAPI<{ success: boolean; message: string }>('/workspaces/current/members/invite', { method: 'POST', body: JSON.stringify({ email, role }) }),
};
