# Technology Stack

## Programming Languages
- TypeScript ^6.0.3 — API and Frontend (strict mode, no .js files)

## Frameworks
- Express 5.2.1 (pinned) — HTTP API framework
- React ^19.2.7 — Frontend UI framework
- React Router ^7.18.0 — Client-side routing
- TanStack Query ^5.101.1 — Server state management
- Tailwind CSS ^4.2.2 — Utility-first CSS framework

## Infrastructure
- Docker Compose v3.8 — Container orchestration
- PostgreSQL 18-alpine — Production database
- SQLite (better-sqlite3 ^12.11.1) — Development/test database
- nginx alpine — Frontend static serving (production)
- Node.js 26 (alpine) — API runtime (production)
- Node.js 20 (alpine) — Frontend build runtime
- Node.js 24 — Development runtime (devcontainer)

## Build Tools
- tsc — TypeScript compiler (API production build)
- tsx ^4.22.4 — TypeScript execution (API development)
- Vite 8.1.0 (pinned) — Frontend bundler/dev server
- @vitejs/plugin-react ^6.0.3 — React support for Vite
- @tailwindcss/vite 4.3.1 — Tailwind CSS Vite plugin
- npm 10.x — Package manager

## Testing Tools
- Vitest ^4.0.10 — API unit/integration test runner
- Vitest 4.1.9 — Frontend unit test runner
- @vitest/coverage-v8 ^4.1.9 — Code coverage
- Supertest ^7.1.4 — HTTP assertion library (API integration tests)
- @testing-library/react ^16.3.0 — React component testing
- @testing-library/user-event ^14.6.1 — User interaction simulation
- jsdom ^29.1.1 — DOM environment for frontend tests
- Playwright ^1.61.0 — End-to-end browser testing

## Linting
- ESLint ^10.5.0 — Linting (flat config)
- typescript-eslint 8.62.0 — TypeScript ESLint integration
- eslint-plugin-react-hooks ^7.1.1 — React hooks lint rules
- eslint-plugin-react-refresh ^0.5.3 — React refresh lint rules

## API Documentation
- swagger-jsdoc ^6.3.0 — OpenAPI spec generation from JSDoc
- swagger-ui-express ^5.0.1 — Swagger UI middleware

## HTTP/Networking
- Axios 1.8.1 (pinned) — HTTP client (frontend)
- cors ^2.8.5 — CORS middleware (API)
- pg ^8.13.1 — PostgreSQL driver (node-postgres)
