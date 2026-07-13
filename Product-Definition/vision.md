# Vision: Autenticación Persistente de Usuarios — OctoCAT Supply Chain

Proyecto brownfield. Este documento describe un cambio a un sistema existente.

## Estado Actual

OctoCAT Supply Chain es una plataforma de gestión de cadena de suministro construida con un backend en Express.js (TypeScript) y un frontend en React (TypeScript). El sistema gestiona proveedores, productos, órdenes, entregas y sucursales. Actualmente **no existe ningún mecanismo real de autenticación**. El frontend tiene un `AuthContext` que simula login verificando únicamente que el campo email no esté vacío — cualquier combinación de email y password es aceptada. No existe tabla de usuarios en la base de datos, no se almacenan credenciales, no se emiten tokens, y el backend no valida identidad en ningún endpoint. El rol de administrador se asigna de forma ficticia según el dominio del email (`@github.com`).

## Qué Estamos Agregando

Un módulo de autenticación real y persistente que permita a los usuarios registrarse e iniciar sesión con credenciales almacenadas en base de datos. El usuario se identifica por correo electrónico (que funciona como userId) y se autentica con contraseña hasheada. El backend expondrá endpoints REST de autenticación (registro, login, logout, sesión actual), almacenará usuarios en una tabla dedicada, y el frontend integrará el flujo completo contra el API reemplazando el mock actual.

## Features En Scope (esta iteración)

- Tabla `users` en base de datos con campos: email (PK/unique), password hash, nombre, rol, timestamps
- Endpoint `POST /api/auth/register` — registro de usuario con validación de email y contraseña
- Endpoint `POST /api/auth/login` — autenticación de credenciales, emisión de token/sesión
- Endpoint `POST /api/auth/logout` — invalidación de sesión
- Endpoint `GET /api/auth/me` — obtener usuario autenticado actual
- Almacenamiento seguro de contraseñas (hashing con salt)
- Migración de base de datos para crear tabla `users` (SQLite y PostgreSQL)
- Refactorización del `AuthContext` del frontend para consumir los endpoints reales
- Persistencia de sesión en el frontend (token en localStorage o cookie)
- Seed de usuario(s) de prueba para desarrollo

## Features Explícitamente Fuera de Scope (esta iteración)

- Autorización basada en roles para endpoints existentes (Fase 2)
- Middleware de protección de rutas del backend (Fase 2)
- Recuperación de contraseña / flujo de "olvidé mi contraseña" (Fase 2)
- Verificación de email al registrarse (Fase 2)
- OAuth / login social (Fase 3)
- Refresh tokens o rotación de tokens (Fase 2)
- Multi-factor authentication (Fase 3)
- Gestión de perfiles de usuario (editar nombre, cambiar contraseña) (Fase 2)

## Qué NO Debe Cambiar

- Tablas existentes: `suppliers`, `headquarters`, `branches`, `products`, `orders`, `order_details`, `deliveries`, `order_detail_deliveries` — no se modifican
- Endpoints REST existentes (`/api/suppliers`, `/api/products`, `/api/orders`, etc.) — no se modifican ni se protegen en esta iteración
- Datos seed existentes (proveedores, productos, sucursales)
- Configuración de CORS, Swagger, middleware de logging existente
- Flujo de migración y seed de la base de datos existente — solo se agregan nuevas migraciones
- Estructura del frontend (rutas, componentes de negocio, layout) — solo se modifica el `AuthContext` y los componentes de login/registro

## Preguntas Abiertas

- ¿Qué mecanismo de sesión usar: JWT stateless almacenado en el cliente, o sesiones server-side con cookie httpOnly?
- ¿Qué librería de hashing de contraseñas usar: bcrypt, argon2, o scrypt nativo de Node.js?
- ¿Se requiere un largo mínimo o reglas de complejidad para la contraseña en esta iteración, o basta con un mínimo de caracteres?
- ¿El campo `rol` del usuario debe ser un enum fijo (admin/user) o un texto libre extensible?
- ¿Los usuarios de seed para desarrollo deben tener credenciales conocidas documentadas, o generarse aleatoriamente?
- ¿El registro de usuarios debe estar abierto (self-registration) o restringido a un administrador?
