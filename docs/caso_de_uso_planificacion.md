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
5. Entrenador decide crear siguiente semana o modificar sesiones.

---

## Próximas Extensiones

1. Endpoint para crear siguiente semana desde planificación.
2. Endpoint para modificar sesiones en bloque.
3. Endpoints de históricos bajo rutas de negocio separadas.
