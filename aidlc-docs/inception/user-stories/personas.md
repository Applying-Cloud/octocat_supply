# Personas — Autenticación Persistente OctoCAT Supply

## Persona 1: Ana (User)

| Atributo | Valor |
|----------|-------|
| **Nombre** | Ana García |
| **Rol** | User |
| **Cargo** | Analista de Compras |
| **Contexto** | Trabaja en una sucursal de OctoCAT Supply. Usa la plataforma diariamente para consultar productos, revisar estados de órdenes y verificar entregas. |
| **Motivación** | Acceder rápidamente a la plataforma para gestionar sus tareas diarias sin complicaciones técnicas. |
| **Frustraciones** | Procesos de login lentos, perder sesión frecuentemente, mensajes de error confusos. |
| **Habilidad técnica** | Media — usa aplicaciones web cotidianamente pero no es desarrolladora. |
| **Dispositivos** | Desktop (Chrome) en oficina, móvil ocasionalmente. |

---

## Persona 2: Carlos (Manager)

| Atributo | Valor |
|----------|-------|
| **Nombre** | Carlos Mendoza |
| **Rol** | Manager |
| **Cargo** | Gerente de Operaciones de Sucursal |
| **Contexto** | Supervisa el flujo de órdenes y entregas de su sucursal. Necesita visibilidad sobre quién hizo qué cambio y cuándo. Reporta a la sede central. |
| **Motivación** | Tener control y trazabilidad sobre las operaciones de su equipo. Responder rápido a auditorías internas. |
| **Frustraciones** | No saber quién modificó una orden, perder acceso durante reuniones largas, tener que re-autenticarse frecuentemente. |
| **Habilidad técnica** | Media-alta — entiende sistemas, sabe interpretar logs básicos. |
| **Dispositivos** | Laptop (oficina), tablet (piso de almacén). |

---

## Persona 3: Diego (Admin)

| Atributo | Valor |
|----------|-------|
| **Nombre** | Diego Restrepo |
| **Rol** | Admin |
| **Cargo** | Administrador de Sistemas / DevOps |
| **Contexto** | Responsable del mantenimiento de la plataforma. Gestiona usuarios, monitorea el sistema, y responde a incidentes. Necesita acceso a logs de auditoría. |
| **Motivación** | Mantener el sistema seguro y operativo. Poder rastrear cualquier cambio para investigar incidentes. |
| **Frustraciones** | No tener visibilidad de cambios en datos críticos, autenticación insegura que expone el sistema, falta de herramientas de diagnóstico. |
| **Habilidad técnica** | Alta — desarrollador/DevOps con experiencia en seguridad. |
| **Dispositivos** | Desktop (múltiples monitores), terminal SSH. |

---

## Mapeo Persona → Funcionalidad Auth

| Funcionalidad | Ana (User) | Carlos (Manager) | Diego (Admin) |
|---------------|:---:|:---:|:---:|
| Registro (self-service) | ✅ | ✅ | ❌ |
| Login | ✅ | ✅ | ✅ |
| Verificar sesión (/me) | ✅ | ✅ | ✅ |
| Logout | ✅ | ✅ | ✅ |
| Ver audit log | ❌ | ❌ | ✅ |

> **Nota**: En esta iteración los flujos de autenticación (login/logout/sesión) son idénticos para los 3 roles. La diferenciación de permisos se implementará en Fase 2 (Autorización). El admin no se registra por self-service — su cuenta se crea vía seed o por otro admin. La única funcionalidad exclusiva del Admin es el acceso al audit log.
