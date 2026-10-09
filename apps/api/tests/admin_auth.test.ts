import dotenv from 'dotenv';
dotenv.config();
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/insta_automation_test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'super_secret_encryption_key_32_bytes!';

import request from 'supertest';
import express, { Express } from 'express';
import { connectDatabase, disconnectDatabase, UserModel, WorkspaceModel } from '@insta-automation/database';
import { hashPassword, signAccessToken } from '@insta-automation/auth';
import { authRouter } from '../src/routes/auth';
import { adminRouter } from '../src/routes/admin';
import { errorHandler } from '../src/middleware/errorHandler';

describe('Super Admin Authentication & RBAC Authorization Suite', () => {
  let app: Express;
  const jwtSecret = process.env.JWT_SECRET!;
  let customerUserToken: string;
  let superAdminToken: string;
  let customerUserId: string;
  let superAdminId: string;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    app.use('/api/auth', authRouter);
    app.use('/api/admin', adminRouter);
    app.use(errorHandler);

    await connectDatabase(process.env.MONGODB_URI!);

    // Clean up test users
    await UserModel.deleteMany({ email: { $in: ['customer_test@autodm.com', 'admin_test@autodm.com'] } });

    const customerPasswordHash = await hashPassword('CustomerPassword123!');
    const adminPasswordHash = await hashPassword('SuperAdminPassword123!');

    // Create Customer User (globalRole: 'user')
    const customerUser = await UserModel.create({
      name: 'Customer Test',
      email: 'customer_test@autodm.com',
      passwordHash: customerPasswordHash,
      globalRole: 'user',
      isEmailVerified: true,
    });
    customerUserId = customerUser._id.toString();

    // Create Super Admin User (globalRole: 'superadmin')
    const superAdminUser = await UserModel.create({
      name: 'Super Admin Test',
      email: 'admin_test@autodm.com',
      passwordHash: adminPasswordHash,
      globalRole: 'superadmin',
      isEmailVerified: true,
    });
    superAdminId = superAdminUser._id.toString();

    // Tokens
    customerUserToken = signAccessToken(
      { sub: customerUserId, email: 'customer_test@autodm.com', name: 'Customer Test', globalRole: 'user' },
      jwtSecret,
      '1h'
    ).accessToken;

    superAdminToken = signAccessToken(
      { sub: superAdminId, email: 'admin_test@autodm.com', name: 'Super Admin Test', globalRole: 'superadmin' },
      jwtSecret,
      '1h'
    ).accessToken;
  });

  afterAll(async () => {
    await UserModel.deleteMany({ email: { $in: ['customer_test@autodm.com', 'admin_test@autodm.com'] } });
    await disconnectDatabase();
  });

  describe('1. Unauthenticated Access Protection', () => {
    it('should reject unauthenticated request to /api/admin/stats with 401 Unauthorized', async () => {
      const res = await request(app).get('/api/admin/stats');
      expect(res.status).toBe(401);
    });

    it('should reject unauthenticated request to /api/admin/audit-logs with 401 Unauthorized', async () => {
      const res = await request(app).get('/api/admin/audit-logs');
      expect(res.status).toBe(401);
    });
  });

  describe('2. Customer RBAC Isolation (403 Forbidden)', () => {
    it('should reject customer user (globalRole: user) trying to access /api/admin/stats with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${customerUserToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error.message).toContain('Admin platform privileges required');
    });

    it('should reject customer user trying to trigger emergency controls with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/admin/emergency-controls')
        .set('Authorization', `Bearer ${customerUserToken}`)
        .send({ controlKey: 'MAINTENANCE_MODE', enabled: true });

      expect(res.status).toBe(403);
    });

    it('should reject customer user trying to toggle feature flags with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/admin/feature-flags')
        .set('Authorization', `Bearer ${customerUserToken}`)
        .send({ flagKey: 'AI_AGENT', enabled: false });

      expect(res.status).toBe(403);
    });
  });

  describe('3. Super Admin Authentication Endpoint (/api/auth/admin-login)', () => {
    it('should reject invalid password with 401 Unauthorized', async () => {
      const res = await request(app).post('/api/auth/admin-login').send({
        email: 'admin_test@autodm.com',
        password: 'WrongPassword123!',
      });

      expect(res.status).toBe(401);
      expect(res.body.error.message).toContain('Invalid administrator credentials');
    });

    it('should DENY customer user credentials on /admin-login with 403 Forbidden', async () => {
      const res = await request(app).post('/api/auth/admin-login').send({
        email: 'customer_test@autodm.com',
        password: 'CustomerPassword123!',
      });

      expect(res.status).toBe(403);
      expect(res.body.error.message).toContain('Platform administrator privileges required');
    });

    it('should authenticate valid Super Admin credentials and return JWT token', async () => {
      const res = await request(app).post('/api/auth/admin-login').send({
        email: 'admin_test@autodm.com',
        password: 'SuperAdminPassword123!',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.tokens.accessToken).toBeDefined();
      expect(res.body.user.globalRole).toBe('superadmin');
    });
  });

  describe('4. Super Admin Protected Operations & Audit Logging', () => {
    it('should allow Super Admin to fetch live overview stats', async () => {
      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.stats).toBeDefined();
      expect(typeof res.body.stats.totalUsers).toBe('number');
    });

    it('should allow Super Admin to fetch audit logs', async () => {
      const res = await request(app)
        .get('/api/admin/audit-logs')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.auditLogs)).toBe(true);
    });

    it('should allow Super Admin to trigger emergency controls and record audit log', async () => {
      const res = await request(app)
        .post('/api/admin/emergency-controls')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ controlKey: 'PAUSE_NEW_SIGNUPS', enabled: true, reason: 'Security Audit Test' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const logsRes = await request(app)
        .get('/api/admin/audit-logs')
        .set('Authorization', `Bearer ${superAdminToken}`);

      const emergencyLog = logsRes.body.auditLogs.find(
        (l: any) => l.action === 'EMERGENCY_CONTROL_TRIGGERED' && l.target === 'PAUSE_NEW_SIGNUPS'
      );
      expect(emergencyLog).toBeDefined();
      expect(emergencyLog.actor).toBe('admin_test@autodm.com');
    });

    it('should allow Super Admin to toggle feature flags and log audit entry', async () => {
      const res = await request(app)
        .post('/api/admin/feature-flags')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ flagKey: 'AI_AGENT', enabled: true });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should allow Super Admin to start support impersonation and log audit entry', async () => {
      const res = await request(app)
        .post('/api/admin/impersonate')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ workspaceId: 'ws_test_123', reason: 'Customer Ticket #991' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.impersonationToken).toBeDefined();
    });

    it('should allow Super Admin to logout and record audit log', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
