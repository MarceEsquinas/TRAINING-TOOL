# 03 - Historial del atleta

## Para qué sirve

Permite consultar el pasado de un atleta para decidir su planificación futura. Responde: **"¿Qué hizo realmente el atleta en ciclos anteriores y qué feedback dejó?"**

## Qué se ve

### Objetivos
Todos los objetivos del atleta, no solo el activo:
- Nombre, distancia, fecha y marca conseguida (si la hay).
- Estado:
  - `activo`: es el objetivo actual.
  - `finalizado`: ya no está activo y su fecha ya pasó.
  - `inactivo`: ya no está activo, pero su fecha aún no ha llegado.

### Planificación de cada objetivo
Sus semanas, con fecha de inicio, fecha de fin, número de sesiones y kilómetros **realizados** y planificados. Los km realizados son la suma de los de todas las sesiones de la semana. Si una sesión no tiene valor, cuenta como 0.

### Feedback
Una lista resumida con la fecha, si completó la semana y un resumen corto. Desde ahí se abre el **detalle completo** de un feedback.

Al abrir el detalle, ese feedback pasa a estar leído. Eso reduce el contador de feedback nuevos del [Dashboard](01_dashboard.md).

## Quién puede verlo

- Entrenador y administrador: el historial de cualquier atleta.
- Atleta: solo el suyo.

## Reglas

1. Si el atleta no existe, responde 404.
2. Si el feedback no existe, el detalle responde 404.
3. Un atleta que pide el historial de otro atleta recibe un error de permiso (403) o 404.
4. Nunca se borran objetivos, semanas, sesiones ni feedback anteriores.

## Endpoints

| Ruta | Devuelve |
|---|---|
| `GET /historial/atletas/:atletaId` | Todo junto: atleta, objetivos con su planificación y feedback resumido |
| `GET /historial/atletas/:atletaId/objetivos` | Solo los objetivos |
| `GET /historial/objetivos/:objetivoId/planificacion` | Semanas de un objetivo con sus km |
| `GET /historial/atletas/:atletaId/feedback` | Lista resumida de feedback |
| `GET /historial/feedback/:feedbackId` | Detalle de un feedback |

### Ejemplo: historial completo

```json
{
  "success": true,
  "data": {
    "atleta": { "id": 5, "nombre": "Juan Pérez" },
    "objetivos": [
      {
        "id": 12,
        "nombre": "Maratón Valencia",
        "distancia_objetivo": "Maratón",
        "marca_conseguida": "3:25:10",
        "fecha_objetivo": "2026-12-01",
        "estado": "finalizado",
        "planificacion": [
          {
            "semana_id": 87,
            "fecha_inicio": "2026-07-12",
            "fecha_fin": "2026-07-18",
            "total_sesiones": 4,
            "kilometros_realizados": 50,
            "kilometros_planificados": 55
          }
        ]
      }
    ],
    "feedback_resumen": [
      {
        "feedback_id": 31,
        "fecha_feedback": "2026-07-20",
        "completada": true,
        "resumen_corto": "Buenas sensaciones generales",
        "semana_id": 87,
        "semana_fecha_inicio": "2026-07-12",
        "semana_fecha_fin": "2026-07-18",
        "objetivo_id": 12,
        "objetivo_nombre": "Maratón Valencia"
      }
    ]
  }
}
```
