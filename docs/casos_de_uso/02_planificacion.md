# 02 - Planificación del atleta

## Para qué sirve

Se abre al elegir un atleta (por ejemplo desde el Dashboard). Responde: **"¿Qué necesito saber para planificar el entrenamiento de este atleta?"**

Muestra solo lo necesario para decidir. Los datos del pasado están en la pantalla de [Historial](03_historial.md).

## Cómo se organiza el entrenamiento

```
Objetivo (activo)
  └── Semana (7 días)
        ├── Sesiones (hasta 7)
        └── Feedback semanal (uno por semana, lo envía el atleta)
```

- Una **semana** dura 7 días y siempre pertenece al objetivo activo del atleta.
- Una **sesión** es un entrenamiento concreto dentro de una semana.
- El **feedback** es la valoración que el atleta hace de la semana.

## Qué se ve

1. Nombre del atleta.
2. Objetivo, fecha y días que faltan.
3. Lista de semanas del objetivo. La semana actual aparece destacada y las anteriores se marcan como "Anterior".
4. Datos de la semana elegida: inicio, fin, km planificados y realizados, y número de sesiones.
5. Sesiones de esa semana.
6. Feedback de la semana.

Al entrar se muestra la semana **actual**, o la **próxima** si no hay semana actual. Si se elige otra semana de la lista, se muestran solo los datos de esa.

## Qué puede hacer cada rol

| Acción | Entrenador / Administrador | Atleta |
|---|---|---|
| Ver la planificación | Sí | Solo la suya |
| Crear semana | Sí | No |
| Crear sesión | Sí | No |
| Registrar km realizados | Sí, en cualquier semana | Sí, solo en la semana actual |
| Enviar feedback | No | Sí, solo el suyo |
| Registrar la marca del objetivo | Sí | No |

## Reglas

### Semanas
1. Al crear una semana solo se envía `fecha_inicio`. La fecha de fin se calcula como inicio + 6 días.
2. La fecha de inicio que se propone es el día siguiente al fin de la última semana. Si no hay ninguna, la de hoy.
3. Se puede crear una semana con fecha pasada (por ejemplo, para completar un historial).
4. Dos semanas del mismo objetivo no pueden solaparse.
5. Como máximo puede haber 2 semanas sin terminar a la vez (la actual y la próxima). Las semanas ya pasadas no cuentan.
6. Para crear una semana el atleta debe tener un objetivo activo.

### Sesiones
1. Al crear una sesión se indican `descripcion`, `observaciones` (opcional) y `kilometros_planificados`.
2. El `orden` es automático: el siguiente número de la semana.
3. La `fecha_sesion` se calcula sola, dentro de los días de la semana.
4. Una semana no puede tener más de 7 sesiones.
5. Se pueden crear sesiones en semanas pasadas, no solo en la actual o la próxima.

### Km realizados
1. Cada sesión guarda un único valor de km realizados. Si se vuelve a registrar, se sustituye el anterior y nunca se suman.
2. Hay dos formas de registrarlo: marcar "realizado según planificación" (se copian los km planificados) o escribir los km a mano.
3. Los km de la semana se calculan sumando los de sus sesiones.

### Feedback
1. Lo envía el atleta, y solo de una semana que ya haya empezado (actual o pasada). Las semanas futuras no.
2. Solo puede haber un feedback por semana.
3. Si el atleta indica que no completó la semana, debe escribir el motivo.

### Marca del objetivo
1. Solo se puede registrar cuando faltan 0 días o menos (el día del objetivo o después).
2. Al guardarla, el objetivo pasa a inactivo, pero se conserva en la base de datos.
3. Si el objetivo ya estaba cerrado, devuelve error 409 y no cambia la marca.
4. Un entrenador solo puede registrarla para sus atletas.

Más detalle en [06 - Objetivos](06_objetivos.md).

### Otras
- Si el atleta no existe, responde 404.
- Si no hay objetivo activo o no hay semana, esos datos llegan como `null`.

## Endpoints

### GET /planificacion/:atletaId

```json
{
  "success": true,
  "data": {
    "atleta": { "id": 5, "nombre": "Juan Pérez" },
    "objetivo": {
      "id": 12,
      "nombre": "Media maratón 1:45",
      "distancia_objetivo": "Media Maratón",
      "marca_conseguida": null,
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

### GET /planificacion/:atletaId/semanas

Devuelve todas las semanas del objetivo activo. Cada una indica si es la actual (`es_actual`), la próxima (`es_proxima`), si aún no ha empezado (`es_futura`) y si ya tiene feedback (`tiene_feedback`).

### GET /planificacion/:atletaId/semanas/propuesta

```json
{
  "success": true,
  "data": {
    "propuesta": {
      "fecha_inicio_sugerida": "2026-06-23",
      "fecha_fin_calculada": "2026-06-29",
      "fuente_sugerencia": "dia_siguiente_ultima_semana"
    }
  }
}
```

### POST /planificacion/:atletaId/semanas

Body:

```json
{ "fecha_inicio": "2026-06-23" }
```

Si se envía `fecha_fin`, devuelve error 400.

### POST /planificacion/:atletaId/semanas/:semanaId/sesiones

Body:

```json
{
  "descripcion": "Series 8x1000",
  "observaciones": "Recuperar 2 minutos entre series",
  "kilometros_planificados": 12
}
```

### PATCH /planificacion/:atletaId/semanas/:semanaId/sesiones/:sesionId/resultado

Según planificación:

```json
{ "realizado_segun_planificacion": true }
```

A mano:

```json
{ "kilometros_realizados": 8.5 }
```

### POST /planificacion/:atletaId/semanas/:semanaId/feedback

```json
{
  "completada": false,
  "motivo_no_completada": "Molestia en el gemelo",
  "sensaciones": "Cansado",
  "molestias": "Gemelo derecho",
  "ritmo_rodaje": "5:40 min/km"
}
```

### PATCH /planificacion/:atletaId/objetivos/:objetivoId/marca

```json
{ "marca_conseguida": "1:18:42" }
```
