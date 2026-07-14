# Services — Autenticación Persistente

## Service Layer Decision

**Decision**: No dedicated service layer (Q1: A — Direct orchestration in route handlers)

The auth module follows the same pattern as existing routes (`supplier.ts`, `branch.ts`, etc.) where route handlers directly orchestrate repository calls and utilities. This keeps the architecture consistent with the existing codebase and avoids introducing a new abstraction layer for a single-purpose module.

---

## Orchestration Patterns

Instead of a service class, the auth module uses **route-level orchestration** — each route handler contains the workflow logic for its operation.

### Registration Flow (POST /api/auth/register)

```
Route Handler: registerHandler
  1. Validate input (validators.validateRegistrationInput)
  2. Check email uniqueness (usersRepo.findByEmail)
  3. Hash password (bcrypt.hash)
  4. Store user (usersRepo.create)
  5. Return 201 with public user data
```

### Login Flow (POST /api/auth/login)

```
Route Handler: loginHandler
  1. Validate required fields (email, password present)
  2. Find user by email (usersRepo.findByEmail)
  3. Compare password hash (bcrypt.compare)
  4. Sign JWT (jsonwebtoken.sign)
  5. Set httpOnly cookie
  6. Record audit event — SUCCESS (auditLogRepo.insertLoginEvent)
  7. Return 200 with user data

  On failure (step 2 or 3):
  6a. Record audit event — FAILED (auditLogRepo.insertLoginEvent)
  7a. Return 401 generic error
```

### Session Check Flow (GET /api/auth/me)

```
Route Handler: meHandler
  1. Middleware verifyToken extracts user from JWT cookie
  2. Find user public data (usersRepo.findByEmailPublic)
  3. Return 200 with user data

  On failure (middleware):
  1a. Return 401 (handled by verifyToken middleware)
```

### Logout Flow (POST /api/auth/logout)

```
Route Handler: logoutHandler
  1. Clear cookie (Set-Cookie with Max-Age=0)
  2. Return 200 with confirmation message
```

### Audit Log Query Flow (GET /api/audit-log)

```
Route Handler: getAuditLogHandler
  1. Middleware verifyToken validates JWT
  2. Middleware requireRole('admin') checks role
  3. Parse pagination params from query string
  4. Query audit log (auditLogRepo.findAll)
  5. Return 200 with paginated results

  On failure:
  1a. Return 401 (verifyToken)
  2a. Return 403 (requireRole)
```

---

## Cross-Cutting Concerns

### Error Handling
- Route handlers use try/catch with the existing `handleDatabaseError` utility
- Validation errors: 400 with structured field-level messages
- Auth errors: 401 with generic message (no information leakage)
- Role errors: 403 Forbidden
- All unexpected errors: caught by existing `errorHandler` middleware in `index.ts`

### Audit Logging
- Audit insertion is fire-and-forget: if audit INSERT fails, the login response is NOT affected
- Audit errors are logged to console but do not propagate to the client

### Cookie Management
- `cookie-parser` middleware (registered globally in `index.ts`) handles parsing
- Cookie setting/clearing is done directly in route handlers via `res.cookie()` / `res.clearCookie()`

---

## Why No Service Layer

| Factor | Assessment |
|--------|-----------|
| **Consistency** | Existing codebase has no service layer — routes call repos directly |
| **Complexity** | Auth flows are linear (no complex orchestration between multiple services) |
| **Testability** | Route integration tests (Supertest) already cover the full flow. Validators are tested in isolation. |
| **Future-proofing** | If auth grows (OAuth, MFA), a service layer can be extracted then without breaking changes |
| **YAGNI** | Adding a service layer now adds indirection without clear benefit for this scope |
