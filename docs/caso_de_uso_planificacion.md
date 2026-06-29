# Caso de Uso: Planificación del Atleta

## Descripción General

La pantalla de **Planificación** se abre al seleccionar un atleta desde el dashboard. Su objetivo es responder:

**"¿Qué necesito saber para planificar el entrenamiento de este atleta?"**

Principio de diseño: mostrar solo la información mínima necesaria para tomar decisiones de planificación, evitando cargar históricos al entrar.

---

## Objetivo del Caso de Uso

Proporcionar una vista operativa de un atleta concreto para:

1. Entender su contexto actual (objetivo y tiempo restante).
2. Revisar la semana actual o próxima de entrenamiento.
3. Evaluar carga planificada vs carga realizada.
4. Visualizar sesiones de la semana para decidir ajustes.
5. Crear una nueva semana de entrenamiento desde la propia planificación.

---

## Actor Principal

**Entrenador** (usuario con responsabilidad de planificación).

---

## Información que Debe Mostrar la Pantalla

1. Nombre del atleta.
2. Objetivo actual.
3. Fecha del objetivo.
4. Días restantes.
5. Kilómetros planificados de la semana.
6. Kilómetros realizados de la semana.
7. Entrenamientos de la semana (sesiones).

Acciones de interfaz previstas:

- Crear siguiente semana.
- Modificar planificación.

---

## Información Histórica (Carga Diferida)

La pantalla inicial **no** carga históricos. Los históricos se consultan en pantallas dedicadas:

- Historial de semanas.
- Historial de feedback.
- Historial de kilómetros.
- Historial de objetivos.

---

## Reglas de Negocio

1. La ruta recibe `atletaId` y trabaja sobre ese atleta.
2. Se toma solo el `objetivo` activo del atleta.
3. La semana seleccionada se resuelve con esta prioridad:
   - Semana actual (`hoy` entre `fecha_inicio` y `fecha_fin`).
   - Si no existe semana actual, la próxima semana futura.
4. `km_planificados_semana`: suma de `kilometros_planificados` de todas las sesiones de la semana.
5. `km_realizados_semana`: suma de `kilometros_realizados` solo para sesiones `realizada = true`.
6. Si el atleta no existe, la API responde `404`.
7. Si existe atleta pero no objetivo activo o no semana seleccionada, la respuesta mantiene `objetivo` o `semana` en `null` según corresponda.
8. Para crear semana, el entrenador solo informa `fecha_inicio`.
9. `fecha_fin` siempre se calcula automáticamente en backend: `fecha_inicio + 6 días`.
10. Si existe una semana previa del objetivo, la propuesta de inicio se calcula como `día siguiente` al fin de la última semana.
11. Si el cliente intenta forzar `fecha_fin`, el contrato del caso de uso sigue tomando `fecha_inicio` como único dato de entrada válido.

---

## Endpoint Implementado

### GET /planificacion/:atletaId

Devuelve el contexto de planificación del atleta en una única respuesta.

**Respuesta (shape):**

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
    "sesiones": [
      {
        "id": 301,
        "orden": "1",
        "descripcion": "Rodaje suave",
        "kilometros_planificados": 10,
        "kilometros_realizados": 10,
        "realizada": true,
        "fecha_realizada": "2026-06-17"
      }
    ]
  }
}
```

### GET /planificacion/:atletaId/semanas/propuesta

Devuelve la propuesta para crear una nueva semana en el objetivo activo del atleta.

**Respuesta (shape):**

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
      "fecha_objetivo": "2026-07-20"
    },
    "propuesta": {
      "fecha_inicio_sugerida": "2026-06-23",
      "fecha_fin_calculada": "2026-06-29",
      "fuente_sugerencia": "dia_siguiente_ultima_semana"
    }
  }
}
```

### POST /planificacion/:atletaId/semanas

Crea una semana asociada al objetivo activo del atleta usando solo `fecha_inicio`.

**Body de entrada:**

```json
{
  "fecha_inicio": "2026-06-23"
}
```

**Respuesta (shape):**

```json
{
  "success": true,
  "message": "Semana creada exitosamente",
  "data": {
    "atleta": {
      "id": 5,
      "nombre": "Juan Pérez"
    },
    "objetivo": {
      "id": 12,
      "nombre": "Media maratón 1:45",
      "fecha_objetivo": "2026-07-20"
    },
    "semana": {
      "id": 99,
      "objetivo_id": 12,
      "fecha_inicio": "2026-06-23",
      "fecha_fin": "2026-06-29"
    }
  }
}
```

---

## Decisión Técnica Relevante

La consulta SQL devuelve filas por sesión y el backend agrupa la respuesta final en un único objeto de negocio.

Ventajas:

1. SQL más legible y mantenible.
2. API orientada al caso de uso, no a tablas.
3. Respuesta única y coherente para la pantalla.

---

## Flujo de Usuario

1. Entrenador abre dashboard.
2. Selecciona atleta.
3. Frontend llama `GET /planificacion/:atletaId`.
4. Se renderiza contexto actual de planificación.
5. Si pulsa "Crear semana", frontend solicita propuesta con `GET /planificacion/:atletaId/semanas/propuesta`.
6. Entrenador ajusta (opcional) la fecha de inicio en el selector.
7. Frontend muestra resumen con fin de semana recalculado visualmente.
8. Al confirmar, frontend llama `POST /planificacion/:atletaId/semanas` enviando solo `fecha_inicio`.
9. Backend crea semana con `fecha_fin` calculada y frontend recarga planificación.

---

## Próximas Extensiones

1. Endpoint para modificar sesiones en bloque.
2. Endpoints de históricos bajo rutas de negocio separadas.
