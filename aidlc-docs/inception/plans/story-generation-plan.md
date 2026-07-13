# Story Generation Plan — Autenticación Persistente

## Contexto
Módulo de autenticación real para OctoCAT Supply. Reemplaza mock client-side con auth persistente (JWT + bcrypt). 3 roles: admin, manager, user. Gates obligatorias: auditoría inmutable, autenticación real, no SQL concatenada.

---

## Plan de Ejecución

### Fase A: Definir Personas
- [x] A1. Crear persona para el rol **User** (usuario final)
- [x] A2. Crear persona para el rol **Manager** (gestor de operaciones)
- [x] A3. Crear persona para el rol **Admin** (administrador del sistema)

### Fase B: Generar User Stories por Flujo
- [x] B1. Stories de **Registro** (self-registration)
- [x] B2. Stories de **Login** (autenticación)
- [x] B3. Stories de **Sesión** (persistencia y verificación)
- [x] B4. Stories de **Logout** (cierre de sesión)
- [x] B5. Stories de **Errores y Edge Cases** (credenciales inválidas, token expirado, email duplicado)
- [x] B6. Stories de **Audit Log** (visibilidad de cambios auditados)

### Fase C: Acceptance Criteria y Mapeo
- [x] C1. Definir acceptance criteria por story (Given/When/Then)
- [x] C2. Mapear personas a stories relevantes
- [x] C3. Verificar cumplimiento INVEST para cada story

### Fase D: Artifacts Finales
- [x] D1. Generar `aidlc-docs/inception/user-stories/personas.md`
- [x] D2. Generar `aidlc-docs/inception/user-stories/stories.md`

---

## Preguntas de Planificación

Responde cada pregunta llenando la letra después de `[Answer]:`.

---

## Question 1: Enfoque de Organización de Stories
¿Cómo prefieres que se organicen las user stories?

A) Por flujo de usuario (registro → login → sesión → logout → errores) — sigue el journey cronológico

B) Por persona (todas las stories del User, luego Manager, luego Admin) — agrupa por actor

C) Por feature/endpoint (POST /register, POST /login, GET /me, POST /logout) — alineado al API

D) Híbrido: por flujo pero indicando qué personas aplican a cada story

X) Otro (por favor describe después de la etiqueta [Answer]: abajo)

[Answer]: A

---

## Question 2: Granularidad de Stories
¿Qué nivel de detalle prefieres para las user stories?

A) Stories gruesas (1 story por flujo principal: "Como usuario quiero registrarme") — pocas stories, cada una con múltiples acceptance criteria

B) Stories finas (1 story por escenario específico: "Como usuario quiero ver error si mi password no cumple la política") — muchas stories, cada una con 1-2 acceptance criteria

C) Intermedio — 1 story por flujo + stories separadas para edge cases y errores significativos

X) Otro (por favor describe después de la etiqueta [Answer]: abajo)

[Answer]: A

---

## Question 3: Diferenciación entre Roles
En esta iteración, ¿los 3 roles (admin, manager, user) tienen flujos de auth **distintos** o **idénticos**?

A) Idénticos — todos se registran y logean de la misma forma. La diferencia de roles solo importa en Fase 2 (autorización)

B) Parcialmente distintos — el registro es igual pero el admin tiene capacidades adicionales visibles (ej: ver lista de usuarios, promover roles)

C) Distintos — cada rol tiene un flujo de registro/login diferenciado (ej: admin no se registra por self-service)

X) Otro (por favor describe después de la etiqueta [Answer]: abajo)

[Answer]: A

---

## Question 4: Audit Log — ¿Story de Usuario o Técnica?
La Gate 1 (Auditoría Inmutable) requiere audit_log para Order/OrderDetail/Delivery. ¿Debe haber una user story visible para esto?

A) Sí — "Como admin, quiero ver un log de auditoría de cambios en órdenes" (implica UI o endpoint de consulta)

B) No — el audit_log es un requisito técnico invisible para el usuario en esta iteración. Solo se implementa la escritura, no la lectura

C) Story técnica — no es una user story clásica pero se documenta como "technical story" con acceptance criteria

X) Otro (por favor describe después de la etiqueta [Answer]: abajo)

[Answer]: A

---

## Question 5: Formato de Acceptance Criteria
¿Qué formato prefieres para los acceptance criteria?

A) Given/When/Then (Gherkin) — formal, mapeable directamente a tests BDD

B) Lista de condiciones ("El sistema debe...") — más simple, menos estructura

C) Checklist de verificación — items binarios (✅/❌) que se pueden verificar manualmente

X) Otro (por favor describe después de la etiqueta [Answer]: abajo)

[Answer]: A

---

## Question 6: Scope del Frontend en Stories
¿Las stories deben cubrir el comportamiento del frontend (UI) o solo el backend (API)?

A) Solo API — las stories describen contratos de endpoint, sin mencionar UI específica

B) Full-stack — cada story describe tanto el comportamiento de la UI como del API

C) Separadas — stories de API (backend) y stories de UI (frontend) como grupos independientes

X) Otro (por favor describe después de la etiqueta [Answer]: abajo)

[Answer]: B

---

## Instrucciones

He creado el plan de generación de stories con **6 preguntas** en:
`aidlc-docs/inception/plans/story-generation-plan.md`

Por favor responde cada pregunta llenando la letra después de cada `[Answer]:` tag. Avísame cuando hayas terminado.
