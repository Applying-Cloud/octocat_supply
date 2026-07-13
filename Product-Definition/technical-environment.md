# Technical Environment: Autenticación Persistente de Usuarios — OctoCAT Supply Chain

Proyecto brownfield. El stack existente es la línea base. El código nuevo debe encajar en los patrones establecidos. Donde no se liste una opción, seguir el codebase existente — no introducir patrones nuevos sin justificación.

## Stack Existente (debe preservarse)

| Capa | Tecnología Actual | Versión | Notas |
|------|-------------------|---------|-------|
| Language | TypeScript | ^6.0.3 | Strict mode en ambos proyectos (`"strict": true` en tsconfig). Target ES2022 (API) / ES2020 (Frontend). No introducir archivos JavaScript. |
| Runtime (producción API) | Node.js | 26 (alpine) | Imagen Docker `node:26-alpine` en `api/Dockerfile`. |
| Runtime (producción Frontend) | Node.js | 20 (alpine) | Imagen Docker `node:20-alpine` en `frontend/Dockerfile`. Build-only, luego se sirve con nginx:alpine. |
| Runtime (desarrollo) | Node.js | 24 | Instalado vía devcontainer feature `ghcr.io/devcontainers/features/node:1` con `"version": "24"`. |
| API framework | Express | 5.2.1 (pinned) | Versión exacta sin caret. Todos los endpoints usan Express Router. No introducir Fastify, Koa ni Hono. |
| Database (producción) | PostgreSQL | 18 (alpine) | Imagen `postgres:18-alpine` en `docker-compose.yml`. Driver `pg` ^8.13.1 (node-postgres). Sin ORM — SQL directo con helpers tipados en `api/src/utils/sql.ts`. |
| Database (desarrollo/test) | SQLite | — | Vía `better-sqlite3` ^12.11.1. In-memory (`:memory:`) para tests. Archivo `./data/app.db` para desarrollo local. Selección vía variable `DB_ENGINE`. |
| Frontend framework | React | ^19.2.7 | Con `react-dom` ^19.2.7, React Router ^7.18.0, TanStack Query ^5.101.1, Axios 1.8.1 (pinned). |
| CSS | Tailwind CSS | ^4.2.2 | Plugin Vite `@tailwindcss/vite` 4.3.1. No introducir otro framework CSS. |
| UI components | react-slick | ^0.31.0 | Con `slick-carousel` ^1.8.1. Carruseles existentes. |
| Build (API) | tsc + tsx | tsx ^4.22.4 | `tsx` para desarrollo (`npm run dev`), `tsc` para producción (`npm run build`). Module: commonjs. |
| Build (Frontend) | Vite | 8.1.0 (pinned) | Con `@vitejs/plugin-react` ^6.0.3. Puerto de desarrollo: 5137. |
| Serving (Frontend prod) | nginx | alpine (latest) | Sirve el build estático. Configuración en `frontend/nginx.conf` + `entrypoint.sh` para variables dinámicas (`API_HOST`, `API_PORT`). |
| Package manager | npm | 10.x | Lockfiles (`package-lock.json`) presentes en ambos proyectos. No introducir yarn ni pnpm. |
| Test framework (API) | Vitest | ^4.0.10 | Coverage con `@vitest/coverage-v8` ^4.1.9. Tests junto al código fuente (`*.test.ts`). Environment: node. |
| Test framework (Frontend) | Vitest + Testing Library | vitest 4.1.9, @testing-library/react ^16.3.0 | Con jsdom ^29.1.1. `@testing-library/user-event` ^14.6.1. |
| Test E2E | Playwright | ^1.61.0 | Tests en `frontend/tests/e2e/`. Scripts: `npm run test:e2e`. |
| HTTP testing (API) | Supertest | ^7.1.4 | Para tests de integración de endpoints. |
| Linter | ESLint | ^10.5.0 | Configuración flat: `eslint.config.mjs` (API) / `eslint.config.js` (Frontend). Plugins: `typescript-eslint` 8.62.0, `react-hooks`, `react-refresh`. No modificar configs existentes. |
| API docs | Swagger | swagger-jsdoc ^6.3.0 + swagger-ui-express ^5.0.1 | Documentación auto-generada en `/api-docs`. Spec exportable en `/api-docs.json`. |
| CORS | cors | ^2.8.5 | Configurado en `api/src/index.ts` con orígenes múltiples (localhost, Codespace, Azure Container Apps, redes privadas). |
| Infraestructura | Docker + docker-compose | compose v3.8 | Servicios: `postgres`, `api`, `frontend`. Volumen persistente `pg-data`. Health check en PostgreSQL. |
| Devcontainer | VS Code Devcontainers | — | Base Ubuntu. Features: Node 24, Azure CLI, Python, GitHub CLI. Post-create: `make install && make build`. |

## Qué Agregar (nuevo para este módulo)

- Nueva tabla `users` en base de datos (migración `003_create_users.sql` para SQLite y PostgreSQL)
- Nuevo archivo de modelo: `api/src/models/user.ts`
- Nuevo repositorio: `api/src/repositories/usersRepo.ts`
- Nuevas rutas: `api/src/routes/auth.ts` (register, login, logout, me)
- Seed de usuarios de prueba: `api/database/seed/005_users.sql`
- Refactorización de `frontend/src/context/AuthContext.tsx` para consumir API real
- Componentes de login/registro en frontend conectados al backend

Estas adiciones **no deben modificar** tablas existentes, contratos de API existentes, ni componentes de negocio del frontend.

## Qué Debe Permanecer Sin Cambios

- Tablas existentes (`suppliers`, `headquarters`, `branches`, `products`, `orders`, `order_details`, `deliveries`, `order_detail_deliveries`)
- Endpoints REST existentes — no se modifican ni se protegen en esta iteración
- Archivos de migración existentes (`001_init.sql`, `002_add_supplier_status_fields.sql`)
- Configuración de base de datos dual (SQLite/PostgreSQL vía `DB_ENGINE`)
- Swagger/OpenAPI — documentación existente no se modifica
- Middleware de logging (`requestLogger.ts`)
- Configuración de CORS
- Configuración de ESLint y TypeScript

## Patrones Prohibidos

| Prohibido | Razón | Usar en su lugar |
|-----------|-------|------------------|
| ORMs (TypeORM, Prisma, Sequelize, Drizzle) | El codebase usa SQL directo con helpers tipados (`buildInsertSQL`, `buildUpdateSQL`). Introducir un ORM crea inconsistencia. | SQL directo con los helpers existentes en `api/src/utils/sql.ts` |
| Passport.js | Agrega complejidad innecesaria para un flujo simple de email/password. El proyecto no tiene middleware de auth previo. | Implementación directa en el route handler siguiendo el patrón existente |
| express-session con store externo | El sistema actual no tiene gestión de sesiones server-side. Agregar Redis u otro store es scope excesivo para MVP. | JWT o sesión simple según decisión en preguntas abiertas |
| Nuevo HTTP client en frontend | El proyecto usa Axios con TanStack Query. | Axios + TanStack Query (mutaciones para login/register) |
| Nuevo state management (Redux, Zustand, Jotai) | El frontend usa React Context. | React Context (`AuthContext` existente, refactorizado) |
| Archivos `.js` en el proyecto | Todo el código es TypeScript strict. | Archivos `.ts` / `.tsx` exclusivamente |

## Seguridad

**Estado actual**: No existe autenticación ni autorización. Todos los endpoints son públicos. El `AuthContext` del frontend es un mock client-side sin ninguna validación real.

**Lo que se necesita implementar**:
- Almacenamiento de contraseñas con hash + salt (bcrypt, argon2, o scrypt — decisión pendiente)
- Emisión de token de sesión (JWT o cookie httpOnly — decisión pendiente)
- Endpoint de validación de sesión (`GET /api/auth/me`)
- Passwords nunca almacenados en texto plano ni logueados
- Validación de input en todos los endpoints de auth (email format, password length mínimo)
- Rate limiting en endpoint de login (recomendado, alcance a definir)

**Secretos**: Actualmente no hay gestión de secretos. Las credenciales de PostgreSQL están en variables de entorno definidas en `docker-compose.yml` y `.devcontainer/`. El JWT secret (o equivalente) deberá configurarse como variable de entorno.

## Patrones de Código Existentes

Ejemplos del codebase actual que el código nuevo debe seguir:

### Route handler (Express)

```typescript
// api/src/routes/supplier.ts
import express from 'express';
import { Supplier } from '../models/supplier';
import { getSuppliersRepository } from '../repositories/suppliersRepo';
import { NotFoundError } from '../utils/errors';

const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    const repo = await getSuppliersRepository();
    const newSupplier = await repo.create(req.body as Omit<Supplier, 'supplierId'>);
    res.status(201).json(newSupplier);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const repo = await getSuppliersRepository();
    const supplier = await repo.findById(parseInt(req.params.id));
    if (supplier) {
      res.json(supplier);
    } else {
      res.status(404).send('Supplier not found');
    }
  } catch (error) {
    next(error);
  }
});

export default router;
```

### Función de query a base de datos (repositorio)

```typescript
// api/src/repositories/suppliersRepo.ts
import { getDatabase, DatabaseConnection } from '../db';
import { Supplier } from '../models/supplier';
import { handleDatabaseError, NotFoundError } from '../utils/errors';
import { buildInsertSQL, buildUpdateSQL, objectToCamelCase, mapDatabaseRows, DatabaseRow } from '../utils/sql';

export class SuppliersRepository {
  private db: DatabaseConnection;

  constructor(db: DatabaseConnection) {
    this.db = db;
  }

  async findAll(): Promise<Supplier[]> {
    try {
      const rows = await this.db.all<DatabaseRow>('SELECT * FROM suppliers ORDER BY supplier_id');
      return mapDatabaseRows<Supplier>(rows);
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  async findById(id: number): Promise<Supplier | null> {
    try {
      const row = await this.db.get<DatabaseRow>('SELECT * FROM suppliers WHERE supplier_id = ?', [id]);
      return row ? objectToCamelCase<Supplier>(row) : null;
    } catch (error) {
      handleDatabaseError(error);
    }
  }

  async create(supplier: Omit<Supplier, 'supplierId'>): Promise<Supplier> {
    try {
      const { sql, values } = buildInsertSQL('suppliers', supplier);
      const result = await this.db.run(sql, values);
      const created = await this.findById(result.lastID || 0);
      if (!created) throw new Error('Failed to retrieve created supplier');
      return created;
    } catch (error) {
      handleDatabaseError(error);
    }
  }
}

// Factory + singleton pattern
export async function getSuppliersRepository(): Promise<SuppliersRepository> {
  const db = await getDatabase();
  return new SuppliersRepository(db);
}
```

### Test unitario (Vitest)

```typescript
// api/src/repositories/suppliersRepo.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SuppliersRepository } from './suppliersRepo';
import { NotFoundError } from '../utils/errors';

vi.mock('../db', () => ({ getDatabase: vi.fn() }));
import { getDatabase } from '../db';

describe('SuppliersRepository', () => {
  let repository: SuppliersRepository;
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      run: vi.fn(),
      get: vi.fn(),
      all: vi.fn(),
      close: vi.fn()
    };
    (getDatabase as any).mockResolvedValue(mockDb);
    repository = new SuppliersRepository(mockDb);
    vi.clearAllMocks();
  });

  describe('findById', () => {
    it('should return supplier when found', async () => {
      mockDb.get.mockResolvedValue({ supplier_id: 1, name: 'Test Supplier' });
      const result = await repository.findById(1);
      expect(result?.supplierId).toBe(1);
    });

    it('should return null when not found', async () => {
      mockDb.get.mockResolvedValue(undefined);
      const result = await repository.findById(999);
      expect(result).toBeNull();
    });
  });
});
```
