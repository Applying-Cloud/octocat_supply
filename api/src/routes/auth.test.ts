import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import authRouter from './auth';
import { runMigrations } from '../db/migrate';
import { closeDatabase, getDatabase } from '../db';
import { errorHandler } from '../utils/errors';

let app: express.Express;

describe('Auth API', () => {
  beforeEach(async () => {
    // Fresh in-memory database for each test
    await closeDatabase();
    await getDatabase(true);
    await runMigrations(true);

    // Set up express app with cookie-parser
    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use('/auth', authRouter);
    app.use(errorHandler);
  });

  afterEach(async () => {
    await closeDatabase();
  });

  describe('POST /auth/register', () => {
    const validUser = {
      email: 'newuser@example.com',
      password: 'StrongPass12!@',
      firstName: 'Jane',
      lastName: 'Smith',
    };

    it('should register a new user successfully', async () => {
      const response = await request(app).post('/auth/register').send(validUser);

      expect(response.status).toBe(201);
      expect(response.body.email).toBe('newuser@example.com');
      expect(response.body.firstName).toBe('Jane');
      expect(response.body.lastName).toBe('Smith');
      expect(response.body.role).toBe('user');
      // Should never return password hash
      expect(response.body.passwordHash).toBeUndefined();
      expect(response.body.password_hash).toBeUndefined();
    });

    it('should return 409 for duplicate email', async () => {
      // First registration
      await request(app).post('/auth/register').send(validUser);

      // Duplicate
      const response = await request(app).post('/auth/register').send(validUser);

      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe('CONFLICT');
    });

    it('should return 400 for invalid email', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({ ...validUser, email: 'not-an-email' });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details).toContain('Email format is invalid');
    });

    it('should return 400 for weak password', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({ ...validUser, password: 'short' });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details.some((e: string) => e.includes('Password'))).toBe(true);
    });

    it('should return 400 for missing firstName', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({ ...validUser, firstName: '' });

      expect(response.status).toBe(400);
      expect(response.body.error.details).toContain('First name is required');
    });

    it('should return 400 for missing lastName', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({ ...validUser, lastName: '' });

      expect(response.status).toBe(400);
      expect(response.body.error.details).toContain('Last name is required');
    });
  });

  describe('POST /auth/login', () => {
    const testUser = {
      email: 'login@example.com',
      password: 'StrongPass12!@',
      firstName: 'Test',
      lastName: 'User',
    };

    beforeEach(async () => {
      // Register a user to test login
      await request(app).post('/auth/register').send(testUser);
    });

    it('should login successfully and set httpOnly cookie', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({ email: testUser.email, password: testUser.password });

      expect(response.status).toBe(200);
      expect(response.body.email).toBe(testUser.email);
      expect(response.body.firstName).toBe('Test');
      expect(response.body.role).toBe('user');

      // Check cookie is set
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const tokenCookie = Array.isArray(cookies)
        ? cookies.find((c: string) => c.startsWith('token='))
        : cookies;
      expect(tokenCookie).toContain('HttpOnly');
    });

    it('should return 401 for wrong password', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({ email: testUser.email, password: 'WrongPassword1!@' });

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should return 401 for non-existent email', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'AnyPass123!@' });

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should return 401 for missing credentials', async () => {
      const response = await request(app).post('/auth/login').send({});

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('GET /auth/me', () => {
    const testUser = {
      email: 'session@example.com',
      password: 'StrongPass12!@',
      firstName: 'Session',
      lastName: 'User',
    };

    let authCookie: string;

    beforeEach(async () => {
      // Register and login
      await request(app).post('/auth/register').send(testUser);
      const loginRes = await request(app)
        .post('/auth/login')
        .send({ email: testUser.email, password: testUser.password });

      const cookies = loginRes.headers['set-cookie'];
      authCookie = Array.isArray(cookies) ? cookies[0] : cookies;
    });

    it('should return current user for valid session', async () => {
      const response = await request(app)
        .get('/auth/me')
        .set('Cookie', authCookie);

      expect(response.status).toBe(200);
      expect(response.body.email).toBe(testUser.email);
      expect(response.body.firstName).toBe('Session');
      expect(response.body.role).toBe('user');
      // Should never return password hash
      expect(response.body.passwordHash).toBeUndefined();
    });

    it('should return 401 when no cookie present', async () => {
      const response = await request(app).get('/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 401 for invalid token', async () => {
      const response = await request(app)
        .get('/auth/me')
        .set('Cookie', 'token=invalid.jwt.token');

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('INVALID_TOKEN');
    });
  });

  describe('POST /auth/logout', () => {
    it('should clear the token cookie', async () => {
      const response = await request(app).post('/auth/logout');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Logged out successfully');

      // Check cookie is cleared
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const tokenCookie = Array.isArray(cookies)
        ? cookies.find((c: string) => c.startsWith('token='))
        : cookies;
      expect(tokenCookie).toContain('token=');
    });
  });

  describe('Audit logging', () => {
    const testUser = {
      email: 'audit@example.com',
      password: 'StrongPass12!@',
      firstName: 'Audit',
      lastName: 'User',
    };

    beforeEach(async () => {
      await request(app).post('/auth/register').send(testUser);
    });

    it('should record LOGIN_SUCCESS in audit log', async () => {
      await request(app)
        .post('/auth/login')
        .send({ email: testUser.email, password: testUser.password });

      // Verify audit log entry
      const db = await getDatabase(true);
      const entry = await db.get<{ operation: string; record_id: string }>(
        "SELECT operation, record_id FROM audit_log WHERE operation = 'LOGIN_SUCCESS'",
      );

      expect(entry).toBeDefined();
      expect(entry!.record_id).toBe(testUser.email);
    });

    it('should record LOGIN_FAILED in audit log', async () => {
      await request(app)
        .post('/auth/login')
        .send({ email: testUser.email, password: 'WrongPassword1!@' });

      // Verify audit log entry
      const db = await getDatabase(true);
      const entry = await db.get<{ operation: string; record_id: string; new_values: string }>(
        "SELECT operation, record_id, new_values FROM audit_log WHERE operation = 'LOGIN_FAILED'",
      );

      expect(entry).toBeDefined();
      expect(entry!.record_id).toBe(testUser.email);
      expect(JSON.parse(entry!.new_values)).toHaveProperty('reason', 'invalid_password');
    });
  });
});
