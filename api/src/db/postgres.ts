/**
 * PostgreSQL database connection
 * Implements the same DatabaseConnection interface as the SQLite adapter
 */

import pg from 'pg';
import { DB_CONFIG } from './config';
import { DatabaseConnection } from './types';

const { Pool } = pg;

/**
 * DatabaseConnection wrapper for PostgreSQL
 * Implements the common DatabaseConnection interface
 */
export class PostgresConnection implements DatabaseConnection {
  private pool: pg.Pool;

  constructor(pool: pg.Pool) {
    this.pool = pool;
  }

  /**
   * Execute a SQL statement that modifies data (INSERT, UPDATE, DELETE)
   * Converts ? placeholders to $1, $2, ... for pg compatibility
   */
  public async run(sql: string, params: unknown[] = []): Promise<{ lastID?: number; changes: number }> {
    const { pgSql, pgParams } = this.convertPlaceholders(sql, params);

    // For INSERT statements, add RETURNING clause to get the inserted ID
    let finalSql = pgSql;
    if (/^\s*INSERT\s+INTO/i.test(finalSql) && !/RETURNING/i.test(finalSql)) {
      finalSql += ' RETURNING *';
    }

    const result = await this.pool.query(finalSql, pgParams);

    let lastID: number | undefined;
    if (result.rows && result.rows.length > 0) {
      // Get the first column that ends with _id as the primary key
      const row = result.rows[0];
      const idKey = Object.keys(row).find((k) => k.endsWith('_id'));
      if (idKey) {
        lastID = row[idKey];
      }
    }

    return { lastID, changes: result.rowCount || 0 };
  }

  /**
   * Get a single row
   */
  public async get<T = unknown>(sql: string, params: unknown[] = []): Promise<T | undefined> {
    const { pgSql, pgParams } = this.convertPlaceholders(sql, params);
    const result = await this.pool.query(pgSql, pgParams);
    return result.rows[0] as T | undefined;
  }

  /**
   * Get all rows
   */
  public async all<T = unknown>(sql: string, params: unknown[] = []): Promise<T[]> {
    const { pgSql, pgParams } = this.convertPlaceholders(sql, params);
    const result = await this.pool.query(pgSql, pgParams);
    return result.rows as T[];
  }

  /**
   * Close the database connection pool
   */
  public async close(): Promise<void> {
    await this.pool.end();
  }

  /**
   * Convert ? placeholders to $1, $2, ... for PostgreSQL
   * Skips ? inside single-quoted strings
   */
  private convertPlaceholders(sql: string, params: unknown[]): { pgSql: string; pgParams: unknown[] } {
    let paramIndex = 0;
    let inString = false;
    let pgSql = '';

    for (let i = 0; i < sql.length; i++) {
      const char = sql[i];

      if (char === "'" && sql[i - 1] !== '\\') {
        inString = !inString;
        pgSql += char;
      } else if (char === '?' && !inString) {
        paramIndex++;
        pgSql += `$${paramIndex}`;
      } else {
        pgSql += char;
      }
    }

    return { pgSql, pgParams: params };
  }
}

/**
 * Create a PostgreSQL connection pool
 */
export function createPostgresConnection(): PostgresConnection {
  const pool = new Pool({
    connectionString: DB_CONFIG.DATABASE_URL,
  });

  return new PostgresConnection(pool);
}
