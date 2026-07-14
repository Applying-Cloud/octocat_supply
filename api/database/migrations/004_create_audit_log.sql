-- Migration 004: Create audit_log table for authentication event tracking
CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  record_id TEXT NOT NULL,
  user_id TEXT,
  old_values TEXT,
  new_values TEXT,
  timestamp TEXT NOT NULL DEFAULT (datetime('now'))
);
