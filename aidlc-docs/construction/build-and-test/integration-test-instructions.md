# Integration Test Instructions

## Purpose

Integration tests verify that modules work correctly together — testing real HTTP endpoints, database interactions, middleware chains, and cross-layer communication. This project uses two levels of integration testing:

1. **API Integration Tests** (Supertest): Test full HTTP request/response cycles through Express routes with a real in-memory SQLite database
2. **End-to-End Tests** (Playwright): Test complete user workflows through the browser against running API + Frontend servers

---

## API Integration Tests

### Overview

API integration tests exercise the full stack within the API layer:
- HTTP request → Express middleware → Route handler → Repository → SQLite (in-memory) → Response

No external services are required — each test creates a fresh in-memory SQLite database.

### Test Files

| File | Scenarios | Tests | Coverage |
|------|-----------|-------|----------|
| `api/src/routes/auth.test.ts` | Register, Login, Me, Logout flows | 16 | Full auth lifecycle |
| `api/src/routes/auditLog.test.ts` | Admin access, forbidden, pagination | 5 | Role-based access + audit data |
| `api/src/routes/branch.test.ts` | Existing branch CRUD | 10 | Pre-existing endpoint tests |

### Key Integration Scenarios

#### Scenario 1: Complete Authentication Flow
- **Description**: Register → Login → Access protected resource → Logout → Verify session cleared
- **Components**: auth router, verifyToken middleware, usersRepo, bcryptjs, jsonwebtoken, cookie-parser
- **Verified by**: `auth.test.ts` — tests the full register→login→me→logout lifecycle

#### Scenario 2: Role-Based Access Control
- **Description**: Admin accesses audit log (200) vs regular user (403) vs unauthenticated (401)
- **Components**: auth router, auditLog router, verifyToken middleware, requireRole middleware
- **Verified by**: `auditLog.test.ts` — tests authorization enforcement across routes

#### Scenario 3: Audit Log Recording
- **Description**: Login events automatically recorded in audit_log, visible to admin
- **Components**: auth router (inserts audit on login), auditLogRepo, auditLog router (reads audit)
- **Verified by**: `auditLog.test.ts` — "should contain login audit entries" verifies LOGIN_SUCCESS appears

#### Scenario 4: Error Handling Chain
- **Description**: Invalid inputs return proper error responses without leaking internals
- **Components**: validators, route handlers, errorHandler middleware
- **Verified by**: `auth.test.ts` — duplicate email (409), invalid credentials (401), missing fields (400)

### Run API Integration Tests

```bash
make test-api
```

Or run specific integration test files:

```bash
cd api && npx vitest run src/routes/auth.test.ts
cd api && npx vitest run src/routes/auditLog.test.ts
```

### Expected Results

```
✓ src/routes/auth.test.ts (16 tests)
✓ src/routes/auditLog.test.ts (5 tests)
✓ src/routes/branch.test.ts (10 tests)

Tests  31 passed
```

### Setup Notes

- **No server startup required** — tests create their own Express app instance
- **Database**: Each `beforeEach` creates a fresh in-memory SQLite database via `getDatabase(true)`
- **Migrations**: Applied automatically in each test setup via `runMigrations(true)`
- **Cleanup**: `afterEach` calls `closeDatabase()` to release resources
- **JWT_SECRET**: Tests use a hardcoded test secret internally (no env var needed)

---

## End-to-End Tests (Playwright)

### Overview

E2E tests run in a real browser against the full running application (API + Frontend). They validate complete user journeys.

### Test Files

| File | Scenarios | Description |
|------|-----------|-------------|
| `frontend/tests/e2e/product-navigation.spec.ts` | Product browsing | Existing navigation tests |

### Prerequisites

1. **Install Playwright browsers** (first time only):
   ```bash
   cd frontend && npx playwright install --with-deps chromium
   ```

2. **Environment**: Playwright automatically starts the dev servers via the `webServer` config (runs `make dev` in the background)

### Run E2E Tests

```bash
make test-e2e
```

Or directly:

```bash
cd frontend && npx playwright test
```

### Configuration

| Setting | Value |
|---------|-------|
| **Test directory** | `frontend/tests/e2e/` |
| **Base URL** | `http://localhost:5137` (configurable via `PLAYWRIGHT_BASE_URL`) |
| **Browsers** | Chromium, Microsoft Edge |
| **Timeout** | 60s per test, 10s for assertions |
| **Web server** | Auto-starts `make dev` (API port 3000 + Frontend port 5137) |
| **Reports** | `frontend/playwright-report/` (HTML) |
| **Artifacts** | Screenshots on failure, video on failure, traces on retry |

### Skip Auto Web Server

If servers are already running:

```bash
cd frontend && PLAYWRIGHT_WEB_SERVER=false npx playwright test
```

### View Report

After running tests:

```bash
cd frontend && npx playwright show-report
```

---

## Troubleshooting

### API Integration Tests Fail with "SQLITE_ERROR"
- **Cause**: Migration files not found or schema issue
- **Solution**: Ensure `api/database/migrations/` contains all `.sql` files (001–004)

### API Tests Fail with Import Errors
- **Cause**: Missing dependencies
- **Solution**: `cd api && npm install`

### E2E Tests Timeout on Web Server Start
- **Cause**: Dev server takes too long to start or port conflict
- **Solution**:
  1. Start servers manually: `make dev`
  2. Run tests with `PLAYWRIGHT_WEB_SERVER=false`
  3. Check no other process uses ports 3000 or 5137

### E2E Tests Fail with Browser Errors
- **Cause**: Playwright browsers not installed
- **Solution**: `cd frontend && npx playwright install --with-deps chromium`

---

## Adding New Integration Tests

When adding new integration tests, follow these patterns:

### API Integration Test Template

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import { runMigrations } from '../db/migrate';
import { closeDatabase, getDatabase } from '../db';
import { errorHandler } from '../utils/errors';

let app: express.Express;

describe('New Feature API', () => {
  beforeEach(async () => {
    await closeDatabase();
    await getDatabase(true); // in-memory
    await runMigrations(true);

    app = express();
    app.use(express.json());
    app.use(cookieParser());
    // Mount routes under test
    app.use(errorHandler);
  });

  afterEach(async () => {
    await closeDatabase();
  });

  it('should do something', async () => {
    const response = await request(app).get('/endpoint');
    expect(response.status).toBe(200);
  });
});
```

### E2E Test Template (Playwright)

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should complete user workflow', async ({ page }) => {
    await page.goto('/');
    // Interact with UI
    await expect(page.locator('[data-testid="element"]')).toBeVisible();
  });
});
```
