import { can, hasMinimumRole, assertCan, PermissionDeniedError } from '@insta-automation/permissions';

describe('Permissions & RBAC Unit Tests', () => {
  describe('Role Hierarchy', () => {
    it('should respect minimum role hierarchy', () => {
      expect(hasMinimumRole('OWNER', 'VIEWER')).toBe(true);
      expect(hasMinimumRole('ADMIN', 'MANAGER')).toBe(true);
      expect(hasMinimumRole('EDITOR', 'MANAGER')).toBe(false);
      expect(hasMinimumRole('VIEWER', 'OWNER')).toBe(false);
    });
  });

  describe('Permission Matrix Checks', () => {
    it('should allow VIEWER to read workflows but deny creating workflows', () => {
      expect(can('VIEWER', 'workflow:read')).toBe(true);
      expect(can('VIEWER', 'workflow:create')).toBe(false);
      expect(can('VIEWER', 'workflow:delete')).toBe(false);
    });

    it('should allow EDITOR to create/update workflows but deny deleting workflows', () => {
      expect(can('EDITOR', 'workflow:create')).toBe(true);
      expect(can('EDITOR', 'workflow:update')).toBe(true);
      expect(can('EDITOR', 'workflow:delete')).toBe(false);
    });

    it('should allow MANAGER to delete workflows', () => {
      expect(can('MANAGER', 'workflow:delete')).toBe(true);
    });

    it('should allow ADMIN to connect/disconnect Instagram accounts and invite members', () => {
      expect(can('ADMIN', 'instagram:connect')).toBe(true);
      expect(can('ADMIN', 'member:invite')).toBe(true);
      expect(can('EDITOR', 'instagram:connect')).toBe(false);
    });

    it('should allow only OWNER to delete workspace', () => {
      expect(can('OWNER', 'workspace:delete')).toBe(true);
      expect(can('ADMIN', 'workspace:delete')).toBe(false);
    });

    it('should throw PermissionDeniedError on assertCan failure', () => {
      expect(() => {
        assertCan('VIEWER', 'workflow:delete');
      }).toThrow(PermissionDeniedError);
    });
  });
});
