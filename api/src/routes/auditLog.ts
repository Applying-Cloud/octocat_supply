/**
 * @swagger
 * tags:
 *   name: AuditLog
 *   description: Audit log endpoints (admin only)
 */

/**
 * @swagger
 * /api/audit-log:
 *   get:
 *     summary: Get paginated audit log entries (admin only)
 *     tags: [AuditLog]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of entries per page
 *     responses:
 *       200:
 *         description: Paginated audit log entries
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AuditLogEntry'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 pageSize:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Insufficient permissions (admin only)
 */

import express from 'express';
import { verifyToken } from '../middleware/auth/verifyToken';
import { requireRole } from '../middleware/auth/requireRole';
import { getAuditLogRepository } from '../repositories/auditLogRepo';

const router = express.Router();

// GET / — List audit log entries (admin only)
router.get('/', verifyToken, requireRole('admin'), async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 20));

    const repo = await getAuditLogRepository();
    const result = await repo.findAll({ page, pageSize });

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
