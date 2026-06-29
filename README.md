# Training Tool

## Descripción
Training Tool es una aplicación web orientada a la gestión de entrenamientos de atletas amateurs muy enfocada a la adaptación de la persona.

El objetivo principal es permitir que un entrenador pueda planificar semanalmente entrenamientos personalizados, realizar un seguimiento de la evolución de sus atletas y adaptar la planificación en función del feedback recibido.

Este proyecto nace de una necesidad real: gestionar entrenamientos sin depender de WhatsApp y disponer de toda la información centralizada en una única aplicación.

---

## Objetivos del proyecto

- Gestionar atletas.
- Definir objetivos deportivos.
- Crear semanas de entrenamiento.
- Crear sesiones de entrenamiento.
- Recibir feedback semanal de los atletas.
- Consultar el histórico de entrenamientos.
- Detectar incidencias como molestias o semanas no completadas.

Además de ser una herramienta útil para el entrenamiento, este proyecto tiene un objetivo formativo para seguir aprendiendo:

- Desarrollo web.
- Arquitectura de aplicaciones.
- Bases de datos relacionales.
- Control de versiones con Git y GitHub.
- Buenas prácticas de programación.

---

## Tecnologías

### Backend

- Node.js
- Express 

### Frontend

- JavaScript
- React (pendiente de implementación)

### Base de datos

- PostgreSQL

### Control de versiones

- Git
- GitHub

---

## Roles de usuario

### Administrador / Entrenador
Puede:

- Gestionar atletas.
- Gestionar objetivos.
- Gestionar semanas de entrenamiento.
- Gestionar sesiones de entrenamiento.
- Consultar el feedback de los atletas.

### Atleta
Puede:

- Iniciar sesión.
- Consultar su objetivo actual.
- Consultar sus semanas de entrenamiento.
- Consultar sus sesiones de entrenamiento.
- Enviar feedback semanal.
- Consultar su histórico.

---

## Entidades principales

- Usuario
- Entrenador
- Atleta
- Objetivo
- SemanaEntrenamiento
- SesionEntrenamiento
- FeedbackSemanal

Relación clave del modelo: un entrenador puede planificar múltiples atletas, y cada atleta se asigna mediante `entrenador_id`.

## Casos de Uso

### 1. Dashboard del Entrenador ✅ Completado
Ver [docs/caso_de_uso_dashboard.md](docs/caso_de_uso_dashboard.md) para descripción completa.

**Propósito**: Pantalla principal que muestra el estado de todos los atletas, notificaciones y atletas que requieren atención en menos de 10 segundos.

**Flujo resumido**:
1. Entrenador abre app → GET /dashboard
2. Ve resumen de KPIs (atletas, feedback nuevos, planificaciones pendientes, objetivos próximos)
3. Revisa notificaciones de feedback enviado
4. Consulta lista de atletas priorizada por urgencia
5. Marca notificaciones como leídas → PATCH /notifications/:id/read

### 2. Planificación del Atleta ✅ Completado (Backend)
Ver [docs/caso_de_uso_planificacion.md](docs/caso_de_uso_planificacion.md) para descripción completa.

**Propósito**: Vista de un atleta concreto para decidir su planificación semanal con contexto mínimo y accionable.

**Flujo resumido**:
1. Entrenador selecciona atleta desde dashboard
2. Frontend llama GET /planificacion/:atletaId
3. API devuelve atleta, objetivo activo, semana actual o próxima y sesiones
4. Entrenador revisa km planificados vs realizados
5. Entrenador decide modificar planificación o crear siguiente semana

### 3. Historial del Atleta ✅ Completado (Backend)
Ver [docs/caso_de_uso_historial.md](docs/caso_de_uso_historial.md) para descripción completa.

**Propósito**: Consultar el histórico de un atleta para tomar decisiones de planificación futuras usando datos reales de rendimiento y feedback.

**Flujo resumido**:
1. Entrenador abre historial de un atleta
2. Frontend llama GET /historial/atletas/:atletaId
3. API devuelve objetivos históricos, planificación por objetivo y feedback resumido
4. Entrenador puede abrir detalle de feedback con GET /historial/feedback/:feedbackId
5. Entrenador contrasta semanas realizadas para ajustar planificación

---

## Documentación adicional

- `docs/caso_de_uso_dashboard.md`: Caso de uso completo del Dashboard (reglas, flujos, datos)
- `docs/caso_de_uso_planificacion.md`: Caso de uso completo de Planificación del Atleta
- `docs/caso_de_uso_historial.md`: Caso de uso completo de Historial del Atleta

---

## API REST Implementada

### Endpoints de Negocio

#### GET /dashboard
Obtiene el estado completo del dashboard con resumen, notificaciones y atletas priorizado.

**Parámetros query**:
- `limit` (int, default: 50) — Máximo de atletas a devolver
- `offset` (int, default: 0) — Paginación

**Ejemplo de respuesta**:
```json
{
  "success": true,
  "summary": {
    "num_atletas_activos": 12,
    "num_feedback_nuevos": 3,
    "num_planificaciones_pendientes": 2,
    "num_objetivos_proximos": 1
  },
  "notifications": [
    {
      "id": 42,
      "tipo": "feedback_enviado",
      "atleta_id": 5,
      "atleta_nombre": "Juan Pérez",
      "objetivo_nombre": "Media maratón 1:45",
      "semana_id": 87,
      "fecha_envio": "2026-06-17T19:30:00Z",
      "resumen": "Sensaciones buenas | Molestias: ninguna",
      "leido": false
    }
  ],
  "atletas": [
    {
      "atleta_id": 5,
      "nombre": "Juan Pérez",
      "objetivo_nombre": "Media maratón 1:45",
      "dias_hasta_objetivo": 24,
      "semana_id": 87,
      "semana_fecha_inicio": "2026-06-16",
      "semana_fecha_fin": "2026-06-22",
      "km_planificados_semana": 65.5,
      "km_realizados_semana": 42.3,
      "estado_prioritario": "planificacion_pendiente",
      "razon_estado": "faltan 2 dias y 0 sesiones planificadas"
    }
  ]
}
```

#### PATCH /notifications/:id/read
Marca una notificación como leída por el entrenador.

**Ejemplo**:
```bash
PATCH /notifications/42/read
```

**Respuesta**:
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

#### GET /planificacion/:atletaId
Obtiene la información necesaria para planificar el entrenamiento de un atleta concreto.

**Respuesta**:
```json
{
  "success": true,
  "data": {
    "atleta": {
      "id": 5,
      "nombre": "Juan Pérez"
    },
    "objetivo": {
      "id": 12,
      "nombre": "Media maratón 1:45",
      "fecha_objetivo": "2026-07-20",
      "dias_hasta_objetivo": 31
    },
    "semana": {
      "id": 87,
      "fecha_inicio": "2026-06-16",
      "fecha_fin": "2026-06-22",
      "total_sesiones": 4,
      "km_planificados_semana": 65.5,
      "km_realizados_semana": 24.0
    },
    "sesiones": []
  }
}
```

#### GET /planificacion/:atletaId/semanas/propuesta
Obtiene una propuesta de nueva semana para el objetivo activo del atleta, con `fecha_inicio_sugerida` y `fecha_fin_calculada`.

#### POST /planificacion/:atletaId/semanas
Crea una nueva semana asociada a la planificación activa del atleta.

**Body**:
```json
{
  "fecha_inicio": "2026-06-23"
}
```

**Regla**: `fecha_fin` no se envía desde frontend; se calcula en backend como `fecha_inicio + 6 días`.

#### GET /historial/atletas/:atletaId
Obtiene el historial completo de un atleta: objetivos, planificación histórica y feedback resumido.

#### GET /historial/atletas/:atletaId/objetivos
Obtiene el historial de objetivos de un atleta.

#### GET /historial/objetivos/:objetivoId/planificacion
Obtiene el historial de planificación semanal de un objetivo con kilómetros realmente realizados.

#### GET /historial/atletas/:atletaId/feedback
Obtiene el historial resumido de feedback de un atleta.

#### GET /historial/feedback/:feedbackId
Obtiene el detalle completo de un feedback concreto.

### Endpoints CRUD

CRUD implementado para:
- `/atletas`
- `/objetivos`
- `/usuarios`
- `/semanasEntrenamiento`
- `/sesionesEntrenamiento`
- `/feedback`

---

## 🚀 Instalación y Arranque

### Requisitos previos
- Node.js (v16+)
- PostgreSQL (v12+)
- npm

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/training-tool.git
cd training-tool
```

### 2. Configurar la base de datos

```bash
# Crear base de datos
psql -U postgres
CREATE DATABASE training_tool;
\c training_tool
\i bbdd/schema_v1.sql
```

### 3. Configurar variables de entorno

Copia el archivo `.env.example` a `.env` y configura tus valores:

```bash
cd backend
cp .env.example .env
```

Edita `.env` con tus credenciales de BD y configuración local:

```env
DB_USER=tu_usuario_postgres
DB_PASSWORD=tu_contraseña
DB_HOST=localhost
DB_PORT=
DB_NAME=training_tool
PORT=
NODE_ENV=development
```

**Nota:** `.env` está en `.gitignore` — nunca commitees credenciales reales.

### 4. Instalar dependencias

```bash
cd backend
npm install
```

### 5. Arrancar servidor

```bash
npm start
```

O en modo desarrollo con hot-reload:

```bash
npm run dev
```

Servidor escuchando en `http://localhost:3000`

### 6. Probar endpoints

```bash
# Test de dashboard
curl http://localhost:3000/dashboard

# Test de planificación
curl http://localhost:3000/planificacion/1
```

---

## Estado Actual

### ✅ Completado

- ✓ Análisis del negocio y requisitos funcionales
- ✓ Diseño conceptual y modelo relacional (PostgreSQL)
- ✓ Esquema DB con constraints, triggers, vistas
- ✓ Backend básico con Express
- ✓ API REST CRUD para todas las entidades
- ✓ **Caso de uso: Dashboard del Entrenador**
  - ✓ Cálculo de prioridades por atleta
  - ✓ Notificaciones de feedback automáticas
  - ✓ Endpoints GET /dashboard y PATCH /notifications/:id/read
  - ✓ Documentación completa
- ✓ **Caso de uso: Planificación del Atleta (Backend)**
  - ✓ Endpoint GET /planificacion/:atletaId
  - ✓ Respuesta agrupada por caso de uso (atleta, objetivo, semana, sesiones)
  - ✓ Documentación completa
- ✓ **Caso de uso: Historial del Atleta (Backend)**
  - ✓ Endpoints de historial completo, objetivos, planificación, feedback resumido y detalle
  - ✓ Planificación histórica basada en kilómetros realizados
  - ✓ Documentación completa

### ⏳ Pendiente

- Frontend (React) — Interfaces para dashboard, planificación, feedback
- Autenticación JWT / sesiones
- Autorización y roles (Entrenador vs Atleta)
- Caso de uso: Planificación de semana de entrenamiento (acciones de crear/modificar)
- Caso de uso: Registro de sesiones realizadas
- Caso de uso: Análisis de adherencia y carga
- Validaciones de entrada (backend)
- Tests unitarios e integración
- Despliegue (Docker, servidor)

---

---

## 🏗️ Arquitectura

Estructura actual del backend:

- `src/routes/crud`: rutas CRUD de entidades
- `src/routes/negocio`: rutas de casos de uso (dashboard, planificación, notificaciones)
- `src/controllers/crud`: capa HTTP de endpoints CRUD (sin SQL)
- `src/controllers/negocio`: capa HTTP de endpoints de negocio (sin SQL)
- `src/services/crud`: validaciones + lógica CRUD + consultas SQL
- `src/services/negocio`: lógica de casos de uso + consultas SQL + shape de respuesta
- `src/services/serviceError.js`: errores de servicio con código HTTP para respuestas consistentes

### Responsabilidades por Capa

- **Routes**: definen URL/método y delegan en controllers.
- **Controllers**: gestionan `req/res` (status code, body, manejo de errores).
- **Services**: concentran validaciones, reglas de negocio, orquestación y SQL.

Flujo estándar del backend:

`Route -> Controller (HTTP) -> Service (lógica + SQL) -> PostgreSQL`

### Flujo de Diseño: Casos de Uso Primero

Cada funcionalidad se desarrolla siguiendo este flujo:

1. **Diseño de Caso de Uso**: Análisis de reglas de negocio, flujos y decisiones
2. **Definición de Datos**: Cambios en BD (nuevas columnas, tablas, triggers)
3. **Shape de API**: Estructura JSON de respuesta
4. **Consultas SQL**: Lógica optimizada en BD
5. **Service + Controller + Route**: Implementación por capas en Express
6. **Documentación**: Archivo en `docs/` detallando el caso de uso

**Beneficio**: separación clara entre transporte HTTP y lógica de negocio/datos, facilitando mantenimiento, pruebas y evolución.

---

## 🧭 Filosofía del Proyecto

La aplicación se está desarrollando siguiendo estas premisas:

> **Resolver un problema real con una solución simple, escalable y mantenible.**

- Se prioriza construir una primera versión funcional antes de características avanzadas
- **Casos de uso orientan el desarrollo**, no especificaciones técnicas genéricas
- Decisiones de diseño están documentadas y justificadas
- Performance se optimiza cuando hay evidencia de problema, no especulación

---

## Autor
Proyecto personal desarrollado como herramienta de gestión deportiva y aprendizaje de desarrollo de software.
