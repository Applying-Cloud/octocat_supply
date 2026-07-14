/**
 * Repository for audit log data access (append-only)
 */

import { getDatabase, DatabaseConnection } from '../db';
import { AuditLogEntry, AuditLogRecord, PaginationOptions, PaginatedResult } from '../models/auditLog';
import { handleDatabaseError } from '../utils/errors';
import { objectToCamelCase, DatabaseRow } from '../utils/sql';

export class AuditLogRepository {
  private db: DatabaseConnection;

  constructor(db: DatabaseConnection) {
    this.db = db;
  }

  /**
   * Insert a login event into the audit log
   */
  async insertLoginEvent(
    operation: 'LOGIN_SUCCESS' | 'LOGIN_FAILED',
    email: string,
    details?: Record<string, unknown>,
  ): Promise<void> {
    try {
      await this.db.run(
        'INSERT INTO audit_log (table_name, operation, record_id, user_id, new_values) VALUES (?, ?, ?, ?, ?)',
        [
          'users',
          operation,
          email,
          operation === 'LOGIN_SUCCESS' ? email : null,
          details ? JSON.stringify(details) : null,
        ],
      );
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Get all audit log entries with pagination
   */
  async findAll(options: PaginationOptions): Promise<PaginatedResult<AuditLogEntry>> {
    try {
      const offset = (options.page - 1) * options.pageSize;

      // Get total count
      const countResult = await this.db.get<{ count: number }>(
        'SELECT COUNT(*) as count FROM audit_log',
      );
      const total = countResult?.count || 0;

      // Get paginated results
      const rows = await this.db.all<DatabaseRow>(
        'SELECT * FROM audit_log ORDER BY timestamp DESC LIMIT ? OFFSET ?',
        [options.pageSize, offset],
      );

      const data = rows.map((row) => objectToCamelCase<AuditLogEntry>(row));

      return {
        data,
        total,
        page: options.page,
        pageSize: options.pageSize,
        totalPages: Math.ceil(total / options.pageSize),
      };
    } catch (error) {
      handleDatabaseError(error);
    }
  }
}

// Factory function to create repository instance
export async function createAuditLogRepository(isTest: boolean = false): Promise<AuditLogRepository> {
  const db = await getDatabase(isTest);
  return new AuditLogRepository(db);
}

// Singleton instance for default usage
let auditLogRepo: AuditLogRepository | null = null;

export async function getAuditLogRepository(isTest: boolean = false): Promise<AuditLogRepository> {
  const isTestEnv = isTest || process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';
  if (isTestEnv) {
    return createAuditLogRepository(true);
  }
  if (!auditLogRepo) {
    auditLogRepo = await createAuditLogRepository(false);
  }
  return auditLogRepo;
}
