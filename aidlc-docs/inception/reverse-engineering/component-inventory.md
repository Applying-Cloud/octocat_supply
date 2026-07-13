# Component Inventory

## Application Packages
- **api/** — Express.js REST API server (TypeScript, Express 5)
- **frontend/** — React SPA (TypeScript, Vite, Tailwind CSS)

## Infrastructure Packages
- **docker-compose.yml** — Docker Compose orchestration (postgres, api, frontend services)
- **api/Dockerfile** — API container image (node:26-alpine)
- **frontend/Dockerfile** — Frontend container image (node:20-alpine + nginx:alpine multi-stage)

## Shared Packages
- **api/src/db/** — Database abstraction layer (SQLite/PostgreSQL dual driver)
- **api/src/utils/** — SQL utilities and error hierarchy
- **api/src/models/** — TypeScript interfaces (shared data contracts)

## Test Packages
- **api/src/repositories/suppliersRepo.test.ts** — Repository unit test
- **api/src/routes/branch.test.ts** — Route integration test
- **frontend/tests/** — Frontend test directory (E2E + unit)

## Total Count
- **Total Packages**: 2 application + 3 infrastructure + 3 shared + 2 test groups
- **Application**: 2 (api, frontend)
- **Infrastructure**: 3 (docker-compose, api Dockerfile, frontend Dockerfile)
- **Shared**: 3 (db layer, utils, models)
- **Test**: 2 (API tests, frontend tests)
