# TRAINING TOOL - Resumen Ejecutivo del Diseño V1

## 📌 Visión General

Sistema de gestión de entrenamientos para 4-50 atletas. Diseño simple, escalable a corto plazo, sin sobre-ingeniería. Prioridad: claridad, validez de datos y facilidad de mantenimiento.

---

## ✅ Lo que tu modelo hizo bien

1. **Jerarquía clara**: Usuario → Entrenador → Atleta → Semana de entrenamiento → Sesión de entrenamiento → Feedback
2. **Relaciones naturales**: Siguen el flujo real del negocio con el entrenador como vínculo principal
3. **Feedback integrado**: Captura reflexión post-semana en el mismo flujo de seguimiento
4. **Flexibilidad en descripción**: Texto libre para entrenamientos variados
5. **Escalable para V1**: No necesita más entidades para cubrir el alcance inicial

---

## 🔧 Mejoras Implementadas

### 1. **Usuario ↔ Atleta (1:0..1)**
- **Cambio**: Usuario_id en Atleta es NULLABLE
- **Por qué**: Admins no tienen perfil de atleta. Más limpio.

### 2. **Objetivo Activo Garantizado**
- **Cambio**: Partial unique index en `(atleta_id) WHERE activo = true`
- **Por qué**: Garantiza un solo objetivo activo a nivel BD, no solo en app

### 3. **Sin Solapamiento de Semanas**
- **Cambio**: EXCLUDE constraint con daterange
- **Por qué**: Previene calendarios solapados automáticamente

### 4. **Campos Flexibles (JSONB)**
- `dias_disponibles`: Array `["lunes", "martes", ...]`
- `lesiones_ultimo_anio`: Array de objetos `[{"tipo": "...", "fecha": "...", "notas": "..."}]`
- **Por qué**: Cambios sin migraciones, escalabilidad

### 5. **Auditoría Básica**
- **Cambio**: `created_at`, `updated_at` en todas las tablas
- **Por qué**: Historial mínimo sin table de logs
- **Implementación**: Triggers automáticos

### 6. **Validaciones en BD**
- CHECK constraints: peso > 0, fecha_fin >= fecha_inicio
- Motivo requerido si feedback incompleto
- **Por qué**: Integridad de datos sin depender de la app

### 7. **Índices Estratégicos**
- Foreign keys: joins rápidos
- Partial index para objetivos activos: espacio mínimo
- Rango de fechas: reportes rápidos

### 8. **Creación y edición de entrenadores con usuario + perfil**
- **Cambio**: la creación de un entrenador ya no se realiza directamente sobre la tabla `entrenadores`.
- **Regla de negocio**: primero se crea el usuario con rol `ENTRENADOR` y luego se crea el perfil del entrenador usando el `usuario_id` generado.
- **Por qué**: mantiene una relación correcta entre usuario y entrenador y evita perfiles huérfanos o IDs manuales.
- **Implementación**: la operación se hace en backend como una única transacción para garantizar consistencia.
- **Resultado**: si falla alguna parte, la operación completa se revierte y no queda información a medias.

### 9. **Modificación del entrenador y actualización de contraseña**
- **Cambio**: desde administración se puede actualizar `username`, `email` y `nombre` del entrenador usando el `usuario_id` del perfil asociado.
- **Regla**: no se permite cambiar `id_usuario`, `rol`, `usuario_id` ni `password` desde la edición del perfil.
- **Contraseña**: existe una acción específica para actualizar solo el `password_hash` del usuario vinculado.
- **Por qué**: cada dato sigue en su tabla correcta sin duplicar información ni mezclar responsabilidades.

---

## 📊 Estructura Final de Tablas

```
usuario (ADMIN, ATLETA, ENTRENADOR)
  ↓ 1:1
entrenador
  ↓ 1:N
atleta
  ↓ 1:N
semana_entrenamiento (sin solapamientos)
  ↓ 1:N
sesion_entrenamiento + feedback_semanal
```

**Flujo actualizado de negocio**: el seguimiento del atleta queda centrado en el entrenador, desde la semana de entrenamiento hasta la sesión y su feedback.

**Tamaño aproximado para 50 atletas**:
- 50 usuarios
- 50 atletas
- ~100 objetivos históricos
- ~400 semanas de entrenamiento
- ~1000 sesiones
- ~400 feedback

**Espacio estimado**: < 2 MB (sin considerar blocd)

---

## 🔒 Constrains y Validaciones

| Tabla | Constraint | Nivel | Propósito |
|-------|-----------|-------|----------|
| usuario | username UNIQUE | BD | Sin duplicados |
| atleta | peso > 0 | CHECK | Válido |
| objetivo | (atleta, activo=T) UNIQUE | Partial Index | Un objetivo activo |
| semana | fecha_fin >= inicio | CHECK | Coherencia |
| semana | No solapamiento | EXCLUDE | Calendarios disjuntos |
| feedback | motivo si !completa | CHECK | Integridad lógica |

**Resultado**: La BD evita errores de negocio automáticamente.

---

## 🚀 Cómo Usar los Archivos

### 1. **DB_DESIGN_V1.md**
- Revisión detallada del modelo
- Decisiones explicadas
- Diagrama entidad-relación
- Mejoras propuestas

### 2. **schema_v1.sql**
- SQL completo de creación
- ENUM types
- Tablas con constraints
- Triggers para `updated_at`
- Vistas útile
- Comentarios en cada columna

**Uso**:
```bash
psql -U postgres
CREATE DATABASE training_tool;
\c training_tool
\i schema_v1.sql
```

### 3. **queries_ejemplos.sql**
- 27 queries comunes
- Desde login hasta reportes
- Ejemplos de transacciones
- Código Node.js comentado

**Casos**:
- Autenticación
- Gestión de objetivos
- Semanas y sesiones
- Feedback
- Reportes
- Validaciones

### 4. **guia_implementacion_nodejs.js**
- Setup completo
- Modelos (User, Athlete, Objective, Week, Session, Feedback)
- Servicios (Auth)
- Controladores
- Middleware de autenticación
- Rutas REST
- Endpoints recomendados

**Estructura**:
```
src/
├── config/database.js
├── models/
│   ├── User.js
│   ├── Athlete.js
│   ├── Objective.js
│   ├── Week.js
│   ├── Session.js
│   └── Feedback.js
├── services/
│   └── AuthService.js
├── controllers/
│   ├── AuthController.js
│   └── ObjectiveController.js
├── middleware/
│   └── auth.js
├── routes/
│   ├── auth.js
│   └── objectives.js
└── index.js
```

---

## 📈 Índices Recomendados

```sql
-- Búsquedas rápidas
CREATE INDEX idx_usuario_username ON usuario(username);

-- Joins rápidos
CREATE INDEX idx_atleta_usuario_id ON atleta(usuario_id);
CREATE INDEX idx_objetivo_atleta_id ON objetivo(atleta_id);
CREATE INDEX idx_semana_objetivo_id ON semana_entrenamiento(objetivo_id);
CREATE INDEX idx_sesion_semana_id ON sesion_entrenamiento(semana_id);
CREATE INDEX idx_feedback_semana_id ON feedback_semanal(semana_id);

-- Rangos de fechas
CREATE INDEX idx_semana_fechas ON semana_entrenamiento(fecha_inicio, fecha_fin);
CREATE INDEX idx_sesion_fecha ON sesion_entrenamiento(fecha);

-- Objetivo activo (partial index = espacio mínimo)
CREATE UNIQUE INDEX idx_objetivo_activo_por_atleta 
    ON objetivo(atleta_id) WHERE activo = true;
```

**Total de índices**: 10 índices (incluida PK)
**Overhead**: ~5-10% del tamaño de datos

---

## 🔑 Decisiones Importantes Explicadas

### 1. JSONB vs Tablas Separadas
- ✅ Usado para: `dias_disponibles`, `lesiones_ultimo_anio`
- ✅ Ventajas: Flexibilidad, cambios sin migración, menos complejidad
- ⚠️ Trade-off: No puedes hacer JOIN directo en JSON
- ✓ Para V1: Correcto (datos no necesitan normalizarse)

### 2. ON DELETE CASCADE vs SET NULL
- `Usuario → Atleta`: SET NULL (admin sin atleta puede existir)
- `Atleta → Objetivo`: CASCADE (objetivo sin atleta no tiene valor)
- `Objetivo → Semana`: CASCADE (semana huérfana se elimina)
- ✓ Pragmático: Evita huérfanos sin romper datos

### 3. EXCLUDE Constraint para No Solapamiento
- ✓ Requiere: `CREATE EXTENSION btree_gist`
- ✓ Evita: Conflictos de cronograma automáticamente
- ✓ Alternativa (sin EXCLUDE): Validación en app (menos seguro)

### 4. Partial Unique Index
- ✓ Solo indexa objetivos activos
- ✓ Permite N objetivos inactivos
- ✓ Garantiza 1 activo sin constraints complejos
- ✓ Espacio mínimo

### 5. Triggers para updated_at
- ✓ Automático: No necesitas acordarte en cada UPDATE
- ✓ Alternativa: Hacerlo en app (propenso a errores)
- ✓ Para V1: Suficiente (si crece, considerar eventos)

---

## 📋 Checklist de Implementación

- [ ] 1. Crear BD: `CREATE DATABASE training_tool`
- [ ] 2. Ejecutar schema_v1.sql
- [ ] 3. Verificar tablas: `\dt`
- [ ] 4. Verificar ENUM: `SELECT typname FROM pg_type WHERE typtype = 'e'`
- [ ] 5. Instalar Node.js deps: `npm install`
- [ ] 6. Crear .env con credenciales
- [ ] 7. Implementar modelos
- [ ] 8. Implementar servicios
- [ ] 9. Implementar controladores
- [ ] 10. Testar endpoints con Postman
- [ ] 11. Crear tests unitarios
- [ ] 12. Documentar API

---

## 🎯 Endpoints API Sugeridos

```
POST   /api/auth/register         (sin auth)
POST   /api/auth/login            (sin auth)

GET    /api/objectives/:id/active
GET    /api/objectives/:id
POST   /api/objectives/:id
PUT    /api/objectives/:id/activate

GET    /api/weeks/:id/current
GET    /api/weeks/:id/next
GET    /api/weeks/:id
POST   /api/weeks/:id

GET    /api/sessions/:id
POST   /api/sessions/:id
PUT    /api/sessions/:id
DELETE /api/sessions/:id

GET    /api/feedback/:id
POST   /api/feedback/:id
```

**Auth**: JWT en header `Authorization: Bearer <token>`

---

## 🔮 Futuras Mejoras (Post V1)

**Corto plazo** (1-2 meses):
- [ ] Registrar sesiones ejecutadas vs planificadas
- [ ] Dashboard con métricas básicas
- [ ] Reportes PDF semanales

**Mediano plazo** (3-6 meses):
- [ ] Templates de semanas (reutilizar planes)
- [ ] Notificaciones de sesiones
- [ ] Análisis de tendencias (velocidad, resistencia, etc.)

**Largo plazo** (6+ meses):
- [ ] Machine learning para recomendaciones
- [ ] Integración con dispositivos wearables
- [ ] App móvil nativa

---

## ⚠️ Limitaciones Conocidas (V1)

1. **JSONB no es queryable directamente** → Si necesitas filtrar por lesión específica, necesitarás lógica en app
2. **Sin historial de cambios** → No hay registro de cuándo cambió un objetivo
3. **Sin soft deletes** → Eliminar es definitivo (OK para atletas, revisar para datos críticos)
4. **Sin fecha fija en la sesión** → La sesión se planifica como orden dentro de la semana; el atleta decide cuándo ejecutarla entre el lunes y el domingo.
5. **Sin múltiples entrenamientos por día** → Si necesitas eso, usar `orden`/`secuencia` para mantener la secuencia semanal sin anclar fecha.

---

## 📞 Soporte y Debugging

### Verificar integridad:
```sql
-- ¿Hay objetivos sin un atlas?
SELECT o.* FROM objetivo o 
LEFT JOIN atleta a ON o.atleta_id = a.id 
WHERE a.id IS NULL;

-- ¿Hay semanas solapadas? (debería estar vacío)
SELECT s1.id, s2.id FROM semana_entrenamiento s1
JOIN semana_entrenamiento s2 ON s1.objetivo_id = s2.objetivo_id 
  AND s1.id < s2.id
  AND NOT (s1.fecha_fin < s2.fecha_inicio OR s2.fecha_fin < s1.fecha_inicio);

-- ¿Feedback sin motivo si está incompleta? (debería estar vacío)
SELECT * FROM feedback_semanal 
WHERE completada = false AND motivo_no_completada IS NULL;
```

### Performance:
```sql
-- Ver planes de query
EXPLAIN ANALYZE SELECT ... FROM objetivo WHERE atleta_id = 1 AND activo = true;

-- Ver índices sin usar
SELECT * FROM pg_stat_user_indexes WHERE idx_scan = 0;
```

---

## 📚 Referencias Rápidas

- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **Constraints**: https://www.postgresql.org/docs/current/ddl-constraints.html
- **JSONB**: https://www.postgresql.org/docs/current/datatype-json.html
- **Node.js pg**: https://node-postgres.com/
- **bcrypt**: https://github.com/kelektiv/node.bcrypt.js
- **JWT**: https://jwt.io/

---

## 📝 Notas Finales

Este diseño está optimizado para:
- ✅ Equipos pequeños (1-5 desarrolladores)
- ✅ Proyectos MVP (6-12 meses)
- ✅ Escalabilidad moderada (50-500 atletas)
- ✅ Mantenibilidad (código claro, BD clara)

**Costo de cambios post V1**: Bajo si tienes tests
**Riesgo**: Bajo (constraints en BD protegen integridad)
**Complejidad**: Baja (sin arquitectura sobre-complicada)

---

## 🚀 Próximos Pasos

1. **Hoy**: Revisa DB_DESIGN_V1.md
2. **Mañana**: Ejecuta schema_v1.sql en tu PostgreSQL local
3. **Día 3**: Implementa modelos de Node.js
4. **Semana 1**: Endpoints CRUD funcionando
5. **Semana 2**: Tests y documentación API

¡Good luck! 🎯

