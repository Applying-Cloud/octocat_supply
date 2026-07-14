# Code Generation Plan — Authentication Module

## Unit Context

- **Unit Name**: auth-module (single unit)
- **Workspace Root**: `/home/jose/git/demo-ai-dlc/octocat_supply`
- **Project Type**: Brownfield (TypeScript monorepo: api/ + frontend/)
- **Stories Covered**: US-01 through US-06 (6 stories, 22 acceptance criteria)
- **Dependencies**: bcryptjs, jsonwebtoken, cookie-parser (API); existing TanStack Query + Axios (Frontend)

## Update Sequence

API first (foundation), then Frontend (integration):
1. Database (migrations + seed)
2. Models (TypeScript interfaces)
3. Utilities (validators)
4. Repositories (data access)
5. Middleware (auth verification)
6. Routes (endpoints)
7. API entry point (registration + cookie-parser)
8. API tests
9. Frontend context (AuthContext refactoring)
10. Frontend components (Login refactor, Register new)
11. Frontend routing (App.tsx)
12. Frontend tests

---

## Execution Steps

### Step 1: Install API Dependencies
- [x] Add `bcryptjs`, `jsonwebtoken`, `cookie-parser` to api/package.json dependencies
- [x] Add `@types/bcryptjs`, `@types/jsonwebtoken`, `@types/cookie-parser` to api/package.json devDependencies
- [x] Run `npm install` in api/

**Stories**: US-02 (JWT), US-01 (bcrypt)

---

### Step 2: Database Migration — Users Table
- [x] Create `api/database/migrations/003_create_users.sql` (SQLite)
- [x] Create `api/database/migrations-pg/003_create_users.sql` (PostgreSQL)

**Schema**:
```sql
CREATE TABLE users (
  email TEXT PRIMARY KEY,
  password_hash TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('admin', 'manager', 'user')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

**Stories**: US-01 (REQ-FR-01)

---

### Step 3: Database Migration — Audit Log Table
- [x] Create `api/database/migrations/004_create_audit_log.sql` (SQLite)
- [x] Create `api/database/migrations-pg/004_create_audit_log.sql` (PostgreSQL)

**Schema**:
```sql
CREATE TABLE audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  record_id TEXT NOT NULL,
  user_id TEXT,
  old_values TEXT,
  new_values TEXT,
  timestamp TEXT NOT NULL DEFAULT (datetime('now'))
);
```

**Stories**: US-06 (REQ-FR-08)

---

### Step 4: Database Seed — Dev Users
- [x] Create `api/database/seed/005_users.sql`
- [x] 3 users with pre-hashed bcrypt passwords:
  - admin@octocat.com (role: admin)
  - manager@octocat.com (role: manager)
  - user@octocat.com (role: user)
- [x] All passwords: `OctoCAT2024!@` (documented for dev only)

**Stories**: US-02, US-06 (dev/testing)

---

### Step 5: Models — User and AuditLog Interfaces
- [x] Create `api/src/models/user.ts` with: `CreateUserInput`, `UserPublic`, `UserWithHash`
- [x] Create `api/src/models/auditLog.ts` with: `AuditLogEntry`, `AuditLogRecord`, `PaginationOptions`, `PaginatedResult<T>`

**Stories**: All (foundational types)

---

### Step 6: Validators Utility
- [x] Create `api/src/utils/validators.ts`
- [x] Implement `validateEmail(email)` — RFC-compliant regex
- [x] Implement `validatePassword(password)` — 12+ chars, uppercase, lowercase, number, special
- [x] Implement `validateRegistrationInput(input)` — combines all field validations

**Stories**: US-01 (registration validation), US-05 (error handling)

---

### Step 7: Validators Unit Tests
- [x] Create `api/src/utils/validators.test.ts`
- [x] Test valid/invalid emails
- [x] Test password policy (each requirement individually)
- [x] Test registration input (missing fields, invalid combinations)

**Stories**: US-01, US-05

---

### Step 8: Users Repository
- [x] Create `api/src/repositories/usersRepo.ts`
- [x] Implement `UsersRepository` class (follows existing pattern: constructor with `DatabaseConnection`)
- [x] Methods: `create()`, `findByEmail()`, `findByEmailPublic()`
- [x] Use parameterized queries exclusively (Gate 3)
- [x] Never return `password_hash` in public methods

**Stories**: US-01 (create), US-02 (findByEmail), US-03 (findByEmailPublic)

---

### Step 9: Audit Log Repository
- [x] Create `api/src/repositories/auditLogRepo.ts`
- [x] Implement `AuditLogRepository` class
- [x] Methods: `insertLoginEvent()`, `findAll()` (with pagination)
- [x] Append-only pattern (no update/delete methods)
- [x] Use parameterized queries exclusively (Gate 3)

**Stories**: US-06

---

### Step 10: Repository Unit Tests
- [x] Create `api/src/repositories/usersRepo.test.ts`
- [x] Create `api/src/repositories/auditLogRepo.test.ts`
- [x] Test CRUD operations with in-memory SQLite (follows branch.test.ts pattern)
- [x] Test duplicate email constraint
- [x] Test pagination for audit log

**Stories**: US-01, US-06

---

### Step 11: Auth Middleware — verifyToken
- [x] Create `api/src/middleware/auth/verifyToken.ts`
- [x] Read JWT from `token` cookie
- [x] Verify signature with `JWT_SECRET` env var (default: `dev-secret-change-in-production`)
- [x] Verify expiration
- [x] Attach decoded user to `req.user` (email, role)
- [x] Return 401 if missing, invalid, or expired

**Stories**: US-03 (session verification), US-05 (error handling)

---

### Step 12: Auth Middleware — requireRole
- [x] Create `api/src/middleware/auth/requireRole.ts`
- [x] Factory function: `requireRole(...roles)` returns middleware
- [x] Check `req.user.role` against allowed roles
- [x] Return 403 if role mismatch
- [x] Must run AFTER `verifyToken`

**Stories**: US-06 (admin-only audit log)

---

### Step 13: Auth Routes
- [x] Create `api/src/routes/auth.ts`
- [x] `POST /register` — validate → check duplicate → hash → store → 201
- [x] `POST /login` — validate → find user → compare → sign JWT → set cookie → audit → 200
- [x] `POST /logout` — clear cookie → 200
- [x] `GET /me` — verifyToken middleware → find user public → 200

**Stories**: US-01 (register), US-02 (login), US-03 (me), US-04 (logout)

---

### Step 14: Audit Log Routes
- [x] Create `api/src/routes/auditLog.ts`
- [x] `GET /` — verifyToken + requireRole('admin') → paginate → 200
- [x] Parse `page` and `pageSize` from query params (defaults: page=1, pageSize=20)

**Stories**: US-06

---

### Step 15: Modify API Entry Point (index.ts)
- [x] Add `cookie-parser` import and middleware registration (after `express.json()`)
- [x] Import and register auth routes: `app.use('/api/auth', authRoutes)`
- [x] Import and register audit routes: `app.use('/api/audit-log', auditLogRoutes)`

**Stories**: All (route registration)

---

### Step 16: Auth Routes Integration Tests
- [x] Create `api/src/routes/auth.test.ts`
- [x] Test full registration flow (success, duplicate, validation errors)
- [x] Test full login flow (success, wrong password, non-existent email)
- [x] Test session verification (valid token, expired, missing)
- [x] Test logout (cookie cleared)
- [x] Test audit log recording (success and failure events)

**Stories**: US-01, US-02, US-03, US-04, US-05, US-06

---

### Step 17: Audit Log Routes Integration Tests
- [x] Create `api/src/routes/auditLog.test.ts`
- [x] Test admin access (200 with paginated data)
- [x] Test non-admin access (403)
- [x] Test unauthenticated access (401)
- [x] Test pagination params

**Stories**: US-06

---

### Step 18: Frontend AuthContext Refactoring
- [x] Modify `frontend/src/context/AuthContext.tsx` (in-place, NO duplicate file)
- [x] Replace mock logic with real API calls via Axios
- [x] Add TanStack Query: `useQuery` for session (`GET /api/auth/me`)
- [x] Add `useMutation` for login, register, logout
- [x] Export: `user`, `isLoggedIn`, `isAdmin`, `isLoading`, `login`, `register`, `logout`
- [x] Handle session expiration (redirect to login)
- [x] Configure Axios with `withCredentials: true`

**Stories**: US-02, US-03, US-04

---

### Step 19: Frontend Login Component Refactoring
- [x] Modify `frontend/src/components/Login.tsx` (in-place)
- [x] Wire form to `AuthContext.login()` mutation
- [x] Add client-side required field validation
- [x] Display generic error "Credenciales inválidas" on 401
- [x] Redirect to dashboard on success
- [x] Add link to Register page
- [x] Add `data-testid` attributes to all interactive elements

**Stories**: US-02, US-05

---

### Step 20: Frontend Register Component
- [x] Create `frontend/src/components/Register.tsx` (NEW)
- [x] Form fields: email, firstName, lastName, password, confirmPassword
- [x] Client-side validation (email format, password policy display, required fields)
- [x] Wire to `AuthContext.register()` mutation
- [x] Display field-level error messages from API
- [x] Redirect to login on success
- [x] Add link to Login page
- [x] Add `data-testid` attributes to all interactive elements

**Stories**: US-01, US-05

---

### Step 21: Frontend Navigation Update
- [x] Modify `frontend/src/components/Navigation.tsx` (in-place)
- [x] Display authenticated user's first name in header
- [x] Show logout option when authenticated
- [x] Add `data-testid` to user display and logout elements

**Stories**: US-02 (name display), US-04 (logout button)

---

### Step 22: Frontend App Routing Update
- [x] Modify `frontend/src/App.tsx` (in-place)
- [x] Add `/register` route pointing to `Register` component
- [x] Ensure route is accessible without authentication

**Stories**: US-01

---

### Step 23: Frontend Unit Tests
- [x] Create `frontend/src/components/Register.test.tsx`
- [x] Create `frontend/src/components/Login.test.tsx`
- [x] Test form rendering, validation, submission, error display
- [x] Test navigation links between Login ↔ Register
- [x] Use `@testing-library/react` + vitest

**Stories**: US-01, US-02, US-05

---

### Step 24: Code Generation Summary Documentation
- [x] Create `aidlc-docs/construction/auth-module/code/code-summary.md`
- [x] Document all created/modified files
- [x] Document test coverage
- [x] Document story traceability

**Stories**: All

---

## Story Traceability Matrix

| Story | Steps Implementing |
|-------|-------------------|
| US-01 (Registro) | 2, 4, 5, 6, 7, 8, 10, 13, 16, 18, 20, 23 |
| US-02 (Login) | 2, 4, 5, 8, 10, 11, 13, 16, 18, 19, 21, 23 |
| US-03 (Persistencia Sesión) | 8, 11, 13, 16, 18 |
| US-04 (Logout) | 13, 16, 18, 21 |
| US-05 (Manejo Errores) | 6, 7, 11, 12, 13, 16, 19, 20, 23 |
| US-06 (Auditoría) | 3, 5, 9, 10, 12, 13, 14, 17 |

## Extension Compliance

| Gate | Implementation |
|------|---------------|
| Gate 1 — Audit Immutable | Steps 3, 9, 13 (audit_log table, append-only repo, login event recording) |
| Gate 2 — Auth Real | Steps 1, 8, 11, 13 (bcrypt + JWT, no mock) |
| Gate 3 — No SQL Concat | Steps 8, 9 (all queries use parameterized placeholders via `?`) |

## Total Steps: 24
## Estimated Files Created: 20 new
## Estimated Files Modified: 5 existing
