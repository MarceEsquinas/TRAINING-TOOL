# 01 - Dashboard

## Para qué sirve

Es la pantalla que se ve al entrar. Ayuda al entrenador a responder: **"¿Qué atleta necesita hoy mi atención?"**

Muestra solo atletas que tienen un objetivo activo.

## Qué se ve

### 1. Resumen (cuatro números)

| Dato | Qué cuenta |
|---|---|
| `num_atletas_activos` | Atletas con un objetivo activo |
| `num_feedback_nuevos` | Feedback que el entrenador aún no ha leído |
| `num_planificaciones_pendientes` | Atletas cuya semana termina en 2 días o menos y no tiene sesiones |
| `num_objetivos_proximos` | Atletas cuyo objetivo es en 9 días o menos |

### 2. Notificaciones

Son los feedback sin leer, del más reciente al más antiguo. Un feedback pasa a leído cuando el entrenador abre su detalle en el Historial.

### 3. Lista de atletas

Cada tarjeta muestra el nombre, el objetivo, la fecha, los días que faltan y los km de la semana (realizados / planificados). Los botones "Ver planificación" y "Ver historial" llevan a esas pantallas.

## Cómo se ordenan los atletas

Cada atleta tiene un solo estado, el primero que se cumpla de esta lista. A igualdad, se ordenan por nombre.

| Prioridad | Estado | Cuándo | Mensaje |
|---|---|---|---|
| 1 | `planificacion_pendiente` | A la semana le quedan 2 días o menos y no tiene sesiones | "faltan X dias y 0 sesiones planificadas" |
| 2 | `objetivo_proximo` | Faltan 9 días o menos para el objetivo | "objetivo en X dias" (si ya llegó: "Objetivo alcanzado: registrar marca conseguida") |
| 3 | `ok` | Ninguna de las anteriores | "todo correcto" |

La **semana** que se evalúa es la actual (hoy está entre su inicio y su fin). Si no hay, la próxima.

## Cómo se calculan los kilómetros

- Planificados = suma de los km planificados de todas las sesiones de la semana.
- Realizados = suma de los km realizados de las sesiones marcadas como realizadas.

Los días hasta el objetivo se calculan con la fecha de España (`Europe/Madrid`) para que no haya errores por la zona horaria.

## Quién ve qué

- **Entrenador:** solo sus atletas (los que tienen su `entrenador_id`), con sus contadores y notificaciones.
- **Administrador:** todos los atletas.
- **Atleta:** ve las tarjetas, pero no las notificaciones, y el contador de feedback nuevos sale a 0.

## Endpoint

`GET /dashboard`, con `?limit=` (por defecto 50) y `?offset=` (por defecto 0).

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
      "atleta_id": 5,
      "atleta_nombre": "Juan Pérez",
      "objetivo_id": 12,
      "objetivo_nombre": "Media maratón 1:45",
      "semana_id": 87,
      "semana_fecha_inicio": "2026-06-16",
      "semana_fecha_fin": "2026-06-22",
      "fecha_envio": "2026-06-17T19:30:00Z",
      "leido": false
    }
  ],
  "atletas": [
    {
      "atleta_id": 5,
      "atleta_nombre": "Juan Pérez",
      "objetivo_nombre": "Media maratón 1:45",
      "fecha_objetivo": "2026-07-20",
      "dias_hasta_objetivo": 24,
      "semana_id": 87,
      "km_planificados_semana": 65.5,
      "km_realizados_semana": 42.3,
      "estado_prioritario": "planificacion_pendiente",
      "razon_estado": "faltan 2 dias y 0 sesiones planificadas"
    }
  ]
}
```
