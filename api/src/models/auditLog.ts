/**
 * @swagger
 * components:
 *   schemas:
 *     AuditLogEntry:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           readOnly: true
 *           description: Auto-generated audit log ID
 *         tableName:
 *           type: string
 *           description: Name of the affected table
 *         operation:
 *           type: string
 *           description: Operation type (e.g., LOGIN_SUCCESS, LOGIN_FAILED)
 *         recordId:
 *           type: string
 *           description: Identifier of the affected record
 *         userId:
 *           type: string
 *           nullable: true
 *           description: Email of the user who performed the action
 *         oldValues:
 *           type: string
 *           nullable: true
 *           description: JSON string of previous values (if applicable)
 *         newValues:
 *           type: string
 *           nullable: true
 *           description: JSON string of new values (if applicable)
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: When the event occurred
 */

/** A single audit log record as stored in the database */
export interface AuditLogEntry {
  id: number;
  tableName: string;
  operation: string;
  recordId: string;
  userId: string | null;
  oldValues: string | null;
  newValues: string | null;
  timestamp: string;
}

/** Input for inserting a new audit log record */
export interface AuditLogRecord {
  tableName: string;
  operation: string;
  recordId: string;
  userId: string | null;
  oldValues?: string | null;
  newValues?: string | null;
}

/** Pagination options for listing audit logs */
export interface PaginationOptions {
  page: number;
  pageSize: number;
}

/** Generic paginated result */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
