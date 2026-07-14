-- Seed 005: Dev users for authentication testing
-- All passwords: OctoCAT2024!@ (bcrypt hash with cost 12)
-- DO NOT use these credentials in production

INSERT OR IGNORE INTO users (email, password_hash, first_name, last_name, role) VALUES
  ('admin@octocat.com', '$2a$12$Gjc3Nef/l/vhjYJxxqsotOU7wjKeFHHW1oTb8EkOo7amcISR8S1Ue', 'Diego', 'Admin', 'admin'),
  ('manager@octocat.com', '$2a$12$Gjc3Nef/l/vhjYJxxqsotOU7wjKeFHHW1oTb8EkOo7amcISR8S1Ue', 'Carlos', 'Manager', 'manager'),
  ('user@octocat.com', '$2a$12$Gjc3Nef/l/vhjYJxxqsotOU7wjKeFHHW1oTb8EkOo7amcISR8S1Ue', 'Ana', 'User', 'user');
