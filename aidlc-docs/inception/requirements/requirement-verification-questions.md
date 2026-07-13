# Preguntas de Verificación de Requerimientos

Por favor responde cada pregunta seleccionando la opción que mejor aplique. Llena la letra de tu elección después de la etiqueta `[Answer]:`. Si ninguna opción se ajusta, elige la última opción (X/Otro) y describe tu preferencia.

---

## ⚠️ Restricciones Siempre Aplicadas (Always-Enforced Extension)

La extensión `applying-standards.md` **no requiere opt-in** y se aplica como restricción obligatoria en todas las fases. Estas 3 gates son **requisitos no negociables**:

| # | Gate | Requisito |
|---|------|-----------|
| 1 | **Auditoría Inmutable** | Todo cambio a Order/OrderDetail/Delivery → INSERT en `audit_log` (quién, qué, cuándo) |
| 2 | **Autenticación Real** | JWT + bcrypt obligatorio. No se acepta mock authentication |
| 3 | **No SQL Concatenada** | Solo queries parametrizadas. Se rechaza `${id}` en SQL strings |

> Nota: Estas restricciones impactan directamente las Questions 1 y 2 a continuación — las opciones que no cumplen con estos gates ya están marcadas como incompatibles.

---

## Question 1: Mecanismo de Sesión
¿Qué mecanismo de sesión se debe usar para autenticar usuarios después del login?

> ⚠️ **Gate 2 (Autenticación Real)** requiere JWT + bcrypt. Opciones A, B, y D son compatibles. Opción C (sesiones server-side) no usa JWT y no cumple con la gate.

A) JWT stateless almacenado en localStorage del cliente (simple, sin estado server-side, vulnerable a XSS)

B) JWT almacenado en cookie httpOnly (protegido contra XSS, requiere CSRF protection) ✅ recomendado

C) ~~Sesiones server-side con cookie httpOnly~~ ❌ **No compatible con Gate 2 (requiere JWT)**

D) JWT con cookie httpOnly para access token + refresh token en cookie separada ✅ compatible

X) Otro (por favor describe después de la etiqueta [Answer]: abajo)

[Answer]: B

---

## Question 2: Librería de Hashing de Contraseñas
¿Qué librería se debe usar para hashear contraseñas?

> ⚠️ **Gate 2 (Autenticación Real)** requiere bcrypt. Opción A es la requerida por la gate.

A) bcrypt (la más popular, bien probada, C bindings via bcryptjs o native) ✅ **requerido por Gate 2**

B) argon2 (ganador de PHC, más resistente a GPU attacks, requiere compilación nativa) — puede usarse si se justifica superioridad técnica

C) scrypt nativo de Node.js (built-in `crypto.scrypt`, sin dependencia externa, menor comunidad)

X) Otro (por favor describe después de la etiqueta [Answer]: abajo)

[Answer]: A

---

## Question 3: Política de Contraseñas
¿Qué nivel de validación de contraseña se requiere para esta iteración?

A) Mínimo básico: solo largo mínimo (8 caracteres)

B) Moderado: largo mínimo (8 caracteres) + al menos una mayúscula y un número

C) Estricto: largo mínimo (12 caracteres) + mayúscula + minúscula + número + carácter especial

D) Sin restricciones específicas — solo validar que no esté vacía

X) Otro (por favor describe después de la etiqueta [Answer]: abajo)

[Answer]: C

---

## Question 4: Roles de Usuario
¿Cómo se debe definir el campo `rol` en la tabla de usuarios?

A) Enum fijo con dos valores: "admin" y "user" (almacenado como TEXT con CHECK constraint)

B) Enum fijo extensible con tres valores: "admin", "manager", "user" (preparado para futura jerarquía)

C) Texto libre — el valor del rol es un string arbitrario sin restricción a nivel de DB

X) Otro (por favor describe después de la etiqueta [Answer]: abajo)

[Answer]: B

---

## Question 5: Usuarios Seed de Desarrollo
¿Cómo deben configurarse los usuarios de seed para el entorno de desarrollo?

A) Credenciales fijas y documentadas (ej: admin@github.com / password123) — fácil para desarrollo y demos

B) Credenciales fijas pero solo documentadas en un archivo .env.example — algo más seguro

C) Credenciales generadas aleatoriamente al ejecutar el seed — más seguro pero requiere consultar logs

X) Otro (por favor describe después de la etiqueta [Answer]: abajo)

[Answer]: A

---

## Question 6: Registro de Usuarios (Self-Registration)
¿El registro de nuevos usuarios debe estar abierto o restringido?

A) Self-registration abierto — cualquier persona puede crear una cuenta

B) Self-registration abierto pero con rol "user" por defecto — solo admins pueden promover roles

C) Registro cerrado — solo un administrador puede crear cuentas de usuario

D) Self-registration abierto con aprobación — el usuario se registra pero queda inactivo hasta que un admin lo aprueba

X) Otro (por favor describe después de la etiqueta [Answer]: abajo)

[Answer]: A

---

## Question 7: Expiración de Sesión/Token
¿Cuál debe ser el tiempo de expiración del token/sesión?

A) Corto: 1 hora (más seguro, el usuario debe re-autenticarse frecuentemente)

B) Moderado: 8 horas (una jornada laboral típica)

C) Largo: 24 horas (conveniente para desarrollo)

D) Muy largo: 7 días (máxima conveniencia, menor seguridad)

X) Otro (por favor describe después de la etiqueta [Answer]: abajo)

[Answer]: A

---

## Question 8: Rate Limiting en Login
¿Se debe implementar rate limiting en el endpoint de login en esta iteración?

A) Sí — implementar rate limiting básico (ej: máximo 5 intentos fallidos por IP en 15 minutos)

B) Sí — implementar rate limiting avanzado (por IP + por cuenta, con lockout temporal)

C) No — dejarlo para una fase posterior (aceptar el riesgo de brute-force en esta iteración)

X) Otro (por favor describe después de la etiqueta [Answer]: abajo)

[Answer]: C

---

## Question 9: Respuesta de Error en Login Fallido
¿Qué información debe retornar el API cuando las credenciales son incorrectas?

A) Mensaje genérico: "Credenciales inválidas" (no revela si el email existe o no — más seguro)

B) Mensaje específico: "Email no encontrado" o "Contraseña incorrecta" (mejor UX, revela existencia de cuentas)

X) Otro (por favor describe después de la etiqueta [Answer]: abajo)

[Answer]: A

---

## Question 10: Nombre de Usuario
¿Qué campos debe tener el usuario además de email y password?

A) Solo un campo `name` (nombre completo como texto libre)

B) Campos separados `firstName` y `lastName`

C) Un campo `displayName` (texto libre, sin semántica de nombre/apellido)

X) Otro (por favor describe después de la etiqueta [Answer]: abajo)

[Answer]: B

---

## Question 11: Extensión de Seguridad
¿Se deben aplicar las reglas de extensión de seguridad (security baseline) a este proyecto?

**Qué incluye:** Aplicar un conjunto de mejores prácticas de seguridad direccionales durante el diseño — validación de input, manejo seguro de secretos, headers de seguridad, protección contra ataques comunes (XSS, CSRF, injection). No es una certificación, es un punto de partida informado.

A) Sí — aplicar todas las reglas de SEGURIDAD como restricciones obligatorias (recomendado para aplicaciones de grado producción)

B) No — omitir todas las reglas de SEGURIDAD (adecuado para PoCs, prototipos y proyectos experimentales)

X) Otro (por favor describe después de la etiqueta [Answer]: abajo)

[Answer]: B

---

## Question 12: Extensión de Property-Based Testing
¿Se deben aplicar las reglas de property-based testing (PBT) a este proyecto?

**Qué incluye:** Tests que verifican propiedades invariantes sobre datos generados aleatoriamente (ej: "para cualquier email válido, el registro siempre produce un usuario con ese email"). Útil para lógica de negocio, transformaciones de datos y serialización.

A) Sí — aplicar todas las reglas PBT como restricciones obligatorias (recomendado para proyectos con lógica de negocio, transformaciones de datos o componentes stateful)

B) Parcial — aplicar PBT solo para funciones puras y round-trips de serialización

C) No — omitir todas las reglas PBT (adecuado para aplicaciones CRUD simples, proyectos solo-UI, o capas de integración delgadas sin lógica de negocio significativa)

X) Otro (por favor describe después de la etiqueta [Answer]: abajo)

[Answer]: C

---

## Question 13: Extensión de Resiliencia
¿Se debe aplicar la extensión de resiliencia baseline a este proyecto?

**Qué incluye:** Un conjunto de mejores prácticas direccionales para construir sistemas resilientes, derivadas del AWS Well-Architected Framework (Pilar de Confiabilidad). Cubre tolerancia a fallos, alta disponibilidad, observabilidad y recuperabilidad. Es un punto de partida, no una certificación.

A) Sí — aplicar la resiliencia baseline como mejores prácticas direccionales (recomendado para cargas de trabajo críticas para el negocio)

B) No — omitir la resiliencia baseline (adecuado para PoCs, prototipos y proyectos experimentales donde la iteración rápida importa más que la confiabilidad)

X) Otro (por favor describe después de la etiqueta [Answer]: abajo)

[Answer]: B

---

## Question 14: Implementación de Audit Log (Gate 1 — Auditoría Inmutable)
> ⚠️ **Gate 1** requiere que toda mutación a Order, OrderDetail, y Delivery genere un INSERT en `audit_log`. Esta pregunta define los detalles de implementación.

¿Cómo se debe implementar la tabla `audit_log` y su mecanismo de inserción?

A) Trigger a nivel de base de datos — un SQLite trigger por cada tabla (Order, OrderDetail, Delivery) que inserta automáticamente en `audit_log` en cada INSERT/UPDATE/DELETE

B) Middleware a nivel de aplicación — un interceptor en la capa de repositorio que captura cambios y escribe en `audit_log` antes de retornar la respuesta

C) Ambos — trigger de DB como red de seguridad + logging aplicativo para contexto adicional (user_id, request metadata)

X) Otro (por favor describe después de la etiqueta [Answer]: abajo)

[Answer]: B

---
