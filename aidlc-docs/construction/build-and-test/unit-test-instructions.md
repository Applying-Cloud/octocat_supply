# Unit Test Execution

## Overview

Unit tests validate individual modules in isolation. The project uses **Vitest** for both API and Frontend unit testing.

| Layer | Framework | Environment | Tests |
|-------|-----------|-------------|-------|
| API — Validators | Vitest | Node.js | 24 |
| API — Repositories | Vitest + SQLite in-memory | Node.js | 12 |
| Frontend — Components | Vitest + jsdom + React Testing Library | jsdom | 12 |

## Run All Unit Tests

### Full Test Suite (API + Frontend)

```bash
make test
```

### API Tests Only

```bash
make test-api
```

Or directly:

```bash
cd api && npx vitest run
```

### Frontend Tests Only

```bash
make test-frontend
```

Or directly:

```bash
cd frontend && npx vitest run
```

## API Unit Tests

### Test Files

| File | Area | Tests | Description |
|------|------|-------|-------------|
| `src/utils/validators.test.ts` | Validation | 24 | Email format, password policy (12+ chars, uppercase, lowercase, number, special char) |
| `src/repositories/usersRepo.test.ts` | Data Access | 6 | Create user, find by email, duplicate detection |
| `src/repositories/auditLogRepo.test.ts` | Data Access | 6 | Insert login events, paginated listing |
| `src/repositories/suppliersRepo.test.ts` | Data Access | 8 | Existing supplier CRUD operations |
| `src/routes/branch.test.ts` | Routes | 10 | Existing branch endpoint tests |

### Running with Coverage

```bash
make test-coverage
```

Or directly:

```bash
cd api && npx vitest run --coverage
```

**Coverage report locations**:
- Terminal: Text summary printed to stdout
- HTML: `api/coverage/index.html`
- JSON: `api/coverage/coverage-summary.json`

### Expected API Results

```
✓ src/utils/validators.test.ts (24 tests)
✓ src/repositories/usersRepo.test.ts (6 tests)
✓ src/repositories/auditLogRepo.test.ts (6 tests)
✓ src/repositories/suppliersRepo.test.ts (8 tests)
✓ src/routes/branch.test.ts (10 tests)

Test Files  5 passed
Tests       54 passed
```

## Frontend Unit Tests

### Test Files

| File | Area | Tests | Description |
|------|------|-------|-------------|
| `src/components/Login.test.tsx` | Component | 5 | Login form rendering, validation, error display, redirect |
| `src/components/Register.test.tsx` | Component | 7 | Registration form, field validation, password mismatch, success redirect |

### Test Configuration

- **Environment**: jsdom (simulates browser DOM)
- **Setup file**: `src/test/setup.ts` (imports `@testing-library/jest-dom`)
- **Globals**: `true` (Vitest globals like `describe`, `it`, `expect` available without import)
- **Excludes**: `tests/e2e/**` (Playwright E2E tests run separately)

### Expected Frontend Results

```
✓ src/components/Login.test.tsx (5 tests)
✓ src/components/Register.test.tsx (7 tests)

Test Files  2 passed
Tests       12 passed
```

## Watch Mode (Development)

For active development, run tests in watch mode:

```bash
# API
cd api && npx vitest

# Frontend
cd frontend && npx vitest
```

Tests re-run automatically when source files change.

## Fix Failing Tests

If tests fail:

1. **Read the error output** — Vitest shows the failing assertion, expected vs. received values, and stack trace
2. **Check environment**:
   - API tests require no external services (SQLite in-memory)
   - Frontend tests require `@testing-library/jest-dom` installed
3. **Common issues**:
   - Missing `JWT_SECRET` env var → set to any string for tests (tests create their own tokens)
   - Import resolution errors → run `npm install` in the affected directory
   - Stale compilation → delete `api/dist/` and rebuild
4. **Run single file** for focused debugging:
   ```bash
   cd api && npx vitest run src/utils/validators.test.ts
   cd frontend && npx vitest run src/components/Login.test.tsx
   ```

## Test Quality Checks

| Criterion | Expected | How to Verify |
|-----------|----------|---------------|
| All tests pass | 0 failures | `make test` exits with code 0 |
| No skipped tests | 0 skipped | Check Vitest output for "skipped" |
| Coverage ≥ auth module | New code covered | `make test-coverage`, check `api/coverage/index.html` |
| No test interdependence | Tests pass individually | Run each file in isolation |
