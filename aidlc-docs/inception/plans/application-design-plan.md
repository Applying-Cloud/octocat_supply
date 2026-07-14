# Application Design Plan — Autenticación Persistente

## Design Plan (Checkboxes)

### Phase 1: Component Identification
- [x] Identify new backend components (auth routes, users repo, audit repo, auth middleware)
- [x] Define component boundaries and responsibilities
- [x] Map integration points with existing components

### Phase 2: Component Methods
- [x] Define UsersRepository method signatures (create, findByEmail)
- [x] Define AuditLogRepository method signatures (insertLoginEvent, findAll)
- [x] Define Auth route handler signatures (register, login, logout, me)
- [x] Define Auth middleware signature (verifyToken)
- [x] Define validation utility signatures (validateEmail, validatePassword)

### Phase 3: Service Layer Design
- [x] Define AuthService orchestration (login flow: validate → compare → sign JWT → audit)
- [x] Define Registration flow orchestration (validate → hash → store → respond)
- [x] Determine service vs route-level orchestration pattern

### Phase 4: Component Dependencies
- [x] Map dependencies: routes → service/repos → DB
- [x] Map dependencies: middleware → JWT verification
- [x] Map frontend → API contract (endpoints, cookies)
- [x] Generate dependency diagram

### Phase 5: Design Artifacts Generation
- [x] Generate components.md
- [x] Generate component-methods.md
- [x] Generate services.md
- [x] Generate component-dependency.md
- [x] Generate consolidated application-design.md
- [x] Validate design completeness and consistency

---

## Design Questions

Please answer the following questions to clarify design decisions that are not fully resolved by the existing requirements.

## Question 1
What orchestration pattern should the auth routes use?

A) Direct orchestration in route handlers (route calls repo directly, like existing `supplier.ts` pattern)

B) Service layer abstraction (route calls AuthService, service calls repos — adds a `services/` layer)

C) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 2
Where should password validation and email validation logic reside?

A) Inline in the route handler (simple, all validation in one place)

B) Separate utility module `api/src/utils/validators.ts` (reusable, testable in isolation)

C) Inside the repository (validate before storing)

D) Other (please describe after [Answer]: tag below)

[Answer]: B

## Question 3
How should the auth middleware (JWT verification) be organized?

A) Single file `api/src/middleware/authMiddleware.ts` exporting one `verifyToken` middleware function

B) Expanded middleware directory with separate files for auth concerns (`middleware/auth/verifyToken.ts`, `middleware/auth/requireRole.ts`)

C) Other (please describe after [Answer]: tag below)

[Answer]: B

## Question 4
How should the frontend handle auth state loading (the initial `GET /api/auth/me` check on app load)?

A) TanStack Query with `useQuery` in AuthProvider — auto-retries, caching, loading states built-in

B) Simple `useEffect` + `fetch` in AuthProvider — minimal, no extra dependency usage for this specific call

C) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 5
Should the Registration page be a new standalone component, or integrated into the existing Login component?

A) New standalone `Register.tsx` component with its own route (`/register`)

B) Combined Login/Register component with tabs or toggle within the existing `Login.tsx`

C) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 6
For the audit log query endpoint (`GET /api/audit-log`), what access control pattern should be used?

A) Inline role check in the route handler (simple `if (user.role !== 'admin') return 403`)

B) Reuse the auth middleware with a `requireRole('admin')` higher-order function for composability

C) Other (please describe after [Answer]: tag below)

[Answer]: B

## Question 7
How should the API handle the `cookie-parser` dependency for reading httpOnly cookies?

A) Add `cookie-parser` middleware (standard npm package, simple cookie read/write)

B) Manual cookie parsing from `req.headers.cookie` (no new dependency, but more code)

C) Other (please describe after [Answer]: tag below)

[Answer]: A

