# Caso de Uso: Dashboard del Entrenador

## 📋 Descripción General

El **Dashboard** es la pantalla principal del entrenador cuando abre la aplicación. Su objetivo es permitir que en menos de 10 segundos, el entrenador sepa qué atletas requieren su atención y qué acciones debe tomar.

**Principio de diseño**: La aplicación debe ayudar al entrenador a decidir qué hacer, no simplemente mostrar información de la base de datos.

---

## 🎯 Objetivo del Caso de Uso

Proporcionar una vista centralizada y priorizada que:
1. Resume el estado general del programa de entrenamiento
2. Identifica atletas que requieren intervención inmediata
3. Facilita acciones rápidas (marcar notificaciones como leídas, acceder a planificación)
4. Usa priorización inteligente para destacar los casos más urgentes

---

## 🧑‍💼 Actor Principal

**Entrenador** - Usuario con rol `ADMIN` o `ATLETA_COACH` que gestiona múltiples atletas

---

## 📊 Estructura de Datos

### 1. Resumen (KPIs)

```json
{
  "num_atletas_activos": 12,
  "num_feedback_nuevos": 3,
  "num_planificaciones_pendientes": 2,
  "num_objetivos_proximos": 1
}
```

**Interpretación:**
- **num_atletas_activos**: Atletas con un objetivo activo (en seguimiento)
- **num_feedback_nuevos**: Notificaciones de feedback no leídas (acción: revisar)
- **num_planificaciones_pendientes**: Atletas cuya planificación vence en ≤ 2 días (acción: planificar)
- **num_objetivos_proximos**: Atletas con objetivo ≤ 9 días (acción: revisar, motivar)

### 2. Notificaciones

Eventos ordenados por fecha (más reciente primero):

```json
{
  "id": 42,
  "tipo": "feedback_enviado",
  "atleta_id": 5,
  "atleta_nombre": "Juan Pérez",
  "objetivo_id": 12,
  "objetivo_nombre": "Media maratón 1:45",
  "semana_id": 87,
  "fecha_envio": "2026-06-17T19:30:00Z",
  "resumen": "Sensaciones buenas | Molestias: ninguna",
  "leido": false
}
```

**Flujo:**
- Al atleta enviar `feedback_semanal`, el sistema crea automáticamente una notificación (trigger en BD).
- El entrenador marca como `leido = true` cuando la revisa.
- Permite que el entrenador no pierda feedbacks importantes.

### 3. Lista de Atletas Priorizada

```json
{
  "atleta_id": 5,
  "nombre": "Juan Pérez",
  "objetivo_id": 12,
  "objetivo_nombre": "Media maratón 1:45",
  "dias_hasta_objetivo": 24,
  "semana_id": 87,
  "semana_fecha_inicio": "2026-06-16",
  "semana_fecha_fin": "2026-06-22",
  "km_planificados_semana": 65.5,
  "km_realizados_semana": 42.3,
  "estado_prioritario": "planificacion_pendiente",
  "razon_estado": "faltan 2 dias y 0 sesiones planificadas",
  "acciones": [
    {
      "tipo": "abrir_planificacion",
      "ruta": "/planificacion/87",
      "label": "Planificar semana"
    }
  ]
}
```

---

## 🔄 Flujo de Priorización

Los atletas se ordenan por **prioridad** (1º → 4º) y luego **alfabéticamente**:

### Prioridad 1: Planificación Pendiente
**Condición:** `fecha_fin - hoy ≤ 2 días` AND `sesiones_planificadas = 0`

- **Estado:** `planificacion_pendiente`
- **Razón:** "faltan X días y 0 sesiones planificadas"
- **Acción:** Clic → acceder a pantalla de planificación
- **Importancia:** Máxima. El entrenador debe asegurar que la próxima semana esté diseñada a tiempo

### Prioridad 2: Objetivo Próximo a Finalizar
**Condición:** `fecha_objetivo - hoy ≤ 9 días`

- **Estado:** `objetivo_proximo`
- **Razón:** "objetivo en X días"
- **Acción:** Opcional (vista, análisis de carga)
- **Importancia:** Alta. Última semana del plan; foco en adaperse y gestionar la carga

### Prioridad 3: Todo Correcto
**Condición:** Ninguna de las anteriores

- **Estado:** `ok`
- **Razón:** "todo correcto"
- **Acción:** Solo vista de seguimiento
- **Importancia:** Baja. Seguimiento normal

---

## 📏 Métricas por Atleta

### Kilómetros Semanales

```
km_planificados_semana = SUM(sesion_entrenamiento.kilometros_planificados)
  WHERE semana_id = X
  
km_realizados_semana = SUM(sesion_entrenamiento.kilometros_realizados)
  WHERE semana_id = X AND realizada = true
```

**Interpretación:**
- Muestra adherencia a la planificación
- Ayuda a detectar si el atleta está cumpliendo el volumen (factor de carga)
- Se actualiza cuando el atleta registra sesiones realizadas

### Días hasta Objetivo

```
dias_hasta_objetivo = fecha_objetivo - hoy
```

- Positivo: días restantes
- Negativo: competición ya pasó (rareza, pero existe)
- Uso: priorizar adaptación en últimas semanas

---

## 🔌 Endpoints API

### GET /dashboard

Recupera el resumen completo del dashboard.

**Parámetros:**
- `limit` (int, default: 50) — número máximo de atletas
- `offset` (int, default: 0) — paginación

**Respuesta:**
```json
{
  "success": true,
  "summary": { ... },
  "notifications": [ ... ],
  "atletas": [ ... ]
}
```

**Casos de uso:**
- Cargar dashboard al abrir la app
- Paginación si hay muchos atletas

### PATCH /notifications/:id/read

Marca una notificación como leída por el entrenador.

**Request:**
```bash
PATCH /notifications/42/read
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "id": 42,
    "leido": true,
    "updated_at": "2026-06-17T19:35:00Z"
  }
}
```

**Casos de uso:**
- Entrenador revisa un feedback → clic → marca como leído
- Reduce ruido de notificaciones redundantes

---

## 📋 Reglas de Negocio

1. **Selección de atletas**: Solo atletas con `objetivo.activo = true`
2. **Semana actual**: Rango `semana_entrenamiento.fecha_inicio ≤ hoy ≤ fecha_fin`
   - Si no existe semana actual, usa la próxima semana para evaluar `planificacion_pendiente`
3. **Feedback reciente**: Trigger automático al insertar `feedback_semanal` → crea notificación
4. **Estado único por atleta**: Primer match en orden de prioridad; no estados múltiples
5. **Orden secundario**: Alfabético por `atleta.nombre` cuando tienen igual prioridad
6. **Notificaciones manuales**: El entrenador decide cuándo marcar como `leido` (no automático)
7. **Km realizados**: Registro manual por sesión (`sesion_entrenamiento.realizada = true`)

---

## 🗂️ Cambios en la Base de Datos

### Tabla: sesion_entrenamiento
Nuevas columnas:
- `kilometros_realizados NUMERIC(6,2)` — km reales (entrada manual)
- `realizada BOOLEAN DEFAULT false` — marca si fue completada
- `fecha_realizada DATE` — cuándo se hizo
- `registrado_por VARCHAR(100)` — quién registró (atleta/entrenador)

### Tabla: notificacion_feedback (Nueva)
- PK: `id`
- FK: `atleta_id`, `objetivo_id`, `semana_id`
- `tipo VARCHAR(50)` — (ej: 'feedback_enviado')
- `fecha_envio TIMESTAMP` — cuándo se envió
- `resumen TEXT` — preview del feedback
- `leido BOOLEAN DEFAULT false` — marcado manualmente por entrenador

### Trigger: fn_notify_feedback_insert
- Se ejecuta AFTER INSERT en `feedback_semanal`
- Crea automáticamente una fila en `notificacion_feedback`
- Extrae `objetivo_id`, `atleta_id` del feedback enviado
- Compone resumen con sensaciones + molestias

---

## 🎬 Flujo de Usuario

1. **Entrenador abre la app**
   - GET /dashboard
   - Lee resumen: "3 feedback nuevos, 2 sin planificación"
   
2. **Revisa notificaciones**
   - Ve lista ordenada de eventos recientes
   - Lee feedback de Juan: "buenas sensaciones"
   - Clic → PATCH /notifications/42/read
   
3. **Consulta atletas**
   - Ordena por prioridad: 
     1. María (planificación pendiente)
     2. Pedro (objetivo en 8 días)
     3. Juan (todo correcto)
   
4. **Toma acción**
   - Clic en María → accede a pantalla de planificación
   - Crea 6 sesiones para la semana
   - (En futuros casos de uso: guardar y notificar a atleta)
   
5. **Cierra la sesión**
   - Dashboard actualizado: número de pendientes ↓

---

## 🚀 Performance

**Consultas en tiempo real** (v1 actual):
- Cálculo on-the-fly de prioridades, km agregados, etc.
- Adecuado para < 50 atletas por entrenador
- Tiempo respuesta típico: < 500ms

**Optimizaciones futuras** (si escala):
- Vista materializada `dashboard_atletas` actualizable cada 5 min (job)
- Índices en `objetivo.activo`, `semana_entrenamiento.fecha_inicio/fin`
- Caché en cliente/Redis para no recalcular cada carga

---

## 🔮 Extensiones Futuras

1. **Filtrado**: `GET /dashboard?priority=planificacion_pendiente`
2. **Acción rápida**: Crear semana de entrenamiento desde el dashboard
3. **Exportación**: Reportes semanales (CSV, PDF)
4. **Notificaciones push**: Email/SMS cuando hay feedback nuevo
5. **Análisis**: Tendencias de carga, adherencia por atleta

---

## 📝 Notas para Desarrolladores

- El trigger de notificaciones está en la BD; siempre se ejecuta
- Si modificas `feedback_semanal` sin INSERT (ej: UPDATE), considera si debe crear otra notificación
- Km realizados requieren interfaz de "registrar sesión realizada" (next: caso de uso)
- El dashboard NO modifica datos, solo lee; permite diseño de caché agresivo

---

## 🧪 Casos de Prueba

1. **Sin atletas activos** → resumen = 0, lista vacía
2. **Atleta sin semana actual** → usar próxima semana para cálculo
3. **Dos atletas, misma prioridad** → ordenar alfabético
4. **Feedback de hace 1 segundo** → aparece en notificaciones con `leido=false`
5. **Atleta con objetivo < hoy** → dias_hasta_objetivo negativo (edge case)

