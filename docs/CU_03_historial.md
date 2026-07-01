# Caso de Uso: Historial del Atleta

## Descripción General

La pantalla de **Historial** permite al entrenador consultar el pasado de un atleta para tomar decisiones de planificación futuras.

El foco del historial es responder:

**"¿Qué hizo realmente el atleta en ciclos anteriores y qué feedback dejó?"**

---

## Objetivo del Caso de Uso

Proporcionar una vista histórica para:

1. Revisar objetivos anteriores del atleta.
2. Revisar planificación semanal asociada a cada objetivo.
3. Ver kilómetros realmente realizados por semana.
4. Consultar feedback resumido y abrir detalle cuando haga falta.

---

## Actor Principal

**Entrenador** (usuario que analiza evolución y toma decisiones de planificación).

---

## Información que Debe Mostrar la Pantalla

### Historial de objetivos

Para un atleta concreto:

1. Nombre del objetivo.
2. Distancia (actualmente no disponible en el esquema; se devuelve `null`).
3. Fecha objetivo.
4. Estado (`activo`, `finalizado`, `inactivo`).

### Historial de planificación

Para cada objetivo:

1. Semanas asociadas.
2. Fecha inicio semana.
3. Fecha fin semana.
4. Kilómetros realmente realizados en la semana (`SUM(kilometros_realizados)`).

### Historial de feedback (resumido)

Listado con:

1. Fecha feedback.
2. Completada (`true/false`).
3. Resumen corto.
4. `feedback_id` para navegar al detalle.

### Detalle de feedback

Vista independiente con toda la información del feedback seleccionado.

---

## Reglas de Negocio

1. La consulta trabaja sobre `atletaId` recibido por ruta.
2. Si el atleta no existe, la API responde `404`.
3. El historial de objetivos incluye todos los objetivos del atleta (no solo activos).
4. El historial de planificación se obtiene por `objetivoId`.
5. Los kilómetros históricos mostrados son **realizados**, no planificados.
6. El cálculo semanal de kilómetros realizados suma `kilometros_realizados` de todas las sesiones de esa semana, usando `0` cuando no hay valor registrado.
7. El historial resumido de feedback incluye `feedback_id` para abrir detalle.
8. Si el feedback no existe, el detalle responde `404`.

---

## Endpoints Implementados

### GET /historial/atletas/:atletaId

Devuelve el historial completo de un atleta en una única respuesta.

Incluye:

1. Datos básicos del atleta.
2. Objetivos históricos.
3. Planificación histórica por objetivo.
4. Feedback resumido.

### GET /historial/atletas/:atletaId/objetivos

Devuelve únicamente el historial de objetivos del atleta.

### GET /historial/objetivos/:objetivoId/planificacion

Devuelve semanas de planificación del objetivo con kilómetros realizados por semana.

### GET /historial/atletas/:atletaId/feedback

Devuelve listado resumido de feedback del atleta.

### GET /historial/feedback/:feedbackId

Devuelve el detalle completo de un feedback concreto.

---

## Shape de Respuesta (resumen)

### Historial completo

```json
{
  "success": true,
  "data": {
    "atleta": {
      "id": 5,
      "nombre": "Juan Pérez"
    },
    "objetivos": [
      {
        "id": 12,
        "nombre": "Maratón Valencia",
        "distancia": null,
        "fecha_objetivo": "2026-12-01",
        "estado": "finalizado",
        "planificacion": [
          {
            "semana_id": 87,
            "fecha_inicio": "2026-07-12",
            "fecha_fin": "2026-07-19",
            "kilometros_realizados": 50
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
        "semana_fecha_fin": "2026-07-19",
        "objetivo_id": 12,
        "objetivo_nombre": "Maratón Valencia"
      }
    ]
  }
}
```

### Detalle de feedback

```json
{
  "success": true,
  "data": {
    "id": 31,
    "semana_id": 87,
    "completada": true,
    "motivo_no_completada": null,
    "sensaciones": "Buenas",
    "molestias": "Ninguna",
    "comentario": "Semana estable",
    "created_at": "2026-07-20T19:30:00.000Z",
    "updated_at": "2026-07-20T19:30:00.000Z",
    "semana_fecha_inicio": "2026-07-12",
    "semana_fecha_fin": "2026-07-19",
    "objetivo_id": 12,
    "objetivo_nombre": "Maratón Valencia",
    "fecha_objetivo": "2026-12-01",
    "atleta_id": 5,
    "atleta_nombre": "Juan Pérez"
  }
}
```

---

## Flujo de Usuario

1. Entrenador entra a la pantalla de historial de un atleta.
2. Frontend llama `GET /historial/atletas/:atletaId`.
3. Se muestra histórico de objetivos, semanas y feedback resumido.
4. Entrenador selecciona un feedback concreto.
5. Frontend llama `GET /historial/feedback/:feedbackId` para ver el detalle.

---

## Nota Funcional

En histórico se prioriza el dato real ejecutado por el atleta.

Por eso, en planificación histórica se trabaja con **kilómetros realizados** para facilitar decisiones futuras basadas en adherencia real y no solo en lo planificado.
