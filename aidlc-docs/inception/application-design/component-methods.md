# Component Methods — Autenticación Persistente

## Method Signatures by Component

> **Note**: This document defines method interfaces and high-level purpose. Detailed business rules and logic implementation will be specified during Code Generation.

---

## 1. UsersRepository

```typescript
class UsersRepository {
  constructor(db: DatabaseConnection)

  /**
   * Create a new user record
   * @param user - User data (email, passwordHash, firstName, lastName, role)
   * @returns Created user (without passwordHash)
   */
  async create(user: CreateUserInput): Promise<UserPublic>

  /**
   * Find user by email (includes passwordHash for auth comparison)
   * @param email - User's email address
   * @returns Full user record or null if not found
   */
  async findByEmail(email: string): Promise<UserWithHash | null>

  /**
   * Find user by email (public fields only, no passwordHash)
   * @param email - User's email address
   * @returns Public user data or null
   */
  async findByEmailPublic(email: string): Promise<UserPublic | null>
}
```

### Types

```typescript
interface CreateUserInput {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'manager' | 'user';
}

interface UserPublic {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

interface UserWithHash extends UserPublic {
  passwordHash: string;
}
```

---

## 2. AuditLogRepository

```typescript
class AuditLogRepository {
  constructor(db: DatabaseConnection)

  /**
   * Insert a login audit event (append-only)
   * @param entry - Audit log entry data
   * @returns void (fire-and-forget, should not block auth flow)
   */
  async insertLoginEvent(entry: AuditLogEntry): Promise<void>

  /**
   * Query audit log entries with pagination (admin only)
   * @param options - Pagination options (page, pageSize)
   * @returns Paginated list of audit entries + total count
   */
  async findAll(options: PaginationOptions): Promise<PaginatedResult<AuditLogRecord>>
}
```

### Types

```typescript
interface AuditLogEntry {
  tableName: 'auth';
  operation: 'LOGIN_SUCCESS' | 'LOGIN_FAILED';
  recordId: string;        // email attempted
  userId: string | null;   // authenticated email (null for failed)
  oldValues: null;
  newValues: string;       // JSON: { ip, userAgent, timestamp }
}

interface AuditLogRecord {
  id: number;
  tableName: string;
  operation: string;
  recordId: string;
  userId: string | null;
  oldValues: string | null;
  newValues: string | null;
  timestamp: string;
}

interface PaginationOptions {
  page: number;    // 1-based
  pageSize: number; // default 20
}

interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
```

---

## 3. Auth Routes (`/api/auth/*`)

```typescript
// POST /api/auth/register
async function registerHandler(req: Request, res: Response): Promise<void>
// Input: req.body { email, password, firstName, lastName }
// Output: 201 { email, firstName, lastName, role } | 400 (validation) | 409 (duplicate)

// POST /api/auth/login
async function loginHandler(req: Request, res: Response): Promise<void>
// Input: req.body { email, password }
// Output: 200 + Set-Cookie (JWT) { email, firstName, lastName, role } | 401

// POST /api/auth/logout
async function logoutHandler(req: Request, res: Response): Promise<void>
// Input: none (cookie cleared server-side)
// Output: 200 { message: "Sesión cerrada" } + cleared cookie

// GET /api/auth/me
async function meHandler(req: Request, res: Response): Promise<void>
// Input: JWT from cookie (auto-parsed by cookie-parser)
// Output: 200 { email, firstName, lastName, role } | 401
```

---

## 4. Audit Log Routes (`/api/audit-log`)

```typescript
// GET /api/audit-log
// Protected: verifyToken + requireRole('admin')
async function getAuditLogHandler(req: Request, res: Response): Promise<void>
// Input: query params { page?: number, pageSize?: number }
// Output: 200 { data: AuditLogRecord[], total, page, pageSize, totalPages } | 401 | 403
```

---

## 5. Auth Middleware — verifyToken

```typescript
/**
 * Express middleware that verifies JWT from httpOnly cookie.
 * Attaches decoded user to req.user if valid.
 * Returns 401 if token is missing, invalid, or expired.
 */
function verifyToken(req: Request, res: Response, next: NextFunction): void
```

### Extended Request Type

```typescript
interface AuthenticatedRequest extends Request {
  user: {
    email: string;
    role: string;
  };
}
```

---

## 6. Auth Middleware — requireRole

```typescript
/**
 * Factory function that returns middleware enforcing role-based access.
 * Must be used AFTER verifyToken in middleware chain.
 * @param roles - One or more roles allowed to access the endpoint
 * @returns Express middleware that checks req.user.role
 */
function requireRole(...roles: string[]): (req: Request, res: Response, next: NextFunction) => void
```

---

## 7. Validators Utility

```typescript
/**
 * Validate email format
 * @param email - Email string to validate
 * @returns null if valid, error message string if invalid
 */
function validateEmail(email: string): string | null

/**
 * Validate password against policy
 * @param password - Password to validate
 * @returns null if valid, array of unmet requirements if invalid
 */
function validatePassword(password: string): string[] | null

/**
 * Validate complete registration input
 * @param input - Registration form data
 * @returns null if valid, object with field-level errors if invalid
 */
function validateRegistrationInput(input: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}): Record<string, string> | null
```

---

## 8. Frontend AuthContext (Refactored)

```typescript
interface AuthUser {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}
```

### Internal Hooks (TanStack Query)

```typescript
// Session verification on mount
useQuery({
  queryKey: ['auth', 'me'],
  queryFn: () => axios.get('/api/auth/me'),
  retry: false,
  staleTime: Infinity,
})

// Login mutation
useMutation({
  mutationFn: (credentials: { email: string; password: string }) =>
    axios.post('/api/auth/login', credentials),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['auth', 'me'] }),
})

// Logout mutation
useMutation({
  mutationFn: () => axios.post('/api/auth/logout'),
  onSuccess: () => queryClient.setQueryData(['auth', 'me'], null),
})
```

---

## 9. Register Component

```typescript
// No exported methods — page component
// Internal form state: email, firstName, lastName, password, confirmPassword
// Validation: client-side mirrors API password policy
// On submit: calls AuthContext.register()
// On success: redirects to /login
// On error: displays field-level errors from API response
```

---

## 10. Login Component (Refactored)

```typescript
// No exported methods — page component
// Internal form state: email, password
// Validation: client-side required fields only
// On submit: calls AuthContext.login()
// On success: redirects to / (dashboard)
// On error: displays generic "Credenciales inválidas"
```
