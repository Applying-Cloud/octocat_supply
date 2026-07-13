/**
 * Common interface for database connections
 * Shared between SQLite and PostgreSQL implementations
 */
export interface DatabaseConnection {
  run(sql: string, params?: unknown[]): Promise<{ lastID?: number; changes: number }>;
  get<T = unknown>(sql: string, params?: unknown[]): Promise<T | undefined>;
  all<T = unknown>(sql: string, params?: unknown[]): Promise<T[]>;
  close(): Promise<void>;
}
