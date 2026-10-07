export interface ExecutionContext {
  customer: {
    id: string;
    username: string;
    tags: string[];
    score: number;
    location?: string;
  };
  conversation: {
    id: string;
    channel: string;
    lastMessage?: string;
  };
  comment: {
    id: string;
    text: string;
    mediaId?: string;
  };
  account: {
    id: string;
    username: string;
  };
  workflow: {
    runId: string;
    workflowKey: string;
    version: number;
    name: string;
  };
  custom: Record<string, any>;
}

export function createInitialContext(event: any, workflowInfo?: any): ExecutionContext {
  return {
    customer: {
      id: event?.actor?.id || 'usr_simulated',
      username: event?.actor?.username || 'instagram_user',
      tags: [],
      score: 0,
      location: event?.metadata?.location || 'Unknown',
    },
    conversation: {
      id: `conv_${event?.id || Date.now()}`,
      channel: 'INSTAGRAM',
      lastMessage: event?.payload?.text || '',
    },
    comment: {
      id: event?.resource?.id || event?.payload?.commentId || 'cmt_simulated',
      text: event?.payload?.text || event?.payload?.commentText || '',
      mediaId: event?.payload?.mediaId || 'media_123',
    },
    account: {
      id: event?.accountId || 'acc_simulated',
      username: 'business_account',
    },
    workflow: {
      runId: `run_${Date.now()}`,
      workflowKey: workflowInfo?.workflowKey || 'wf_simulated',
      version: workflowInfo?.version || 1,
      name: workflowInfo?.name || 'Simulated Workflow',
    },
    custom: { ...workflowInfo?.variables },
  };
}

export function resolveTemplateVariables(template: string, context: ExecutionContext): string {
  if (!template || typeof template !== 'string') return '';

  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, path) => {
    const value = getNestedValue(context, path);
    return value !== undefined && value !== null ? String(value) : '';
  });
}

export function getNestedValue(obj: any, path: string): any {
  if (!obj || !path) return undefined;
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current === undefined || current === null) return undefined;
    current = current[part];
  }
  return current;
}

export function setNestedValue(obj: any, path: string, value: any): void {
  const parts = path.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!current[part] || typeof current[part] !== 'object') {
      current[part] = {};
    }
    current = current[part];
  }
  current[parts[parts.length - 1]] = value;
}
