import type { WorkspaceRole, ResourceAction } from '@insta-automation/types';

const ROLE_HIERARCHY: WorkspaceRole[] = ['VIEWER', 'EDITOR', 'MANAGER', 'ADMIN', 'OWNER'];

export function hasMinimumRole(role: WorkspaceRole, required: WorkspaceRole): boolean {
  return ROLE_HIERARCHY.indexOf(role) >= ROLE_HIERARCHY.indexOf(required);
}

const PERMISSION_MATRIX: Record<ResourceAction, WorkspaceRole> = {
  'workflow:read': 'VIEWER',
  'workflow:create': 'EDITOR',
  'workflow:update': 'EDITOR',
  'workflow:delete': 'MANAGER',
  'lead:read': 'VIEWER',
  'lead:create': 'EDITOR',
  'lead:update': 'EDITOR',
  'lead:delete': 'MANAGER',
  'customer:read': 'VIEWER',
  'customer:update': 'EDITOR',
  'message:read': 'VIEWER',
  'message:send': 'EDITOR',
  'message:write': 'EDITOR',
  'ai:read': 'VIEWER',
  'ai:update': 'ADMIN',
  'content:read': 'VIEWER',
  'content:create': 'EDITOR',
  'instagram:read': 'VIEWER',
  'instagram:connect': 'ADMIN',
  'instagram:disconnect': 'ADMIN',
  'analytics:read': 'VIEWER',
  'member:read': 'VIEWER',
  'member:invite': 'ADMIN',
  'billing:read': 'ADMIN',
  'billing:update': 'ADMIN',
  'workspace:update': 'ADMIN',
  'workspace:delete': 'OWNER',
};

export function can(role: WorkspaceRole, action: ResourceAction): boolean {
  const required = PERMISSION_MATRIX[action];
  if (!required) return false;
  return hasMinimumRole(role, required);
}

export class PermissionDeniedError extends Error {
  public readonly action: ResourceAction;
  public readonly role: WorkspaceRole;
  public readonly statusCode = 403;
  constructor(action: ResourceAction, role: WorkspaceRole) {
    super(`Role '${role}' is not permitted to perform '${action}'`);
    this.name = 'PermissionDeniedError';
    this.action = action;
    this.role = role;
  }
}

export function assertCan(role: WorkspaceRole, action: ResourceAction): void {
  if (!can(role, action)) throw new PermissionDeniedError(action, role);
}
