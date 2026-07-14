# Build Instructions

## Prerequisites

- **Node.js**: 18+ (with npm)
- **Make**: GNU Make (included in most Linux/macOS; Git Bash or WSL on Windows)
- **Disk Space**: ~500 MB (node_modules for both API and Frontend)
- **OS**: Linux, macOS, or Windows (with Git Bash / WSL)

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `JWT_SECRET` | Yes (runtime) | — | Secret key for JWT signing (HS256). Not needed for build, required for runtime/tests. |
| `DB_FILE` | No | `api/data/app.db` | SQLite database file path |
| `DB_ENABLE_WAL` | No | `true` | Enable WAL mode for SQLite |
| `DB_FOREIGN_KEYS` | No | `true` | Enable foreign key enforcement |
| `VITE_API_URL` | No | `http://localhost:3000` | API URL for frontend development |

## Build Steps

### 1. Install Dependencies

```bash
make install
```

This installs npm packages for both `api/` and `frontend/` projects.

Alternatively, install individually:

```bash
cd api && npm install
cd frontend && npm install
```

### 2. Build All Projects

```bash
make build
```

This compiles both projects:
- **API**: Runs `tsc` to compile TypeScript to `api/dist/`
- **Frontend**: Runs `tsc -b && vite build` to type-check and bundle to `frontend/dist/`

Build individually:

```bash
make build-api       # API only → api/dist/
make build-frontend  # Frontend only → frontend/dist/
```

### 3. Verify Build Success

**Expected output for API** (`make build-api`):
- No TypeScript errors
- Files compiled to `api/dist/`
- Key artifacts: `dist/index.js`, `dist/init-db.js`, `dist/routes/auth.js`, `dist/middleware/auth/verifyToken.js`

**Expected output for Frontend** (`make build-frontend`):
- TypeScript type-check passes
- Vite bundles to `frontend/dist/`
- Key artifacts: `dist/index.html`, `dist/assets/*.js`, `dist/assets/*.css`

### 4. Initialize Database (for runtime)

```bash
make db-seed
```

This creates the SQLite database at `api/data/app.db` with schema and seed data including:
- All existing tables (branches, orders, products, etc.)
- New `users` table with seed users (admin, manager, user)
- New `audit_log` table

## Build Artifacts

| Location | Contents |
|----------|----------|
| `api/dist/` | Compiled API JavaScript (from TypeScript) |
| `frontend/dist/` | Production-ready frontend bundle (HTML, JS, CSS) |
| `api/data/app.db` | SQLite database (after `make db-seed`) |

## Troubleshooting

### Build Fails with TypeScript Errors

- **Cause**: Missing type definitions or strict-mode violations
- **Solution**: 
  1. Ensure `npm install` completed successfully in both directories
  2. Check for `@types/*` packages in `devDependencies`
  3. Run `npx tsc --noEmit` in the failing directory for detailed errors

### Build Fails with Module Resolution Errors

- **Cause**: Missing dependencies or incorrect import paths
- **Solution**:
  1. Delete `node_modules` and `package-lock.json`, then `npm install`
  2. Verify imports match the file structure (case-sensitive on Linux)

### Frontend Build Fails with Vite Errors

- **Cause**: Incompatible plugin versions or configuration issues
- **Solution**:
  1. Ensure `@vitejs/plugin-react` and `@tailwindcss/vite` are installed
  2. Check `vite.config.ts` for syntax errors
  3. Run `npx vite build` directly for detailed error output

### Database Initialization Fails

- **Cause**: Missing `api/data/` directory or permission issues
- **Solution**:
  1. Ensure `api/data/` directory exists: `mkdir -p api/data`
  2. Check write permissions on the directory
  3. If db file is locked, delete `*.db-shm` and `*.db-wal` files

## Production Start

After building:

```bash
cd api && npm start
```

This runs `db:seed` (idempotent) followed by `node dist/index.js`.
