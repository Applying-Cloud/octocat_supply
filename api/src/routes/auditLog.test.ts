import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import authRouter from './auth';
import auditLogRouter from './auditLog';
import { runMigrations } from '../db/migrate';
import { closeDatabase, getDatabase } from '../db';
import { errorHandler } from '../utils/errors';

let app: express.Express;

describe('Audit Log API', () => {
  beforeEach(async () => {
    // Fresh in-memory database for each test
    await closeDatabase();
    await getDatabase(true);
    await runMigrations(true);

    // Set up express app
    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use('/auth', authRouter);
    app.use('/audit-log', auditLogRouter);
    app.use(errorHandler);
  });

  afterEach(async () => {
    await closeDatabase();
  });

  async function registerAndLogin(email: string, role: string = 'user'): Promise<string> {
    // Register a user
    await request(app).post('/auth/register').send({
      email,
      password: 'StrongPass12!@',
      firstName: 'Test',
      lastName: 'User',
    });

    // If admin role needed, manually update in DB
    if (role === 'admin') {
      const db = await getDatabase(true);
      await db.run('UPDATE users SET role = ? WHERE email = ?', ['admin', email]);
    }

    // Login
    const loginRes = await request(app)
      .post('/auth/login')
      .send({ email, password: 'StrongPass12!@' });

    const cookies = loginRes.headers['set-cookie'];
    return Array.isArray(cookies) ? cookies[0] : cookies;
  }

  describe('GET /audit-log', () => {
    it('should return 200 with paginated data for admin', async () => {
      const adminCookie = await registerAndLogin('admin@test.com', 'admin');

      const response = await request(app)
        .get('/audit-log')
        .set('Cookie', adminCookie);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('pageSize');
      expect(response.body).toHaveProperty('totalPages');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return 403 for non-admin user', async () => {
      const userCookie = await registerAndLogin('regular@test.com', 'user');

      const response = await request(app)
        .get('/audit-log')
        .set('Cookie', userCookie);

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await request(app).get('/audit-log');

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should respect pagination params', async () => {
      const adminCookie = await registerAndLogin('admin2@test.com', 'admin');

      const response = await request(app)
        .get('/audit-log?page=1&pageSize=5')
        .set('Cookie', adminCookie);

      expect(response.status).toBe(200);
      expect(response.body.page).toBe(1);
      expect(response.body.pageSize).toBe(5);
    });

    it('should contain login audit entries', async () => {
      // Login creates audit entries
      const adminCookie = await registerAndLogin('admin3@test.com', 'admin');

      const response = await request(app)
        .get('/audit-log')
        .set('Cookie', adminCookie);

      expect(response.status).toBe(200);
      // Should have at least the LOGIN_SUCCESS entries
      expect(response.body.total).toBeGreaterThan(0);
      const operations = response.body.data.map((e: { operation: string }) => e.operation);
      expect(operations).toContain('LOGIN_SUCCESS');
    });
  });
});
