# Components — Autenticación Persistente

## Component Overview

This design introduces 7 new backend components and modifies 3 existing frontend components to replace the mock authentication with real JWT-based persistent authentication.

---

## New Backend Components

### 1. Auth Routes (`api/src/routes/auth.ts`)

| Attribute | Value |
|-----------|-------|
| **Type** | Route Handler |
| **Purpose** | HTTP endpoints for authentication operations (register, login, logout, session check) |
| **Pattern** | Express Router (consistent with existing routes like `supplier.ts`) |
| **Orchestration** | Direct — route handlers call repositories and utilities directly (no service layer) |

**Responsibilities:**
- Handle HTTP requests for `/api/auth/*` endpoints
- Validate request bodies using validators utility
- Orchestrate authentication flow (hash, compare, sign JWT, set cookies)
- Return appropriate HTTP responses with correct status codes
- Record login audit events (success/failure)

---

### 2. Audit Log Routes (`api/src/routes/auditLog.ts`)

| Attribute | Value |
|-----------|-------|
| **Type** | Route Handler |
| **Purpose** | HTTP endpoint for querying audit log entries (admin only) |
| **Pattern** | Express Router |
| **Access Control** | Protected by `verifyToken` + `requireRole('admin')` middleware |

**Responsibilities:**
- Handle HTTP request for `GET /api/audit-log`
- Apply pagination parameters (page, pageSize)
- Return audit log entries ordered by timestamp descending

---

### 3. Users Repository (`api/src/repositories/usersRepo.ts`)

| Attribute | Value |
|-----------|-------|
| **Type** | Repository |
| **Purpose** | Data access layer for `users` table |
| **Pattern** | Class-based repository with `DatabaseConnection` injection (consistent with `SuppliersRepository`) |
| **Database** | Dual: SQLite (dev/test) + PostgreSQL (prod) |

**Responsibilities:**
- Create new user records (INSERT)
- Find user by email (SELECT)
- Never return `password_hash` in public-facing queries
- Use parameterized queries exclusively (Gate 3)

---

### 4. Audit Log Repository (`api/src/repositories/auditLogRepo.ts`)

| Attribute | Value |
|-----------|-------|
| **Type** | Repository |
| **Purpose** | Data access layer for `audit_log` table (append-only) |
| **Pattern** | Class-based repository with `DatabaseConnection` injection |
| **Constraint** | INSERT-only — no UPDATE or DELETE operations |

**Responsibilities:**
- Insert login audit events (LOGIN_SUCCESS, LOGIN_FAILED)
- Query audit log entries with pagination (admin endpoint)
- Capture metadata: IP address, user-agent, timestamp
- Use parameterized queries exclusively (Gate 3)

---

### 5. Auth Middleware — Verify Token (`api/src/middleware/auth/verifyToken.ts`)

| Attribute | Value |
|-----------|-------|
| **Type** | Express Middleware |
| **Purpose** | Verify JWT from httpOnly cookie on protected routes |
| **Pattern** | Standard Express middleware function `(req, res, next)` |
| **Location** | `api/src/middleware/auth/` directory |

**Responsibilities:**
- Read JWT from `token` cookie (via cookie-parser)
- Verify JWT signature using `JWT_SECRET` env variable
- Verify token expiration
- Attach decoded user info to `req` (email, role)
- Return 401 if token is missing, invalid, or expired

---

### 6. Auth Middleware — Require Role (`api/src/middleware/auth/requireRole.ts`)

| Attribute | Value |
|-----------|-------|
| **Type** | Express Middleware Factory (Higher-Order Function) |
| **Purpose** | Role-based access control for protected endpoints |
| **Pattern** | Factory function returning middleware: `requireRole('admin') => (req, res, next)` |
| **Location** | `api/src/middleware/auth/` directory |

**Responsibilities:**
- Check `req.user.role` against required role(s)
- Return 403 Forbidden if role mismatch
- Must be used AFTER `verifyToken` middleware in chain

---

### 7. Validators Utility (`api/src/utils/validators.ts`)

| Attribute | Value |
|-----------|-------|
| **Type** | Utility Module |
| **Purpose** | Reusable validation functions for email format and password policy |
| **Pattern** | Pure functions (no side effects, easily testable) |
| **Location** | `api/src/utils/validators.ts` |

**Responsibilities:**
- Validate email format (RFC-compliant regex)
- Validate password policy (12+ chars, uppercase, lowercase, number, special char)
- Return structured validation errors (field-level messages)

---

## Modified Frontend Components

### 8. AuthContext (`frontend/src/context/AuthContext.tsx`)

| Attribute | Value |
|-----------|-------|
| **Type** | React Context Provider |
| **Purpose** | Global authentication state management |
| **Change Type** | Major refactoring (replace mock with real API calls) |
| **State Management** | TanStack Query (`useQuery` for session, `useMutation` for login/register/logout) |

**Responsibilities:**
- On mount: verify existing session via `GET /api/auth/me` (TanStack Query)
- Expose `login`, `logout`, `register` mutations
- Expose `user` state (email, firstName, lastName, role) and `isLoading` state
- Expose `isLoggedIn` and `isAdmin` computed values
- Handle session expiration (redirect to login)

---

### 9. Login Component (`frontend/src/components/Login.tsx`)

| Attribute | Value |
|-----------|-------|
| **Type** | Page Component |
| **Purpose** | User login form |
| **Change Type** | Major refactoring (wire to real auth API) |

**Responsibilities:**
- Render login form (email + password)
- Client-side validation (required fields)
- Call `login` mutation from AuthContext
- Display error messages (generic "Credenciales inválidas")
- Redirect to dashboard on success
- Link to Register page

---

### 10. Register Component (`frontend/src/components/Register.tsx`)

| Attribute | Value |
|-----------|-------|
| **Type** | Page Component (NEW) |
| **Purpose** | User self-registration form |
| **Route** | `/register` |

**Responsibilities:**
- Render registration form (email, firstName, lastName, password, confirmPassword)
- Client-side validation (email format, password policy display, field required)
- Call `POST /api/auth/register` via mutation
- Display field-level error messages from API
- Redirect to login on success
- Link to Login page

---

## Supporting Changes (Minimal Modifications)

### 11. Navigation Component (`frontend/src/components/Navigation.tsx`)
- **Change**: Display authenticated user's name in header
- **Impact**: Minor — read `user.firstName` from AuthContext

### 12. App Component (`frontend/src/App.tsx`)
- **Change**: Add `/register` route pointing to `Register.tsx`
- **Impact**: Minor — one new Route entry

### 13. API Index (`api/src/index.ts`)
- **Change**: Register auth routes (`app.use('/api/auth', authRoutes)`) and audit routes (`app.use('/api/audit-log', auditLogRoutes)`)
- **Impact**: Minor — two new route registrations + cookie-parser middleware

---

## Database Components (Migrations)

### 14. Migration: `003_create_users.sql`
- Creates `users` table per REQ-FR-01
- Dual: SQLite (`database/migrations/`) + PostgreSQL (`database/migrations-pg/`)

### 15. Migration: `004_create_audit_log.sql`
- Creates `audit_log` table per REQ-FR-08
- Dual: SQLite (`database/migrations/`) + PostgreSQL (`database/migrations-pg/`)

### 16. Seed: `005_users.sql`
- Inserts 3 dev users with pre-hashed bcrypt passwords per REQ-FR-06
