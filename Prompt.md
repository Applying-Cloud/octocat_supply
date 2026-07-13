# Prompt: Generar Vision y Technical Environment (Brownfield)

## Requerimiento

Implementar autenticación persistente de usuarios para OctoCAT Supply Chain. Actualmente el AuthContext del frontend es un mock sin persistencia — no existe tabla de usuarios en base de datos, ni validación real de credenciales. El login simula autenticación verificando solo que el email no esté vacío.

Se requiere una implementación real de usuarios persistida en base de datos. El usuario se identifica por correo electrónico (userId = email) y se autentica con contraseña. El backend debe exponer endpoints de autenticación, almacenar usuarios en DB, y el frontend debe integrar el flujo real de login/logout contra el API.

## Instrucción

Genera dos documentos bajo `Product-Definition/` siguiendo las estructuras brownfield mínimas del framework AI-DLC v1.

### Referencias de formato (leer antes de generar)

- **Vision:** https://github.com/awslabs/aidlc-workflows/blob/v1.0.1/docs/writing-inputs/example-minimal-vision-brownfield.md
- **Technical Environment:** https://github.com/awslabs/aidlc-workflows/blob/v1.0.1/docs/writing-inputs/example-minimal-tech-env-brownfield.md

---

## Estructura Requerida: `Product-Definition/vision.md`

```markdown
# Vision: [Nombre de Feature] — [Nombre del Proyecto]

Proyecto brownfield. Este documento describe un cambio a un sistema existente.

## Estado Actual
Un párrafo describiendo qué hace el sistema hoy, incluyendo el estado del componente
o funcionalidad que se va a implementar/cambiar.

## Qué Estamos Agregando
Descripción clara del cambio: qué se construye y cuál es su propósito.

## Features En Scope (esta iteración)
Lista de funcionalidades incluidas en este incremento.

## Features Explícitamente Fuera de Scope (esta iteración)
Lista de funcionalidades excluidas con indicación de fase futura.

## Qué NO Debe Cambiar
Componentes, APIs, tablas o datos existentes que el nuevo trabajo no debe tocar.

## Preguntas Abiertas
Decisiones pendientes que deben resolverse antes de pasar a diseño.
```

---

## Estructura Requerida: `Product-Definition/technical-environment.md`

```markdown
# Technical Environment: [Nombre de Feature] — [Nombre del Proyecto]

Proyecto brownfield. El stack existente es la línea base. El código nuevo debe
encajar en los patrones establecidos. Donde no se liste una opción, seguir el
codebase existente — no introducir patrones nuevos sin justificación.

## Stack Existente (debe preservarse)
Tabla con: Capa | Tecnología Actual | Versión | Notas
(language, runtime, API framework, database, infra, package manager, test framework, linter)

## Qué Agregar (nuevo para este módulo)
Lista de servicios, tablas, componentes nuevos que se introducen.
Indicar que no deben modificar tablas o contratos existentes.

## Qué Debe Permanecer Sin Cambios
Lista de servicios, schemas, contratos, configs que no se tocan.

## Patrones Prohibidos
Tabla con: Prohibido | Razón | Usar en su lugar
(librerías o enfoques que conflictúan con el codebase existente)

## Seguridad
Cómo funciona auth y secretos en el sistema existente.
Indicar mecanismo actual (o ausencia) y qué se necesita implementar.

## Patrones de Código Existentes
Ejemplos del codebase actual que el código nuevo debe seguir:
- Un route handler (Express)
- Una función de query a base de datos (repositorio)
- Un test
```

---

## Reglas
- La sección Stack Existente debe reflejar las versiones exactas encontradas en los archivos de configuración del proyecto
- Formato: prosa descriptiva en secciones narrativas, tablas donde corresponda, listas con viñetas en scope/out-of-scope/preguntas
- Idioma: español
- No asumir decisiones técnicas en las preguntas abiertas — solo plantearlas
- Stack: Express.js + React + TypeScript + PostgreSQL (producción) / SQLite (testing)
- Respetar convención brownfield: describir estado actual antes del cambio propuesto
- Leer los ejemplos de referencia (links arriba) antes de generar para respetar tono y nivel de detalle

---

# Instalación de AI-DLC v1 en Kiro CLI — WSL Ubuntu

Prerequisitos:
- WSL Ubuntu instalado y activado
- Kiro CLI instalado en WSL
- OctoCAT clonado en `~/git/demo-ai-dlc/octocat_supply`
- Git configurado

---

## Paso 1: Descargar la release de AI-DLC v1 en /tmp/

Abre terminal en WSL y descarga el zip desde la release más reciente (v0.1.8 o superior) en una carpeta temporal:

```bash
cd /tmp

# Descargar el release zip de AI-DLC
curl -L https://github.com/awslabs/aidlc-workflows/releases/download/v1.0.1/ai-dlc-rules-v1.0.1.zip -o ai-dlc-rules.zip

# Extraer en /tmp
unzip ai-dlc-rules.zip

# Verifica que veas aidlc-rules/ con sus subdirectorios
ls -la aidlc-rules/
# Deberías ver: aws-aidlc-rules/ y aws-aidlc-rule-details/
```

---

## Paso 2: Crear estructura de carpetas en el proyecto

Entra a tu carpeta de OctoCAT y crea la estructura para Kiro steering files:

```bash
cd ~/git/demo-ai-dlc/octocat_supply

# Crear directorio de steering files de Kiro
mkdir -p .kiro/steering

```

---

## Paso 3: Copiar archivos de AI-DLC v1 al proyecto

```bash
# Copiar core workflow rules a .kiro/steering
cp -r /tmp/aidlc-rules/aws-aidlc-rules .kiro/steering/

# Copiar detailed rules (reglas detalladas por fase)
cp -r /tmp/aidlc-rules/aws-aidlc-rule-details .kiro/
```

Verifica la estructura:

```bash
# Ver estructura en .kiro/
tree .kiro/ -L 2

# Deberías ver algo como:
# .kiro/
# └── steering/
#     └── aws-aidlc-rules/
#         ├── core-workflow.md
#         └── [otros archivos]

# Y en .aidlc-rule-details/
tree .aidlc-rule-details/ -L 1

# Deberías ver:
# .aidlc-rule-details/
# ├── common/
# ├── inception/
# ├── construction/
# ├── extensions/
# └── operations/
```

---

## Paso 4: Validar que Kiro CLI cargó los steering files

Desde WSL, en la carpeta del proyecto, ejecuta Kiro CLI para verificar:

```bash
cd ~/git/demo-ai-dlc/octocat_supply

# Inicia Kiro CLI
kiro-cli

# Dentro de Kiro CLI, ejecuta:
/context show
```

Deberías ver en la salida entradas para `.kiro/steering/aws-aidlc-rules` indicando que fueron cargados.

Si ves un error o no aparece, revisa:
- Que los archivos copiados están en `.kiro/steering/aws-aidlc-rules/core-workflow.md`
- Que `.aidlc-rule-details/` contiene las carpetas `common/`, `inception/`, etc.

---

## Paso 5: Preparar para el flujo

Una vez validado, estás listo para:

1. Crear `inception/vision.md` en `~/git/demo-ai-dlc/octocat_supply/aidlc-docs/inception/`
2. Crear `inception/technical-environment.md` en la misma carpeta
3. Disparar el workflow AI-DLC desde Kiro CLI con tus documentos listos

---

## Inicio del workflow (cuando estés listo)

Desde Kiro CLI en la carpeta del proyecto:

```bash
# Primero entra a la carpeta
cd ~/git/demo-ai-dlc/octocat_supply

# Inicia Kiro CLI
kiro-cli

# En Kiro CLI:
Using AI-DLC, analyze this brownfield project and generate requirements for [tu feature/capacidad]
```

El workflow detectará que es brownfield, ejecutará Reverse Engineering sobre OctoCAT, y generará los documentos en `aidlc-docs/`.

---

## Troubleshooting

**Error: "ai-dlc-rules not found"**
- Verifica que `.kiro/steering/aws-aidlc-rules/` existe y contiene `core-workflow.md`
- Reinicia Kiro CLI: `exit` y abre de nuevo

**Error: "No rule details found"**
- Verifica que `.aidlc-rule-details/` existe y contiene `common/`, `inception/`, `construction/`, `extensions/`, `operations/`
- Copia nuevamente: `cp -r ~/Downloads/aidlc-rules/aws-aidlc-rule-details/* .aidlc-rule-details/`

**Archivos en `/mnt/c/` vs `/home/`**
- Si OctoCAT está en `/mnt/c/...`, muévelo a `/home/usuario/octocat-supply` para mejor rendimiento en WSL

---

## Limpieza (después de validar que todo funciona)

Una vez confirmado que AI-DLC v1 está cargado en Kiro CLI (`/context show`), elimina los archivos temporales:

```bash
# Eliminar descarga y extracción de /tmp/
rm -rf /tmp/ai-dlc-rules.zip /tmp/aidlc-rules/
```

Verifica que se eliminó:

```bash
ls /tmp/ | grep -i aidlc  # No debe devolver nada
```

---

- Release oficial: https://github.com/awslabs/aidlc-workflows/releases/tag/v0.1.8
- Documentación: https://github.com/awslabs/aidlc-workflows
----

# Prompt: Iniciar AI-DLC

Ejecuta el framework AI-DLC y usa como input los documentos:

- `Product-Definition/vision.md`
- `Product-Definition/technical-environment.md`




Vuelve a correr Requirements Analysis. Se agregó la extensión extensions/applying-standards.md que no fue considerada en la
  ejecución previa


User Story

Agregar auditoria de inicio de sesion (login)

Quitar Auditoría de Cambios en tablas principales como ordenes ya que actualmente no se encuentra implementado el proceso de crear ordenes
