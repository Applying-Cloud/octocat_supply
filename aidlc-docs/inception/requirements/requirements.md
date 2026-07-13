# Requirements: Autenticación Persistente de Usuarios — OctoCAT Supply

## Intent Analysis

| Dimensión | Valor |
|-----------|-------|
| **User Request** | Agregar autenticación real y persistente reemplazando el mock client-side existente |
| **Request Type** | New Feature (módulo de auth en sistema brownfield) |
| **Scope** | Multiple Components — Backend (routes, repository, DB migration) + Frontend (AuthContext, login/register UI) |
| **Complexity** | Moderate — flujo de auth estándar pero con dual-DB, patrones existentes a respetar, y gates de extensión |
| **Depth Applied** | Standard |

---

## Always-Enforced Extension Constraints

La extensión `applying-standards.md` impone 3 gates obligatorias que son restricciones de diseño no negociables:

| Gate | Requisito | Impacto en Requirements |
|------|-----------|------------------------|
| **1. Auditoría Inmutable** | Toda mutación a Order/OrderDetail/Delivery → INSERT en `audit_log` (user_id, old_values, new_values, timestamp) | REQ-NFR-07 — Requiere tabla `audit_log` y middleware en capa de repositorio |
| **2. Autenticación Real** | JWT + bcrypt obligatorio. No se acepta mock | REQ-FR-02, REQ-FR-03, REQ-NFR-01 |
| **3. No SQL Concatenada** | Solo queries parametrizadas (`$1`, `?`). Rechazar `${id}` | REQ-NFR-08 — Aplica a todo SQL nuevo y existente |

---

## Functional Requirements

### REQ-FR-01: Tabla de Usuarios
**Prioridad**: Alta

Crear tabla `users` en base de datos con los siguientes campos:

| Campo | Tipo | Restricción |
|-------|------|-------------|
| `email` | TEXT | PRIMARY KEY / UNIQUE, NOT NULL |
| `password_hash` | TEXT | NOT NULL |
| `first_name` | TEXT | NOT NULL |
| `last_name` | TEXT | NOT NULL |
| `role` | TEXT | CHECK ('admin', 'manager', 'user'), NOT NULL, DEFAULT 'user' |
| `created_at` | TEXT (ISO 8601) | NOT NULL, DEFAULT CURRENT_TIMESTAMP |
| `updated_at` | TEXT (ISO 8601) | NOT NULL, DEFAULT CURRENT_TIMESTAMP |

- Migración dual: SQLite (`003_create_users.sql`) y PostgreSQL equivalente
- No modificar tablas existentes

### REQ-FR-02: Endpoint POST /api/auth/register
**Prioridad**: Alta

- Acepta: `{ email, password, firstName, lastName }`
- Validaciones:
  - Email: formato válido, único en DB
  - Password: mínimo 12 caracteres, al menos 1 mayúscula, 1 minúscula, 1 número, 1 carácter especial
- Hash del password con **bcrypt** (salt rounds por defecto: 10)
- Almacena usuario con rol `user` por defecto
- Retorna: `201 Created` con `{ email, firstName, lastName, role }` (sin password hash)
- Errores: `400` (validación fallida), `409` (email ya existe)
- Self-registration abierto — cualquier persona puede registrarse

### REQ-FR-03: Endpoint POST /api/auth/login
**Prioridad**: Alta

- Acepta: `{ email, password }`
- Busca usuario por email, compara password con bcrypt
- Si válido: emite **JWT** firmado con secret de variable de entorno (`JWT_SECRET`)
  - Payload: `{ sub: email, role: string, iat, exp }`
  - Expiración: **1 hora**
  - Entrega: cookie httpOnly (`Set-Cookie: token=<jwt>; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=3600`)
- Si inválido: retorna `401` con mensaje genérico `"Credenciales inválidas"` (no revela si email existe)
- No implementar rate limiting en esta iteración

### REQ-FR-04: Endpoint POST /api/auth/logout
**Prioridad**: Alta

- Limpia la cookie de sesión (`Set-Cookie: token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`)
- Retorna: `200 OK` con `{ message: "Sesión cerrada" }`
- No requiere validación de token — simplemente elimina la cookie

### REQ-FR-05: Endpoint GET /api/auth/me
**Prioridad**: Alta

- Lee el JWT de la cookie httpOnly
- Verifica firma y expiración
- Si válido: retorna `{ email, firstName, lastName, role }`
- Si inválido/expirado/ausente: retorna `401 Unauthorized`

### REQ-FR-06: Seed de Usuarios de Desarrollo
**Prioridad**: Media

- Crear archivo `005_users.sql` con usuarios de seed
- Credenciales fijas y documentadas:
  - Admin: `admin@github.com` / `Admin123!@#pass` (rol: admin)
  - Manager: `manager@octocat.com` / `Manager123!@#pass` (rol: manager)
  - User: `user@octocat.com` / `User123!@#pass` (rol: user)
- Passwords deben cumplir la política estricta (REQ-FR-02)
- Password hashes pre-generados con bcrypt en el seed SQL

### REQ-FR-07: Refactorización Frontend AuthContext
**Prioridad**: Alta

- Reemplazar mock client-side por llamadas a `/api/auth/*` endpoints
- Usar Axios + TanStack Query (mutations para login/register, query para /me)
- Mantener React Context como state management (no introducir Redux/Zustand)
- Persistencia de sesión: cookie httpOnly manejada automáticamente por el browser
- Al cargar la app: llamar `GET /api/auth/me` para verificar sesión existente
- Login: `POST /api/auth/login` → actualizar estado de contexto
- Logout: `POST /api/auth/logout` → limpiar estado de contexto
- Register: `POST /api/auth/register` → redirigir a login

### REQ-FR-08: Tabla audit_log (Gate 1 — Auditoría Inmutable)
**Prioridad**: Alta

Crear tabla `audit_log`:

| Campo | Tipo | Restricción |
|-------|------|-------------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT |
| `table_name` | TEXT | NOT NULL ('orders', 'order_details', 'deliveries') |
| `operation` | TEXT | NOT NULL ('INSERT', 'UPDATE', 'DELETE') |
| `record_id` | TEXT | NOT NULL (ID del registro afectado) |
| `user_id` | TEXT | NULL (email del usuario, NULL si sistema) |
| `old_values` | TEXT | NULL (JSON serializado del estado anterior) |
| `new_values` | TEXT | NULL (JSON serializado del estado nuevo) |
| `timestamp` | TEXT (ISO 8601) | NOT NULL, DEFAULT CURRENT_TIMESTAMP |

- Implementación: **middleware a nivel de aplicación** en la capa de repositorio
- Interceptar operaciones de mutación (INSERT/UPDATE/DELETE) en repositorios de Order, OrderDetail, Delivery
- Capturar `user_id` del JWT (del request context)
- Migración: `004_create_audit_log.sql`

---

## Non-Functional Requirements

### REQ-NFR-01: Seguridad de Contraseñas
- Hashing: bcrypt con salt rounds = 10
- Nunca almacenar ni loguear passwords en texto plano
- Nunca retornar `password_hash` en responses de API
- Validación estricta: 12+ chars, mayúscula, minúscula, número, carácter especial

### REQ-NFR-02: Seguridad de Tokens
- JWT firmado con HS256 usando `JWT_SECRET` de variable de entorno
- Expiración: 1 hora
- Transmisión: cookie httpOnly, Secure, SameSite=Strict
- No almacenar tokens en localStorage (vulnerable a XSS)

### REQ-NFR-03: Respuestas de Error Seguras
- Login fallido: mensaje genérico sin revelar existencia de email
- No exponer stack traces en producción
- Validar y sanitizar todos los inputs

### REQ-NFR-04: Compatibilidad con Stack Existente
- TypeScript strict mode (no `any`, no `@ts-ignore`)
- Express Router pattern (como `supplier.ts`)
- Repository pattern con factory function (como `suppliersRepo.ts`)
- SQL helpers existentes (`buildInsertSQL`, `buildUpdateSQL`)
- Dual database: SQLite (dev/test) + PostgreSQL (prod)
- Vitest para tests unitarios
- Supertest para tests de integración de endpoints

### REQ-NFR-05: Testing
- Tests unitarios para:
  - Validación de email y password
  - Lógica de hashing/comparación
  - Repository (con mocks de DB)
- Tests de integración para:
  - Flujo completo register → login → me → logout
  - Casos de error (credenciales inválidas, email duplicado, token expirado)
- Usar Vitest + Supertest siguiendo patrones existentes

### REQ-NFR-06: No Breaking Changes
- Endpoints existentes: no modificar, no proteger (Fase 2)
- Tablas existentes: no alterar schema
- Frontend: no modificar componentes de negocio, solo AuthContext y login/register
- Datos seed existentes: preservar intactos

### REQ-NFR-07: Auditoría Inmutable (Gate 1)
- Toda mutación a `orders`, `order_details`, `deliveries` genera registro en `audit_log`
- Implementación via middleware de repositorio (no triggers de DB)
- Capturar: user_id (del JWT), tabla, operación, valores anteriores, valores nuevos, timestamp
- La tabla `audit_log` es append-only (no UPDATE ni DELETE permitidos en ella)

### REQ-NFR-08: Queries Parametrizadas (Gate 3)
- Todo SQL nuevo debe usar placeholders parametrizados (`?` para SQLite, `$1` para PostgreSQL)
- Prohibido: concatenación de strings con variables en queries SQL
- Los helpers existentes (`buildInsertSQL`, `buildUpdateSQL`) ya siguen este patrón — usarlos
- Este requisito aplica a todo código nuevo y se verificará durante Code Generation

---

## Out of Scope (Explicit)

Estos items están explícitamente **excluidos** de esta iteración:

- Autorización basada en roles para endpoints existentes (Fase 2)
- Middleware de protección de rutas del backend (Fase 2)
- Recuperación de contraseña / "olvidé mi contraseña" (Fase 2)
- Verificación de email al registrarse (Fase 2)
- OAuth / login social (Fase 3)
- Refresh tokens o rotación de tokens (Fase 2)
- Multi-factor authentication (Fase 3)
- Gestión de perfiles (editar nombre, cambiar contraseña) (Fase 2)
- Rate limiting en login (decisión explícita para esta iteración)
- Security baseline extension (opt-out por usuario)
- Property-based testing (opt-out por usuario)
- Resiliency baseline (opt-out por usuario)

---

## Extension Opt-In Decisions

| Extension | Decision | Rationale |
|-----------|----------|-----------|
| applying-standards | **Always enforced** (no opt-in) | Sin archivo `.opt-in.md` — se aplica como restricción obligatoria |
| security-baseline | **No** (Q11: B) | Las 3 gates de applying-standards cubren seguridad base suficiente para esta iteración |
| property-based-testing | **No** (Q12: C) | Aplicación CRUD sin lógica de negocio compleja en esta iteración |
| resiliency-baseline | **No** (Q13: B) | Prototipo/MVP — iteración rápida sobre confiabilidad |

---

## Technical Decisions Summary

| Decisión | Elección | Justificación |
|----------|----------|---------------|
| Mecanismo de sesión | JWT en cookie httpOnly | Seguro contra XSS, stateless, compatible con Gate 2 |
| Hashing | bcrypt (bcryptjs) | Requerido por Gate 2, well-tested, sin compilación nativa |
| Password policy | Estricta (12+ chars, complexity) | Postura de seguridad consistente |
| Roles | Enum fijo: admin/manager/user | Extensible pero controlado a nivel de DB |
| Seed credentials | Fijas y documentadas | Facilidad de desarrollo y demos |
| Self-registration | Abierto (rol default: user) | Flujo simple, sin aprobación |
| Token expiry | 1 hora | Balance seguridad/usabilidad |
| Rate limiting | No (esta iteración) | Decisión explícita — aceptar riesgo temporal |
| Error messages | Genéricos | No revelar existencia de cuentas |
| User name fields | firstName + lastName separados | Semántica clara |
| Audit log | Middleware aplicativo | Control de user_id y metadata del request |
| SQL queries | Parametrizadas exclusivamente | Gate 3 — sin excepciones |
