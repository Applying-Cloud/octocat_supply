/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication endpoints (register, login, logout, session)
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, firstName, lastName]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 12
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email already registered
 *
 * /api/auth/login:
 *   post:
 *     summary: Authenticate user and create session
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful (JWT set in httpOnly cookie)
 *       401:
 *         description: Invalid credentials
 *
 * /api/auth/logout:
 *   post:
 *     summary: Clear authentication session
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logged out successfully
 *
 * /api/auth/me:
 *   get:
 *     summary: Get current authenticated user
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Current user profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserPublic'
 *       401:
 *         description: Not authenticated
 */

import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { getUsersRepository } from '../repositories/usersRepo';
import { getAuditLogRepository } from '../repositories/auditLogRepo';
import { validateRegistrationInput, validateEmail } from '../utils/validators';
import { verifyToken, JWT_SECRET, AuthenticatedRequest } from '../middleware/auth/verifyToken';

const router = express.Router();
const TOKEN_EXPIRY = '1h';

// POST /register — Create a new user account
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Validate input
    const validation = validateRegistrationInput({ email, password, firstName, lastName });
    if (!validation.valid) {
      res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: validation.errors },
      });
      return;
    }

    const repo = await getUsersRepository();

    // Check for duplicate email
    const existing = await repo.findByEmail(email);
    if (existing) {
      res.status(409).json({
        error: { code: 'CONFLICT', message: 'Email already registered' },
      });
      return;
    }

    // Create user (defaults to 'user' role — admin cannot be self-registered)
    const user = await repo.create({ email, password, firstName, lastName });

    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
});

// POST /login — Authenticate and issue JWT cookie
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Basic presence validation
    const emailValidation = validateEmail(email || '');
    if (!emailValidation.valid || !password) {
      res.status(401).json({
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' },
      });
      return;
    }

    const repo = await getUsersRepository();
    const auditRepo = await getAuditLogRepository();

    // Find user (includes password hash)
    const user = await repo.findByEmail(email);
    if (!user) {
      // Audit failed attempt
      await auditRepo.insertLoginEvent('LOGIN_FAILED', email, { reason: 'user_not_found' });
      res.status(401).json({
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' },
      });
      return;
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      // Audit failed attempt
      await auditRepo.insertLoginEvent('LOGIN_FAILED', email, { reason: 'invalid_password' });
      res.status(401).json({
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' },
      });
      return;
    }

    // Sign JWT
    const token = jwt.sign(
      { email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY },
    );

    // Set httpOnly cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 1000, // 1 hour in milliseconds
    });

    // Audit success
    await auditRepo.insertLoginEvent('LOGIN_SUCCESS', email);

    res.status(200).json({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    });
  } catch (error) {
    next(error);
  }
});

// POST /logout — Clear the token cookie
router.post('/logout', (_req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
  res.status(200).json({ message: 'Logged out successfully' });
});

// GET /me — Get current session user
router.get('/me', verifyToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const repo = await getUsersRepository();
    const user = await repo.findByEmailPublic(req.user!.email);

    if (!user) {
      res.status(401).json({
        error: { code: 'USER_NOT_FOUND', message: 'User no longer exists' },
      });
      return;
    }

    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
});

export default router;
