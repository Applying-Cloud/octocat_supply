/**
 * Database configuration settings
 *
 * DB_ENGINE controls which database backend is used:
 *   - 'sqlite' (default): Uses better-sqlite3 with a local file
 *   - 'postgres': Uses pg with a connection string (DATABASE_URL)
 */

export type DbEngine = 'sqlite' | 'postgres';

export const DB_CONFIG = {
  // Database engine: 'sqlite' | 'postgres'
  DB_ENGINE: (process.env.DB_ENGINE || 'sqlite') as DbEngine,

  // SQLite-specific settings
  DB_FILE: process.env.DB_FILE || './data/app.db',
  ENABLE_WAL: process.env.DB_ENABLE_WAL !== 'false',
  TIMEOUT: parseInt(process.env.DB_TIMEOUT || '30000'),
  FOREIGN_KEYS: process.env.DB_FOREIGN_KEYS !== 'false',

  // Postgres-specific settings
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://octocat:octocat_secret@localhost:5432/octocat_supply',
};

// Test database configuration for unit tests
export const TEST_DB_CONFIG = {
  ...DB_CONFIG,
  DB_ENGINE: 'sqlite' as DbEngine,
  DB_FILE: ':memory:', // Use in-memory SQLite for tests
};
