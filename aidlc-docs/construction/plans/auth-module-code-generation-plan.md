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
- [ ] Add `bcryptjs`, `jsonwebtoken`, `cookie-parser` to api/package.json dependencies
- [ ] Add `@types/bcryptjs`, `@types/jsonwebtoken`, `@types/cookie-parser` to api/package.json devDependencies
- [ ] Run `npm install` in api/

**Stories**: US-02 (JWT), US-01 (bcrypt)

---

### Step 2: Database Migration — Users Table
- [ ] Create `api/database/migrations/003_create_users.sql` (SQLite)
- [ ] Create `api/database/migrations-pg/003_create_users.sql` (PostgreSQL)

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
- [ ] Create `api/database/migrations/004_create_audit_log.sql` (SQLite)
- [ ] Create `api/database/migrations-pg/004_create_audit_log.sql` (PostgreSQL)

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
- [ ] Create `api/database/seed/005_users.sql`
- [ ] 3 users with pre-hashed bcrypt passwords:
  - admin@octocat.com (role: admin)
  - manager@octocat.com (role: manager)
  - user@octocat.com (role: user)
- [ ] All passwords: `OctoCAT2024!@` (documented for dev only)

**Stories**: US-02, US-06 (dev/testing)

---

### Step 5: Models — User and AuditLog Interfaces
- [ ] Create `api/src/models/user.ts` with: `CreateUserInput`, `UserPublic`, `UserWithHash`
- [ ] Create `api/src/models/auditLog.ts` with: `AuditLogEntry`, `AuditLogRecord`, `PaginationOptions`, `PaginatedResult<T>`

**Stories**: All (foundational types)

---

### Step 6: Validators Utility
- [ ] Create `api/src/utils/validators.ts`
- [ ] Implement `validateEmail(email)` — RFC-compliant regex
- [ ] Implement `validatePassword(password)` — 12+ chars, uppercase, lowercase, number, special
- [ ] Implement `validateRegistrationInput(input)` — combines all field validations

**Stories**: US-01 (registration validation), US-05 (error handling)

---

### Step 7: Validators Unit Tests
- [ ] Create `api/src/utils/validators.test.ts`
- [ ] Test valid/invalid emails
- [ ] Test password policy (each requirement individually)
- [ ] Test registration input (missing fields, invalid combinations)

**Stories**: US-01, US-05

---

### Step 8: Users Repository
- [ ] Create `api/src/repositories/usersRepo.ts`
- [ ] Implement `UsersRepository` class (follows existing pattern: constructor with `DatabaseConnection`)
- [ ] Methods: `create()`, `findByEmail()`, `findByEmailPublic()`
- [ ] Use parameterized queries exclusively (Gate 3)
- [ ] Never return `password_hash` in public methods

**Stories**: US-01 (create), US-02 (findByEmail), US-03 (findByEmailPublic)

---

### Step 9: Audit Log Repository
- [ ] Create `api/src/repositories/auditLogRepo.ts`
- [ ] Implement `AuditLogRepository` class
- [ ] Methods: `insertLoginEvent()`, `findAll()` (with pagination)
- [ ] Append-only pattern (no update/delete methods)
- [ ] Use parameterized queries exclusively (Gate 3)

**Stories**: US-06

---

### Step 10: Repository Unit Tests
- [ ] Create `api/src/repositories/usersRepo.test.ts`
- [ ] Create `api/src/repositories/auditLogRepo.test.ts`
- [ ] Test CRUD operations with in-memory SQLite (follows branch.test.ts pattern)
- [ ] Test duplicate email constraint
- [ ] Test pagination for audit log

**Stories**: US-01, US-06

---

### Step 11: Auth Middleware — verifyToken
- [ ] Create `api/src/middleware/auth/verifyToken.ts`
- [ ] Read JWT from `token` cookie
- [ ] Verify signature with `JWT_SECRET` env var (default: `dev-secret-change-in-production`)
- [ ] Verify expiration
- [ ] Attach decoded user to `req.user` (email, role)
- [ ] Return 401 if missing, invalid, or expired

**Stories**: US-03 (session verification), US-05 (error handling)

---

### Step 12: Auth Middleware — requireRole
- [ ] Create `api/src/middleware/auth/requireRole.ts`
- [ ] Factory function: `requireRole(...roles)` returns middleware
- [ ] Check `req.user.role` against allowed roles
- [ ] Return 403 if role mismatch
- [ ] Must run AFTER `verifyToken`

**Stories**: US-06 (admin-only audit log)

---

### Step 13: Auth Routes
- [ ] Create `api/src/routes/auth.ts`
- [ ] `POST /register` — validate → check duplicate → hash → store → 201
- [ ] `POST /login` — validate → find user → compare → sign JWT → set cookie → audit → 200
- [ ] `POST /logout` — clear cookie → 200
- [ ] `GET /me` — verifyToken middleware → find user public → 200

**Stories**: US-01 (register), US-02 (login), US-03 (me), US-04 (logout)

---

### Step 14: Audit Log Routes
- [ ] Create `api/src/routes/auditLog.ts`
- [ ] `GET /` — verifyToken + requireRole('admin') → paginate → 200
- [ ] Parse `page` and `pageSize` from query params (defaults: page=1, pageSize=20)

**Stories**: US-06

---

### Step 15: Modify API Entry Point (index.ts)
- [ ] Add `cookie-parser` import and middleware registration (after `express.json()`)
- [ ] Import and register auth routes: `app.use('/api/auth', authRoutes)`
- [ ] Import and register audit routes: `app.use('/api/audit-log', auditLogRoutes)`

**Stories**: All (route registration)

---

### Step 16: Auth Routes Integration Tests
- [ ] Create `api/src/routes/auth.test.ts`
- [ ] Test full registration flow (success, duplicate, validation errors)
- [ ] Test full login flow (success, wrong password, non-existent email)
- [ ] Test session verification (valid token, expired, missing)
- [ ] Test logout (cookie cleared)
- [ ] Test audit log recording (success and failure events)

**Stories**: US-01, US-02, US-03, US-04, US-05, US-06

---

### Step 17: Audit Log Routes Integration Tests
- [ ] Create `api/src/routes/auditLog.test.ts`
- [ ] Test admin access (200 with paginated data)
- [ ] Test non-admin access (403)
- [ ] Test unauthenticated access (401)
- [ ] Test pagination params

**Stories**: US-06

---

### Step 18: Frontend AuthContext Refactoring
- [ ] Modify `frontend/src/context/AuthContext.tsx` (in-place, NO duplicate file)
- [ ] Replace mock logic with real API calls via Axios
- [ ] Add TanStack Query: `useQuery` for session (`GET /api/auth/me`)
- [ ] Add `useMutation` for login, register, logout
- [ ] Export: `user`, `isLoggedIn`, `isAdmin`, `isLoading`, `login`, `register`, `logout`
- [ ] Handle session expiration (redirect to login)
- [ ] Configure Axios with `withCredentials: true`

**Stories**: US-02, US-03, US-04

---

### Step 19: Frontend Login Component Refactoring
- [ ] Modify `frontend/src/components/Login.tsx` (in-place)
- [ ] Wire form to `AuthContext.login()` mutation
- [ ] Add client-side required field validation
- [ ] Display generic error "Credenciales inválidas" on 401
- [ ] Redirect to dashboard on success
- [ ] Add link to Register page
- [ ] Add `data-testid` attributes to all interactive elements

**Stories**: US-02, US-05

---

### Step 20: Frontend Register Component
- [ ] Create `frontend/src/components/Register.tsx` (NEW)
- [ ] Form fields: email, firstName, lastName, password, confirmPassword
- [ ] Client-side validation (email format, password policy display, required fields)
- [ ] Wire to `AuthContext.register()` mutation
- [ ] Display field-level error messages from API
- [ ] Redirect to login on success
- [ ] Add link to Login page
- [ ] Add `data-testid` attributes to all interactive elements

**Stories**: US-01, US-05

---

### Step 21: Frontend Navigation Update
- [ ] Modify `frontend/src/components/Navigation.tsx` (in-place)
- [ ] Display authenticated user's first name in header
- [ ] Show logout option when authenticated
- [ ] Add `data-testid` to user display and logout elements

**Stories**: US-02 (name display), US-04 (logout button)

---

### Step 22: Frontend App Routing Update
- [ ] Modify `frontend/src/App.tsx` (in-place)
- [ ] Add `/register` route pointing to `Register` component
- [ ] Ensure route is accessible without authentication

**Stories**: US-01

---

### Step 23: Frontend Unit Tests
- [ ] Create `frontend/src/components/Register.test.tsx`
- [ ] Create `frontend/src/components/Login.test.tsx`
- [ ] Test form rendering, validation, submission, error display
- [ ] Test navigation links between Login ↔ Register
- [ ] Use `@testing-library/react` + vitest

**Stories**: US-01, US-02, US-05

---

### Step 24: Code Generation Summary Documentation
- [ ] Create `aidlc-docs/construction/auth-module/code/code-summary.md`
- [ ] Document all created/modified files
- [ ] Document test coverage
- [ ] Document story traceability

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
