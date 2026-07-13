# User Stories — Autenticación Persistente OctoCAT Supply

## Organización
- **Enfoque**: Por flujo de usuario (journey cronológico)
- **Granularidad**: Stories gruesas (1 por flujo principal, múltiples acceptance criteria)
- **Acceptance Criteria**: Given/When/Then (Gherkin)
- **Scope**: Full-stack (UI + API)
- **Roles**: Flujo de auth idéntico para los 3 roles (excepción: audit log solo Admin)

---

## US-01: Registro de Usuario

**Como** usuario nuevo de OctoCAT Supply,  
**Quiero** crear una cuenta proporcionando mi email, nombre y contraseña,  
**Para** poder acceder a la plataforma con credenciales propias.

**Personas**: Ana, Carlos

### Acceptance Criteria

```gherkin
Scenario: Registro exitoso
  Given estoy en la página de registro
  And no tengo una cuenta existente con el email "ana@empresa.com"
  When completo el formulario con:
    | campo      | valor              |
    | email      | ana@empresa.com    |
    | firstName  | Ana                |
    | lastName   | García             |
    | password   | MiPass123!@segura  |
  And hago click en "Registrarse"
  Then el sistema crea mi cuenta con rol "user"
  And veo un mensaje de confirmación
  And soy redirigida a la página de login

Scenario: Registro con email duplicado
  Given ya existe una cuenta con el email "ana@empresa.com"
  When intento registrarme con ese mismo email
  Then el sistema retorna error 409
  And veo el mensaje "El email ya está registrado"

Scenario: Registro con contraseña que no cumple política
  Given estoy en la página de registro
  When ingreso una contraseña "abc123"
  Then el sistema retorna error 400
  And veo un mensaje indicando los requisitos:
    | requisito                        |
    | Mínimo 12 caracteres             |
    | Al menos 1 mayúscula             |
    | Al menos 1 minúscula             |
    | Al menos 1 número                |
    | Al menos 1 carácter especial     |

Scenario: Registro con email inválido
  Given estoy en la página de registro
  When ingreso un email con formato inválido "noesunmail"
  Then el sistema retorna error 400
  And veo el mensaje "Formato de email inválido"
```

### Notas técnicas
- Endpoint: `POST /api/auth/register`
- Password se hashea con bcrypt (salt rounds: 10) antes de almacenar
- Rol asignado: siempre "user" — no es posible registrarse como "admin" o "manager" vía self-service
- Cuentas admin/manager se crean vía seed o por un admin existente (fuera de scope de esta story)
- Queries parametrizadas obligatorias (Gate 3)

---

## US-02: Login de Usuario

**Como** usuario registrado de OctoCAT Supply,  
**Quiero** iniciar sesión con mi email y contraseña,  
**Para** acceder a la plataforma y realizar mis tareas.

**Personas**: Ana, Carlos, Diego

### Acceptance Criteria

```gherkin
Scenario: Login exitoso
  Given tengo una cuenta registrada con email "ana@empresa.com"
  And estoy en la página de login
  When ingreso mi email y contraseña correctos
  And hago click en "Iniciar Sesión"
  Then el sistema emite un JWT en cookie httpOnly
  And soy redirigida al dashboard principal
  And veo mi nombre en el header de navegación

Scenario: Login con credenciales incorrectas
  Given estoy en la página de login
  When ingreso un email o contraseña incorrectos
  Then el sistema retorna error 401
  And veo el mensaje genérico "Credenciales inválidas"
  And no se revela si el email existe o no en el sistema

Scenario: Login con campos vacíos
  Given estoy en la página de login
  When dejo el email o la contraseña vacíos
  And hago click en "Iniciar Sesión"
  Then veo validación client-side indicando campos requeridos
  And no se envía request al servidor
```

### Notas técnicas
- Endpoint: `POST /api/auth/login`
- JWT payload: `{ sub: email, role: string, iat, exp }`
- Cookie: `token=<jwt>; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=3600`
- Expiración: 1 hora
- Sin rate limiting en esta iteración

---

## US-03: Persistencia de Sesión

**Como** usuario autenticado,  
**Quiero** que mi sesión se mantenga activa mientras navego por la plataforma,  
**Para** no tener que re-autenticarme en cada página que visito.

**Personas**: Ana, Carlos, Diego

### Acceptance Criteria

```gherkin
Scenario: Sesión persiste al navegar
  Given he iniciado sesión exitosamente
  When navego a diferentes páginas de la plataforma (productos, órdenes, proveedores)
  Then permanezco autenticado en todas las páginas
  And veo mi nombre en el header en todo momento

Scenario: Sesión persiste al recargar la página
  Given he iniciado sesión exitosamente
  When recargo la página del navegador (F5)
  Then la aplicación verifica mi sesión con GET /api/auth/me
  And permanezco autenticado
  And veo mi información de usuario

Scenario: Sesión expira después de 1 hora
  Given he iniciado sesión hace más de 1 hora
  When intento realizar cualquier acción
  Then el sistema detecta el token expirado
  And soy redirigido a la página de login
  And veo un mensaje "Tu sesión ha expirado, por favor inicia sesión nuevamente"

Scenario: Verificación de sesión al cargar la aplicación
  Given tengo una cookie de sesión válida (no expirada)
  When abro la aplicación en una nueva pestaña
  Then la aplicación llama a GET /api/auth/me
  And me muestra como autenticado sin pedir login
```

### Notas técnicas
- Endpoint: `GET /api/auth/me`
- Verifica firma JWT y expiración
- Retorna: `{ email, firstName, lastName, role }` si válido
- Retorna: 401 si inválido/expirado/ausente
- Frontend: TanStack Query para cachear estado de auth

---

## US-04: Logout

**Como** usuario autenticado,  
**Quiero** poder cerrar mi sesión,  
**Para** proteger mi cuenta cuando termino de usar la plataforma.

**Personas**: Ana, Carlos, Diego

### Acceptance Criteria

```gherkin
Scenario: Logout exitoso
  Given estoy autenticado en la plataforma
  When hago click en "Cerrar Sesión" en el menú de usuario
  Then el sistema limpia mi cookie de sesión
  And soy redirigido a la página de login
  And no puedo acceder a páginas protegidas sin re-autenticarme

Scenario: Después de logout, la sesión no persiste
  Given he cerrado sesión exitosamente
  When intento navegar directamente a una URL de la plataforma
  Then GET /api/auth/me retorna 401
  And soy redirigido a la página de login
```

### Notas técnicas
- Endpoint: `POST /api/auth/logout`
- Limpia cookie: `Set-Cookie: token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`
- No requiere validación de token — simplemente elimina la cookie
- Frontend: limpia estado de AuthContext

---

## US-05: Manejo de Errores y Edge Cases

**Como** usuario de la plataforma,  
**Quiero** recibir mensajes de error claros y seguros cuando algo falla,  
**Para** entender qué ocurrió sin exponer información sensible del sistema.

**Personas**: Ana, Carlos, Diego

### Acceptance Criteria

```gherkin
Scenario: Token expirado durante operación
  Given mi token JWT ha expirado mientras tenía la aplicación abierta
  When realizo cualquier acción que requiera autenticación
  Then recibo una respuesta 401 del servidor
  And la aplicación me redirige a login
  And veo el mensaje "Tu sesión ha expirado"

Scenario: Cookie manipulada o inválida
  Given alguien modificó manualmente mi cookie de sesión
  When la aplicación intenta verificar mi sesión (GET /api/auth/me)
  Then el servidor detecta la firma JWT inválida
  And retorna 401
  And soy redirigido a login

Scenario: Registro con campos faltantes
  Given estoy en la página de registro
  When envío el formulario sin completar todos los campos obligatorios
  Then veo mensajes de validación específicos por cada campo vacío
  And no se envía request al servidor

Scenario: Error de servidor inesperado
  Given ocurre un error interno en el servidor durante login o registro
  When el servidor responde con 500
  Then veo un mensaje genérico "Error interno del servidor, intenta más tarde"
  And no se expone información técnica (stack traces, queries SQL)
```

### Notas técnicas
- Mensajes genéricos para login fallido (no revelar existencia de email)
- Sin stack traces en producción
- Validación client-side + server-side (defense in depth)

---

## US-06: Auditoría de Inicio de Sesión

**Como** administrador del sistema,  
**Quiero** consultar un log de auditoría que registre todos los intentos de inicio de sesión (exitosos y fallidos),  
**Para** poder detectar accesos no autorizados, investigar incidentes de seguridad y mantener trazabilidad de acceso.

**Personas**: Diego (Admin)

### Acceptance Criteria

```gherkin
Scenario: Login exitoso genera registro de auditoría
  Given un usuario se autentica exitosamente con email "ana@empresa.com"
  When el login se completa
  Then el sistema inserta un registro en audit_log con:
    | campo       | valor                              |
    | table_name  | "auth"                             |
    | operation   | "LOGIN_SUCCESS"                    |
    | record_id   | "ana@empresa.com"                  |
    | user_id     | "ana@empresa.com"                  |
    | old_values  | NULL                               |
    | new_values  | JSON con IP, user-agent, timestamp |
    | timestamp   | ISO 8601 del momento del login     |

Scenario: Login fallido genera registro de auditoría
  Given alguien intenta autenticarse con credenciales incorrectas
  When el login falla
  Then el sistema inserta un registro en audit_log con:
    | campo       | valor                              |
    | table_name  | "auth"                             |
    | operation   | "LOGIN_FAILED"                     |
    | record_id   | email proporcionado                |
    | user_id     | NULL (no autenticado)              |
    | old_values  | NULL                               |
    | new_values  | JSON con IP, user-agent, timestamp |
    | timestamp   | ISO 8601 del momento del intento   |

Scenario: Admin consulta el audit log
  Given estoy autenticado como administrador (rol: admin)
  When accedo al endpoint GET /api/audit-log
  Then veo una lista paginada de registros de auditoría
  And cada registro muestra: tabla, operación, usuario, timestamp, y valores
  And los registros están ordenados por timestamp descendente (más reciente primero)

Scenario: No-admin intenta acceder al audit log
  Given estoy autenticado con rol "user" o "manager"
  When intento acceder a GET /api/audit-log
  Then el sistema retorna 403 Forbidden
  And no veo ningún dato de auditoría

Scenario: Audit log es inmutable
  Given existen registros en la tabla audit_log
  When alguien intenta modificar o eliminar un registro de auditoría
  Then la operación es rechazada
  And los registros originales permanecen intactos
```

### Notas técnicas
- Auditoría de login: integrada directamente en el route handler de auth
- Tabla: `audit_log` (append-only, no UPDATE/DELETE permitidos)
- Registros usan `table_name = "auth"` con operations: LOGIN_SUCCESS, LOGIN_FAILED
- Endpoint de consulta: `GET /api/audit-log` (solo admin, paginado)
- user_id = NULL para login fallido (usuario no autenticado)
- Auditoría de Order/OrderDetail/Delivery: diferida hasta que exista flujo de creación de órdenes
- Queries parametrizadas obligatorias (Gate 3)

---

## Resumen de Stories

| ID | Story | Personas | Acceptance Criteria |
|----|-------|----------|---------------------|
| US-01 | Registro de Usuario | Ana, Carlos | 4 scenarios |
| US-02 | Login de Usuario | Ana, Carlos, Diego | 3 scenarios |
| US-03 | Persistencia de Sesión | Ana, Carlos, Diego | 4 scenarios |
| US-04 | Logout | Ana, Carlos, Diego | 2 scenarios |
| US-05 | Manejo de Errores | Ana, Carlos, Diego | 4 scenarios |
| US-06 | Auditoría de Inicio de Sesión | Diego (Admin) | 5 scenarios |

**Total**: 6 user stories, 22 acceptance criteria scenarios

---

## Verificación INVEST

| Criterio | US-01 | US-02 | US-03 | US-04 | US-05 | US-06 |
|----------|:---:|:---:|:---:|:---:|:---:|:---:|
| **I**ndependent | ✅ | ✅ | ⚠️¹ | ⚠️¹ | ⚠️¹ | ✅ |
| **N**egotiable | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **V**aluable | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **E**stimable | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **S**mall | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **T**estable | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

> ¹ US-03, US-04, US-05 dependen de que el usuario esté autenticado (US-02). Esto es una dependencia funcional esperada en un flujo de auth — no es una violación del principio de independencia a nivel de implementación ya que cada story puede construirse y probarse en aislamiento con un token mock.

---

## Compliance: Extension Gates

| Gate | Impacto en Stories |
|------|-------------------|
| **Gate 1 — Auditoría Inmutable** | US-06 implementa auditoría de auth (login). Auditoría de Order/OrderDetail/Delivery diferida hasta que exista flujo de creación de órdenes |
| **Gate 2 — Autenticación Real** | US-01 (bcrypt), US-02 (JWT), US-03 (verificación) cumplen este requisito |
| **Gate 3 — No SQL Concatenada** | Todas las stories usan queries parametrizadas (notas técnicas de cada story) |
