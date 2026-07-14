/**
 * Repository for users data access
 */

import { getDatabase, DatabaseConnection } from '../db';
import { UserPublic, UserWithHash, CreateUserInput } from '../models/user';
import { handleDatabaseError } from '../utils/errors';
import { objectToCamelCase, DatabaseRow } from '../utils/sql';
import bcrypt from 'bcryptjs';

const BCRYPT_ROUNDS = 12;

export class UsersRepository {
  private db: DatabaseConnection;

  constructor(db: DatabaseConnection) {
    this.db = db;
  }

  /**
   * Create a new user (registration)
   * Hashes the password before storing.
   */
  async create(input: CreateUserInput): Promise<UserPublic> {
    try {
      const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

      await this.db.run(
        'INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES (?, ?, ?, ?, ?)',
        [input.email.toLowerCase().trim(), passwordHash, input.firstName.trim(), input.lastName.trim(), 'user'],
      );

      const created = await this.findByEmailPublic(input.email);
      if (!created) {
        throw new Error('Failed to retrieve created user');
      }

      return created;
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Find user by email (includes password_hash — for authentication only)
   */
  async findByEmail(email: string): Promise<UserWithHash | null> {
    try {
      const row = await this.db.get<DatabaseRow>(
        'SELECT email, password_hash, first_name, last_name, role, created_at, updated_at FROM users WHERE email = ?',
        [email.toLowerCase().trim()],
      );
      return row ? objectToCamelCase<UserWithHash>(row) : null;
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  /**
   * Find user by email (public — never returns password_hash)
   */
  async findByEmailPublic(email: string): Promise<UserPublic | null> {
    try {
      const row = await this.db.get<DatabaseRow>(
        'SELECT email, first_name, last_name, role, created_at, updated_at FROM users WHERE email = ?',
        [email.toLowerCase().trim()],
      );
      return row ? objectToCamelCase<UserPublic>(row) : null;
    } catch (error) {
      handleDatabaseError(error);
    }
  }
}

// Factory function to create repository instance
export async function createUsersRepository(isTest: boolean = false): Promise<UsersRepository> {
  const db = await getDatabase(isTest);
  return new UsersRepository(db);
}

// Singleton instance for default usage
let usersRepo: UsersRepository | null = null;

export async function getUsersRepository(isTest: boolean = false): Promise<UsersRepository> {
  const isTestEnv = isTest || process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';
  if (isTestEnv) {
    return createUsersRepository(true);
  }
  if (!usersRepo) {
    usersRepo = await createUsersRepository(false);
  }
  return usersRepo;
}
