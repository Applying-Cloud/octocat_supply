/**
 * Database connection factory
 * Returns either a SQLite or PostgreSQL connection based on DB_ENGINE config
 */

import { DB_CONFIG, TEST_DB_CONFIG } from './config';
import { createSQLiteConnection } from './sqlite';
import { createPostgresConnection } from './postgres';
import { DatabaseConnection } from './types';

// Re-export shared types and utilities
export type { DatabaseConnection } from './types';
export { DB_CONFIG, TEST_DB_CONFIG } from './config';
export type { DbEngine } from './config';

// Global database connection instance
let dbConnection: DatabaseConnection | null = null;

/**
 * Get the global database connection
 * Returns SQLite or PostgreSQL based on DB_ENGINE environment variable
 */
export async function getDatabase(isTest: boolean = false): Promise<DatabaseConnection> {
  if (!dbConnection) {
    const config = isTest ? TEST_DB_CONFIG : DB_CONFIG;

    if (config.DB_ENGINE === 'postgres') {
      console.log('🐘 Using PostgreSQL database');
      dbConnection = createPostgresConnection();
    } else {
      console.log('📦 Using SQLite database');
      dbConnection = createSQLiteConnection(isTest);
    }
  }
  return dbConnection;
}

/**
 * Close the global database connection
 */
export async function closeDatabase(): Promise<void> {
  if (dbConnection) {
    await dbConnection.close();
    dbConnection = null;
  }
}
