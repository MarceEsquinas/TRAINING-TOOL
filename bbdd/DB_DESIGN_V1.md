# Diseño de Base de Datos - Training Tool V1

## 📋 Revisión Crítica del Modelo Propuesto

### ✅ Lo que está bien:

1. **Jerarquía de entidades clara**: Usuario → Atleta → Objetivo → Semanas → Sesiones
2. **Relaciones bien definidas**: Siguen el dominio del negocio
3. **FeedbackSemanal 1:1**: Captura el patrón de reflexión post-semana
4. **Simplicidad**: No sobre-ingeniería para 4-50 atletas

### ⚠️ Puntos de mejora para V1:

1. **Usuario ↔ Atleta (1:1)**:
   - Problema: ¿Qué pasa con los admins? ¿También tienen registro de Atleta?
   - Solución: Hacer **1:0..1** (un usuario puede ser o admin o atleta)
   - Cambio: `usuario_id` en `Atleta` será **NULLABLE**

2. **Objetivo - Campo "activo"**:
   - Problema: No hay constraint que garantice un solo activo
   - Solución: Añadir constraint UNIQUE DONDE activo = true
   - Cambio: Usar partial unique index

3. **SemanaEntrenamiento - Solapamiento**:
   - Problema: Nada impide que dos semanas del mismo objetivo se solapen
   - Solución: Constraint exclusiva EXCLUDE para fechas de un objetivo
   - Cambio: Añadir EXCLUDE constraint

4. **Campos "dias_disponibles" y "lesiones"**:
   - Problema: Ambiguos. ¿String? ¿Array? ¿JSON?
   - Solución para V1: JSON simple
   - Cambio: Usar tipo JSONB para flexibilidad

5. **Auditoría mínima**:
   - Falta: Fechas de creación/actualización
   - Solución: Añadir `created_at`, `updated_at` en tablas principales

6. **Tipos de datos**:
   - Cambio: Usar ENUM para `rol`, `sexo`
   - Cambio: Usar DATE para fechas de objetivo, TIMESTAMP para creación

7. **Validaciones**:
   - Falta: Validación de peso (no negativo)
   - Cambio: Añadir CHECK constraints

---

## 🔄 Diagrama Entidad-Relación (Textual)

```
┌─────────────────────────────────────────────────────────────┐
│                         usuario                              │
├─────────────────────────────────────────────────────────────┤
│ PK: id                                                        │
│ username (UNIQUE NOT NULL)                                    │
│ password_hash                                                 │
│ rol (ENUM: ADMIN, ATLETA) NOT NULL                          │
│ created_at, updated_at                                       │
└────────────────────┬────────────────────────────────────────┘
                     │ 1
                     │ (0..1)
                     │ usuario_id
                     │ (NULLABLE)
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                        atleta                                │
├─────────────────────────────────────────────────────────────┤
│ PK: id                                                        │
│ FK: usuario_id (NULLABLE, UNIQUE)                           │
│ nombre NOT NULL                                              │
│ sexo (ENUM: M, F)                                           │
│ peso (DECIMAL, CHECK > 0)                                   │
│ dias_disponibles (JSONB) -- ["lunes", "martes", ...]       │
│ km_medios_ultimos_2_meses (NUMERIC)                         │
│ lesiones_ultimo_anio (JSONB) -- flexible para notas         │
│ created_at, updated_at                                      │
└────────────────────┬────────────────────────────────────────┘
                     │ 1
                     │
                     │ N
                     │ atleta_id
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                       objetivo                               │
├─────────────────────────────────────────────────────────────┤
│ PK: id                                                        │
│ FK: atleta_id NOT NULL                                      │
│ nombre NOT NULL                                              │
│ fecha_objetivo (DATE) NOT NULL                              │
│ activo (BOOLEAN) -- Constraint: max 1 activo por atleta     │
│ created_at, updated_at                                      │
│                                                              │
│ CONSTRAINT: (atleta_id, activo) UNIQUE WHERE activo = true │
└────────────────────┬────────────────────────────────────────┘
                     │ 1
                     │
                     │ N
                     │ objetivo_id
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  semana_entrenamiento                        │
├─────────────────────────────────────────────────────────────┤
│ PK: id                                                        │
│ FK: objetivo_id NOT NULL                                    │
│ fecha_inicio (DATE) NOT NULL                                │
│ fecha_fin (DATE) NOT NULL                                   │
│ CHECK: fecha_fin >= fecha_inicio                            │
│ created_at, updated_at                                      │
│                                                              │
│ CONSTRAINT: No se solapan fechas del mismo objetivo         │
└────────────────┬──────────────────────────────────────────┘
         ┌───────┴──────────┐
         │ 1                │ 1
         │                  │
         │ 0..N             │ 1 (PK=FK)
         │                  │
    semana_id          semana_id
         │                  │
         ▼                  ▼
    ┌─────────────┐  ┌──────────────────────┐
    │   sesion    │  │  feedback_semanal    │
    ├─────────────┤  ├──────────────────────┤
    │ PK: id      │  │ PK: id               │
    │ FK: semana  │  │ FK: semana_id (UK)   │
    │ fecha       │  │ completada           │
    │ descripcion │  │ motivo_no_completada │
    │ km_plan     │  │ sensaciones          │
    │ created_at  │  │ molestias            │
    └─────────────┘  │ ritmo_rodaje         │
                     │ created_at, updated_at│
                     └──────────────────────┘
```

---

## 📊 Definiciones de Tablas

### 1. ENUM Types

```sql
-- Roles de usuario
CREATE TYPE rol_enum AS ENUM ('ADMIN', 'ATLETA');

-- Sexo del atleta
CREATE TYPE sexo_enum AS ENUM ('M', 'F');
```

### 2. Tabla `usuario`

```sql
CREATE TABLE usuario (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol rol_enum NOT NULL DEFAULT 'ATLETA',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índice para búsquedas por username
CREATE INDEX idx_usuario_username ON usuario(username);
```

**Decisiones**:
- `password_hash`: La contraseña se hashea en Node.js (bcrypt/argon2), no en BD
- Campos timestamp para auditoría básica
- Índice en username para login rápido

---

### 3. Tabla `atleta`

```sql
CREATE TABLE atleta (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    sexo sexo_enum,
    peso NUMERIC(5, 2) CHECK (peso > 0),
    dias_disponibles JSONB DEFAULT '[]',
    km_medios_ultimos_2_meses NUMERIC(5, 2),
    lesiones_ultimo_anio JSONB DEFAULT '[]',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_usuario FOREIGN KEY (usuario_id)
        REFERENCES usuario(id) ON DELETE SET NULL
);

-- Índice para búsquedas por usuario
CREATE INDEX idx_atleta_usuario_id ON atleta(usuario_id);
```

**Decisiones**:
- `usuario_id` NULLABLE y UNIQUE: Un admin no tiene atleta, un atleta tiene un usuario
- `peso` NUMERIC(5,2): Hasta 999.99 kg, 2 decimales
- `dias_disponibles` JSONB: Ejemplo: `["lunes", "martes", "jueves"]`
- `lesiones_ultimo_anio` JSONB: Ejemplo: `[{"tipo": "tobillo", "fecha": "2025-06", "notas": "..."}]`
- CHECK en peso para evitar valores negativos

---

### 4. Tabla `objetivo`

```sql
CREATE TABLE objetivo (
    id SERIAL PRIMARY KEY,
    atleta_id INTEGER NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    fecha_objetivo DATE NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_atleta FOREIGN KEY (atleta_id)
        REFERENCES atleta(id) ON DELETE CASCADE
);

-- Índice para búsquedas por atleta
CREATE INDEX idx_objetivo_atleta_id ON objetivo(atleta_id);

-- Constraint: Un solo objetivo activo por atleta
CREATE UNIQUE INDEX idx_objetivo_activo_por_atleta 
    ON objetivo(atleta_id) 
    WHERE activo = true;
```

**Decisiones**:
- `ON DELETE CASCADE`: Si se elimina un atleta, se eliminan sus objetivos
- Unique partial index para garantizar un solo objetivo activo
- La aplicación debe manejar transacciones al cambiar objetivos

---

### 5. Tabla `semana_entrenamiento`

```sql
CREATE TABLE semana_entrenamiento (
    id SERIAL PRIMARY KEY,
    objetivo_id INTEGER NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_objetivo FOREIGN KEY (objetivo_id)
        REFERENCES objetivo(id) ON DELETE CASCADE,
    CONSTRAINT fecha_valida CHECK (fecha_fin >= fecha_inicio),
    CONSTRAINT no_solapamiento EXCLUDE USING gist (
        objetivo_id WITH =,
        daterange(fecha_inicio, fecha_fin, '[]') WITH &&
    )
);

-- Índices
CREATE INDEX idx_semana_objetivo_id ON semana_entrenamiento(objetivo_id);
CREATE INDEX idx_semana_fechas ON semana_entrenamiento(fecha_inicio, fecha_fin);
```

**Decisiones**:
- EXCLUDE constraint: Previene solapamiento de fechas en el mismo objetivo
- Requiere extensión `btree_gist` en PostgreSQL
- Índices en objetivo_id y fechas para queries comunes

---

### 6. Tabla `sesion_entrenamiento`

```sql
CREATE TABLE sesion_entrenamiento (
    id SERIAL PRIMARY KEY,
    semana_id INTEGER NOT NULL,
    fecha DATE NOT NULL,
    descripcion TEXT NOT NULL,
    kilometros_planificados NUMERIC(5, 2),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_semana FOREIGN KEY (semana_id)
        REFERENCES semana_entrenamiento(id) ON DELETE CASCADE
);

-- Índices
CREATE INDEX idx_sesion_semana_id ON sesion_entrenamiento(semana_id);
CREATE INDEX idx_sesion_fecha ON sesion_entrenamiento(fecha);
```

**Decisiones**:
- `descripcion` TEXT: Permite cualquier formato (Z2 60', 12km suaves, etc.)
- `fecha` con índice: Para reportes por fecha
- La sesión hereda la eliminación de su semana

---

### 7. Tabla `feedback_semanal`

```sql
CREATE TABLE feedback_semanal (
    id SERIAL PRIMARY KEY,
    semana_id INTEGER NOT NULL UNIQUE,
    completada BOOLEAN NOT NULL DEFAULT true,
    motivo_no_completada VARCHAR(255),
    sensaciones TEXT,
    molestias TEXT,
    ritmo_rodaje TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_semana FOREIGN KEY (semana_id)
        REFERENCES semana_entrenamiento(id) ON DELETE CASCADE,
    CONSTRAINT motivo_requerido CHECK (
        (completada = true) OR 
        (completada = false AND motivo_no_completada IS NOT NULL)
    )
);

-- Índice para búsquedas por semana
CREATE INDEX idx_feedback_semana_id ON feedback_semanal(semana_id);
```

**Decisiones**:
- `semana_id` UNIQUE: Garantiza 1:1 sin constraint específico
- CHECK constraint: Si no está completada, debe haber motivo
- Campos de texto NULLABLE: El atleta completa según su experiencia

---

## 🔒 Restricciones Recomendadas (Resumen)

| Tabla | Restricción | Tipo | Propósito |
|-------|-------------|------|----------|
| `usuario` | username UNIQUE | UNIQUE | Sin logins duplicados |
| `atleta` | usuario_id UNIQUE | UNIQUE | 1:1 con usuario |
| `atleta` | peso > 0 | CHECK | Dato válido |
| `objetivo` | (atleta_id, activo=true) UNIQUE | UNIQUE (partial) | Un objetivo activo |
| `semana_entrenamiento` | fecha_fin >= fecha_inicio | CHECK | Fechas coherentes |
| `semana_entrenamiento` | No solapamiento | EXCLUDE | Calendarios disjuntos |
| `feedback_semanal` | semana_id UNIQUE | UNIQUE | 1:1 feedback-semana |
| `feedback_semanal` | motivo si no completada | CHECK | Integridad lógica |

---

## 📈 Índices Recomendados (Resumen)

```sql
-- Búsquedas y logins
CREATE INDEX idx_usuario_username ON usuario(username);

-- Joins y filtros
CREATE INDEX idx_atleta_usuario_id ON atleta(usuario_id);
CREATE INDEX idx_objetivo_atleta_id ON objetivo(atleta_id);
CREATE INDEX idx_semana_objetivo_id ON semana_entrenamiento(objetivo_id);
CREATE INDEX idx_sesion_semana_id ON sesion_entrenamiento(semana_id);
CREATE INDEX idx_feedback_semana_id ON feedback_semanal(semana_id);

-- Rangos de fechas
CREATE INDEX idx_semana_fechas ON semana_entrenamiento(fecha_inicio, fecha_fin);
CREATE INDEX idx_sesion_fecha ON sesion_entrenamiento(fecha);

-- Constraint de objetivo activo
CREATE UNIQUE INDEX idx_objetivo_activo_por_atleta 
    ON objetivo(atleta_id) WHERE activo = true;
```

---

## 🎯 Decisiones Importantes Explicadas

### 1. **JSONB para campos flexibles**
   - `dias_disponibles`: Array de strings → permite cambios sin migración
   - `lesiones_ultimo_anio`: Array de objetos → estructura flexible
   - No es SQL puro, pero es pragmático para V1

### 2. **ON DELETE CASCADE vs SET NULL**
   - Atleta → Objetivo: CASCADE (un objetivo sin atleta no tiene sentido)
   - Usuario → Atleta: SET NULL (un admin puede existir sin atleta)
   - Objetivo → Semana: CASCADE (semanas huérfanas no se usan)

### 3. **Partial Unique Index para objetivo activo**
   - Solo indexa objetivos activos
   - Permite múltiples inactivos, pero garantiza uno activo
   - Más eficiente que constraint en toda la tabla

### 4. **EXCLUDE constraint para no solapamiento**
   - Evita conflictos de cronograma a nivel BD
   - Requiere `CREATE EXTENSION btree_gist`
   - Previene bugs de negocio

### 5. **Timestamps (created_at, updated_at)**
   - Auditoría mínima sin tabla de logs
   - created_at con DEFAULT CURRENT_TIMESTAMP
   - updated_at requiere trigger o manejo en app

### 6. **NUMERIC vs FLOAT**
   - Peso, km: NUMERIC(5,2) → precisión exacta
   - No hay pérdida de precisión en cálculos
   - Mejor para datos financieros/deportivos

### 7. **Feedback con CHECK lógico**
   - Si no completada, requiere motivo
   - Mantiene integridad sin aplicación

---

## 📋 Características de Escalabilidad Moderada

Para 4-50 atletas, este diseño:
- ✅ No tiene N+1 queries inherentes
- ✅ Índices en foreign keys mejoran JOINs
- ✅ Partial indexes ahorran espacio
- ✅ JSONB permite cambios sin migraciones
- ⚠️ Si crece > 10k semanas, considerar particionamiento por fecha

---

## 🚀 Mejoras Futuras (Post V1)

1. **Tabla de sesiones ejecutadas**: Registrar sesiones completadas vs planificadas
2. **Métricas semanales**: Tabla desnormalizada para reportes rápidos
3. **Historial de cambios**: Auditoría completa con tabla de logs
4. **Planes entrenamiiento reutilizables**: Template de semanas para atletas similares
5. **Notificaciones**: Tabla para alertas y recordatorios
6. **Análisis**: Materialized views para reportes complejos

