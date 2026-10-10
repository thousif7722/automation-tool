import express from 'express';
import supertest from 'supertest';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config();

import { connectDatabase, disconnectDatabase, UserModel } from '@insta-automation/database';
import { getEnv } from '@insta-automation/config';
import app from '../index';

async function runTests() {
  console.log('--- STARTING SUPER ADMIN AUTHENTICATION TESTS ---');
  let passCount = 0;
  let failCount = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passCount++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      failCount++;
    }
  }

  try {
    const env = getEnv();
    await connectDatabase(env.MONGODB_URI);

    const client = supertest(app);

    // Test 1: Valid Super Admin Login
    const loginRes = await client.post('/api/auth/admin-login').send({
      email: 'shaikthousif.tech@gmail.com',
      password: 'AdminPassword123!',
    });
    assert(loginRes.status === 200, 'Valid Super Admin Login returns HTTP 200');
    assert(loginRes.body.success === true, 'Valid Super Admin Login returns success: true');
    assert(!!loginRes.body.tokens?.accessToken, 'Valid Super Admin Login returns access token');
    assert(loginRes.body.user?.globalRole === 'superadmin', 'Valid Super Admin Login returns globalRole superadmin');

    const adminToken = loginRes.body.tokens?.accessToken;

    // Test 2: Admin Me endpoint with valid token
    const meRes = await client
      .get('/api/auth/admin-me')
      .set('Authorization', `Bearer ${adminToken}`);
    assert(meRes.status === 200, 'GET /api/auth/admin-me returns HTTP 200');
    assert(meRes.body.user?.email === 'shaikthousif.tech@gmail.com', 'GET /api/auth/admin-me returns correct user email');

    // Test 3: Admin Protected Stats Endpoint with valid token
    const statsRes = await client
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`);
    assert(statsRes.status === 200, 'GET /api/admin/stats returns HTTP 200');
    assert(statsRes.body.success === true, 'GET /api/admin/stats returns success: true');
    assert(typeof statsRes.body.stats?.totalUsers === 'number', 'GET /api/admin/stats returns totalUsers');

    // Test 4: Incorrect Password Rejection
    const badPassRes = await client.post('/api/auth/admin-login').send({
      email: 'shaikthousif.tech@gmail.com',
      password: 'WrongPassword123!',
    });
    assert(badPassRes.status === 401, 'Invalid password rejected with HTTP 401');

    // Test 5: Missing Bearer Token Rejection on Admin Route
    const noTokenRes = await client.get('/api/admin/stats');
    assert(noTokenRes.status === 401, 'Missing token rejected with HTTP 401');

    // Test 6: Invalid/Malformed Token Rejection
    const badTokenRes = await client
      .get('/api/admin/stats')
      .set('Authorization', 'Bearer invalid_token_xyz');
    assert(badTokenRes.status === 401, 'Invalid token rejected with HTTP 401');

    console.log(`\n--- TEST RESULTS: ${passCount} PASSED, ${failCount} FAILED ---`);
  } catch (err: any) {
    console.error('Fatal test execution error:', err.message);
  } finally {
    await disconnectDatabase();
    process.exit(failCount === 0 ? 0 : 1);
  }
}

runTests();
