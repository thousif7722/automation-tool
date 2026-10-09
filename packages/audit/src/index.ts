import { AuditLogModel } from '@insta-automation/database';

export interface AuditLogInput {
  workspaceId?: string;
  userId?: string;
  action: string;
  resource?: string;
  ipAddress?: string;
  userAgent?: string;
  result: 'SUCCESS' | 'FAILURE' | 'DENIED';
  metadata?: Record<string, unknown>;
}

export async function audit(input: AuditLogInput): Promise<void> {
  try {
    await AuditLogModel.create({
      workspaceId: input.workspaceId,
      userId: input.userId,
      action: input.action,
      resource: input.resource,
      result: input.result,
      timestamp: new Date(),
    });
  } catch (err: any) {
    console.error('[AuditLog Error]', err.message);
  }
}

export const AuditAction = {
  AUTH_REGISTER: 'auth.register',
  AUTH_LOGIN: 'auth.login',
  AUTH_ADMIN_LOGIN: 'auth.admin_login',
  AUTH_GOOGLE_LOGIN: 'auth.google_login',
  AUTH_LOGOUT: 'auth.logout',
  WORKSPACE_CREATE: 'workspace.create',
  WORKSPACE_UPDATE: 'workspace.update',
  WORKSPACE_DELETE: 'workspace.delete',
  WORKSPACE_MEMBER_INVITE: 'workspace.member.invite',
  WORKFLOW_CREATE: 'workflow.create',
  WORKFLOW_UPDATE: 'workflow.update',
  WORKFLOW_DELETE: 'workflow.delete',
  MESSAGE_SEND: 'message.send',
  INSTAGRAM_CONNECT: 'instagram.connect',
  INSTAGRAM_DISCONNECT: 'instagram.disconnect',
  BILLING_SUBSCRIBE: 'billing.subscribe',
} as const;
