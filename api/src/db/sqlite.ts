/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * SQLite database connection implementation
 */

import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { DB_CONFIG, TEST_DB_CONFIG } from './config';
import { DatabaseConnection } from './types';

/**
 * SQLite implementation of DatabaseConnection
 */
export class SQLiteConnection implements DatabaseConnection {
  public db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  public run(sql: string, params: unknown[] = []): Promise<{ lastID?: number; changes: number }> {
    const info = this.db.prepare(sql).run(...(params as any[]));
    const lastID = info.lastInsertRowid;

    if (typeof lastID === 'bigint') {
      if (lastID > Number.MAX_SAFE_INTEGER || lastID < Number.MIN_SAFE_INTEGER) {
        throw new Error(`Row ID ${lastID} exceeds safe integer range`);
      }
      return Promise.resolve({ lastID: Number(lastID), changes: info.changes });
    }

    return Promise.resolve({ lastID, changes: info.changes });
  }

  public get<T = unknown>(sql: string, params: unknown[] = []): Promise<T | undefined> {
    const row = this.db.prepare(sql).get(...(params as any[]));
    return Promise.resolve(row as T | undefined);
  }

  public all<T = unknown>(sql: string, params: unknown[] = []): Promise<T[]> {
    const rows = this.db.prepare(sql).all(...(params as any[]));
    return Promise.resolve(rows as T[]);
  }

  public close(): Promise<void> {
    this.db.close();
    return Promise.resolve();
  }
}

/**
 * Create a SQLite connection
 */
export function createSQLiteConnection(isTest: boolean = false): DatabaseConnection {
  const config = isTest ? TEST_DB_CONFIG : DB_CONFIG;

  // Ensure data directory exists for file-based databases
  if (config.DB_FILE !== ':memory:') {
    const dataDir = path.dirname(config.DB_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }

  const options: Database.Options = {
    verbose: process.env.NODE_ENV === 'development' ? console.log : undefined,
    timeout: config.TIMEOUT,
  };

  const db = new Database(config.DB_FILE, options);

  // Enable foreign key constraints
  if (config.FOREIGN_KEYS) {
    db.pragma('foreign_keys = ON');
  }

  // Enable WAL mode for file databases
  if (config.ENABLE_WAL && config.DB_FILE !== ':memory:') {
    db.pragma('journal_mode = WAL');
  }

  return new SQLiteConnection(db);
}
