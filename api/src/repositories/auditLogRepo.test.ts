import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuditLogRepository } from './auditLogRepo';
import { DatabaseConnection } from '../db/types';

// Mock the getDatabase function
vi.mock('../db', () => ({
  getDatabase: vi.fn(),
}));

describe('AuditLogRepository', () => {
  let repository: AuditLogRepository;
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

    repository = new AuditLogRepository(mockDb as unknown as DatabaseConnection);
    vi.clearAllMocks();
  });

  describe('insertLoginEvent', () => {
    it('should insert a LOGIN_SUCCESS event', async () => {
      mockDb.run.mockResolvedValue({ lastID: 1, changes: 1 });

      await repository.insertLoginEvent('LOGIN_SUCCESS', 'user@example.com');

      expect(mockDb.run).toHaveBeenCalledWith(
        'INSERT INTO audit_log (table_name, operation, record_id, user_id, new_values) VALUES (?, ?, ?, ?, ?)',
        ['users', 'LOGIN_SUCCESS', 'user@example.com', 'user@example.com', null],
      );
    });

    it('should insert a LOGIN_FAILED event with null user_id', async () => {
      mockDb.run.mockResolvedValue({ lastID: 2, changes: 1 });

      await repository.insertLoginEvent('LOGIN_FAILED', 'attacker@bad.com');

      expect(mockDb.run).toHaveBeenCalledWith(
        'INSERT INTO audit_log (table_name, operation, record_id, user_id, new_values) VALUES (?, ?, ?, ?, ?)',
        ['users', 'LOGIN_FAILED', 'attacker@bad.com', null, null],
      );
    });

    it('should include details as JSON when provided', async () => {
      mockDb.run.mockResolvedValue({ lastID: 3, changes: 1 });

      await repository.insertLoginEvent('LOGIN_FAILED', 'user@example.com', { reason: 'invalid_password' });

      expect(mockDb.run).toHaveBeenCalledWith(
        'INSERT INTO audit_log (table_name, operation, record_id, user_id, new_values) VALUES (?, ?, ?, ?, ?)',
        ['users', 'LOGIN_FAILED', 'user@example.com', null, '{"reason":"invalid_password"}'],
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated audit log entries', async () => {
      mockDb.get.mockResolvedValue({ count: 25 });
      mockDb.all.mockResolvedValue([
        {
          id: 25,
          table_name: 'users',
          operation: 'LOGIN_SUCCESS',
          record_id: 'user@example.com',
          user_id: 'user@example.com',
          old_values: null,
          new_values: null,
          timestamp: '2026-01-01 12:00:00',
        },
        {
          id: 24,
          table_name: 'users',
          operation: 'LOGIN_FAILED',
          record_id: 'attacker@bad.com',
          user_id: null,
          old_values: null,
          new_values: null,
          timestamp: '2026-01-01 11:55:00',
        },
      ]);

      const result = await repository.findAll({ page: 1, pageSize: 20 });

      expect(mockDb.get).toHaveBeenCalledWith('SELECT COUNT(*) as count FROM audit_log');
      expect(mockDb.all).toHaveBeenCalledWith(
        'SELECT * FROM audit_log ORDER BY timestamp DESC LIMIT ? OFFSET ?',
        [20, 0],
      );
      expect(result.total).toBe(25);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
      expect(result.totalPages).toBe(2);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].tableName).toBe('users');
      expect(result.data[0].operation).toBe('LOGIN_SUCCESS');
    });

    it('should calculate correct offset for page 2', async () => {
      mockDb.get.mockResolvedValue({ count: 50 });
      mockDb.all.mockResolvedValue([]);

      await repository.findAll({ page: 2, pageSize: 10 });

      expect(mockDb.all).toHaveBeenCalledWith(
        'SELECT * FROM audit_log ORDER BY timestamp DESC LIMIT ? OFFSET ?',
        [10, 10],
      );
    });

    it('should return empty data with zero total', async () => {
      mockDb.get.mockResolvedValue({ count: 0 });
      mockDb.all.mockResolvedValue([]);

      const result = await repository.findAll({ page: 1, pageSize: 20 });

      expect(result.total).toBe(0);
      expect(result.data).toHaveLength(0);
      expect(result.totalPages).toBe(0);
    });
  });
});
