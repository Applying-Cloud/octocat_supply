# Applying Standards — Demo (Ultracorta)

**Ir a:** `.kiro/aws-aidlc-rule-details/extensions/applying-standards.md`

---

## 3 Gates que Importan

### 1️⃣ Auditoría Inmutable
**Cambios en Order/OrderDetail/Delivery → INSERT audit_log**
- Quién: user_id
- Qué: old_values, new_values
- Cuándo: timestamp

→ Cliente en Acto 2 verá: "Fulfillment está auditado"

### 2️⃣ Autenticación Real
**Hoy:** Mock (acepta cualquier password)
**Requerido:** JWT + bcrypt

→ Cliente verá: "Generó login endpoint con validación real"

### 3️⃣ No SQL Concatenada
**RECHAZAR:** `SELECT * FROM orders WHERE id = ${id}`
**ACEPTAR:** `SELECT * FROM orders WHERE id = $1` con params

→ Cliente verá: "El agente dice NO a SQL insegura"

---

## Eso es todo.