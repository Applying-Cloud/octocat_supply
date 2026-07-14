import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UsersRepository } from './usersRepo';
import { DatabaseConnection } from '../db/types';

// Mock the getDatabase function
vi.mock('../db', () => ({
  getDatabase: vi.fn(),
}));

// Mock bcryptjs
vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('$2a$12$mockedhashvalue'),
  },
}));

describe('UsersRepository', () => {
  let repository: UsersRepository;
  let mockDb: {
    run: ReturnType<typeof vi.fn>;
    get: ReturnType<typeof vi.fn>;
    all: ReturnType<typeof vi.fn>;
    close: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockDb = {
      run: vi.fn(),
      get: vi.fn(),
      all: vi.fn(),
      close: vi.fn(),
    };

    repository = new UsersRepository(mockDb as unknown as DatabaseConnection);
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new user and return public representation', async () => {
      const input = {
        email: 'test@example.com',
        password: 'OctoCAT2024!@',
        firstName: 'John',
        lastName: 'Doe',
      };

      mockDb.run.mockResolvedValue({ lastID: undefined, changes: 1 });
      mockDb.get.mockResolvedValue({
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        role: 'user',
        created_at: '2026-01-01 00:00:00',
        updated_at: '2026-01-01 00:00:00',
      });

      const result = await repository.create(input);

      expect(mockDb.run).toHaveBeenCalledWith(
        'INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES (?, ?, ?, ?, ?)',
        ['test@example.com', '$2a$12$mockedhashvalue', 'John', 'Doe', 'user'],
      );
      expect(result.email).toBe('test@example.com');
      expect(result.firstName).toBe('John');
      expect(result.role).toBe('user');
      // Should not contain password_hash
      expect((result as unknown as Record<string, unknown>)['passwordHash']).toBeUndefined();
    });

    it('should lowercase and trim the email', async () => {
      const input = {
        email: '  Test@Example.COM  ',
        password: 'OctoCAT2024!@',
        firstName: 'John',
        lastName: 'Doe',
      };

      mockDb.run.mockResolvedValue({ lastID: undefined, changes: 1 });
      mockDb.get.mockResolvedValue({
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        role: 'user',
        created_at: '2026-01-01 00:00:00',
        updated_at: '2026-01-01 00:00:00',
      });

      await repository.create(input);

      expect(mockDb.run).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(['test@example.com']),
      );
    });
  });

  describe('findByEmail', () => {
    it('should return user with hash when found', async () => {
      mockDb.get.mockResolvedValue({
        email: 'test@example.com',
        password_hash: '$2a$12$somehashedvalue',
        first_name: 'John',
        last_name: 'Doe',
        role: 'user',
        created_at: '2026-01-01 00:00:00',
        updated_at: '2026-01-01 00:00:00',
      });

      const result = await repository.findByEmail('test@example.com');

      expect(mockDb.get).toHaveBeenCalledWith(
        'SELECT email, password_hash, first_name, last_name, role, created_at, updated_at FROM users WHERE email = ?',
        ['test@example.com'],
      );
      expect(result?.email).toBe('test@example.com');
      expect(result?.passwordHash).toBe('$2a$12$somehashedvalue');
      expect(result?.role).toBe('user');
    });

    it('should return null when user not found', async () => {
      mockDb.get.mockResolvedValue(undefined);

      const result = await repository.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findByEmailPublic', () => {
    it('should return public user data without password hash', async () => {
      mockDb.get.mockResolvedValue({
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        role: 'admin',
        created_at: '2026-01-01 00:00:00',
        updated_at: '2026-01-01 00:00:00',
      });

      const result = await repository.findByEmailPublic('test@example.com');

      expect(mockDb.get).toHaveBeenCalledWith(
        'SELECT email, first_name, last_name, role, created_at, updated_at FROM users WHERE email = ?',
        ['test@example.com'],
      );
      expect(result?.email).toBe('test@example.com');
      expect(result?.role).toBe('admin');
      expect((result as unknown as Record<string, unknown>)['passwordHash']).toBeUndefined();
    });

    it('should return null when user not found', async () => {
      mockDb.get.mockResolvedValue(undefined);

      const result = await repository.findByEmailPublic('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });
});
