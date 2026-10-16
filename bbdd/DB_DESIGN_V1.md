# Base de datos de Training Tool

Este documento explica las tablas y por qué están hechas así. El SQL completo está en [schema_v1.sql](schema_v1.sql), que es la referencia oficial.

La base de datos es **PostgreSQL** y está pensada para un grupo pequeño (de 4 a 50 atletas).

## Cómo se relacionan las tablas

```
usuario  (ADMIN, ENTRENADOR o ATLETA)
  ├── 1:1 ── entrenadores
  │             └── 1:N ── atleta        (atleta.entrenador_id, opcional)
  └── 1:1 ── atleta
                └── 1:N ── objetivo
                              └── 1:N ── semana_entrenamiento
                                            ├── 1:N ── sesion_entrenamiento
                                            └── 1:1 ── feedback_semanal
```

- Todos los que entran en la aplicación son un **usuario**. Su rol dice qué es.
- Un usuario con rol `ENTRENADOR` tiene un perfil en `entrenadores`. Un usuario con rol `ATLETA` tiene un perfil en `atleta`.
- Un atleta puede no tener entrenador al principio (`entrenador_id` vacío).

## Tablas

### `usuario`
Datos de acceso.

| Columna | Detalle |
|---|---|
| `username` | Único |
| `email` | Único |
| `password_hash` | La contraseña nunca se guarda en claro. La aplicación la convierte con SHA-256 |
| `rol` | `ADMIN`, `ENTRENADOR` o `ATLETA` |

### `entrenadores`
Perfil del entrenador: `usuario_id` (único, obligatorio) y `nombre`.

### `atleta`
Perfil del atleta.

| Columna | Detalle |
|---|---|
| `usuario_id` | Único y obligatorio |
| `entrenador_id` | Opcional. Si el entrenador se borra, queda vacío y el atleta se conserva |
| `nombre` | Obligatorio |
| `sexo` | `M`, `F` u `OTRO` |
| `peso` | Mayor que 0 |
| `dias_disponibles` | Lista de días, por ejemplo `["lunes", "jueves"]` |
| `km_medios_ultimos_2_meses` | Km medios por semana |
| `lesiones_ultimo_anio` | Lista, por ejemplo `[{"tipo": "tobillo", "fecha": "2025-06", "notas": "..."}]` |

### `objetivo`
Meta deportiva del atleta.

| Columna | Detalle |
|---|---|
| `atleta_id` | Obligatorio |
| `nombre` | Obligatorio |
| `distancia_objetivo` | `5K`, `10K`, `Media Maratón`, `Maratón`, `Trail`, `Ultra Trail` o el texto escrito en "Otro" |
| `marca_conseguida` | Vacía mientras el objetivo está activo |
| `fecha_objetivo` | Obligatoria |
| `activo` | `true` si es el objetivo actual |

### `semana_entrenamiento`
`objetivo_id`, `fecha_inicio` y `fecha_fin` (la fecha de fin no puede ser anterior a la de inicio). Puede no tener sesiones.

### `sesion_entrenamiento`

| Columna | Detalle |
|---|---|
| `semana_id` | Obligatorio |
| `orden` | Número de la sesión dentro de la semana (único por semana) |
| `fecha_sesion` | Se calcula dentro de los días de la semana |
| `descripcion` | Texto libre: "60 min Z2", "12 km suaves"... |
| `observaciones` | Indicaciones del entrenador (opcional) |
| `kilometros_planificados` | Km previstos |
| `kilometros_realizados` | Km reales |
| `realizada` | `true` cuando se han registrado los km realizados |
| `fecha_realizada`, `registrado_por` | Existen en la tabla, pero el backend actual no los rellena |

### `feedback_semanal`
Valoración de la semana por parte del atleta.

| Columna | Detalle |
|---|---|
| `semana_id` | Único: un solo feedback por semana |
| `completada` | `true` si hizo la semana según el plan |
| `motivo_no_completada` | Obligatorio si `completada` es `false` |
| `sensaciones`, `molestias`, `ritmo_rodaje` | Texto libre |
| `leido` | `false` al crearse; pasa a `true` cuando el entrenador abre el detalle |

## Reglas que garantiza la base de datos

Estas reglas se cumplen aunque falle la aplicación:

| Regla | Cómo |
|---|---|
| Un atleta solo puede tener **un objetivo activo** | Índice único parcial (`atleta_id` donde `activo = true`). Puede haber muchos inactivos |
| Las semanas del mismo objetivo **no se solapan** | Restricción `EXCLUDE` sobre el rango de fechas (necesita la extensión `btree_gist`) |
| `fecha_fin` no es anterior a `fecha_inicio` | `CHECK` |
| El peso es mayor que 0 | `CHECK` |
| No hay dos sesiones con el mismo `orden` en una semana | `UNIQUE (semana_id, orden)` |
| Un feedback no completado tiene motivo | `CHECK` |
| Un feedback por semana | `UNIQUE` en `semana_id` |
| No se repiten `username`, `email` ni los vínculos usuario-perfil | `UNIQUE` |

## Qué pasa al borrar

| Si se borra... | Se borran también... |
|---|---|
| Un usuario | Su perfil de entrenador o de atleta |
| Un atleta | Sus objetivos, y con ellos sus semanas, sesiones y feedback |
| Un objetivo | Sus semanas, sesiones y feedback |
| Una semana | Sus sesiones y su feedback |
| Un entrenador | Nada; sus atletas quedan sin entrenador |

Por eso la aplicación **no ofrece borrar objetivos**: para no perder el historial.

## Otros detalles

- **Fechas de control:** todas las tablas tienen `created_at` y `updated_at`. `updated_at` se actualiza solo con un *trigger*.
- **JSONB:** `dias_disponibles` y `lesiones_ultimo_anio` se guardan como JSON para poder cambiar su contenido sin tocar la tabla.
- **Vista `v_objetivo_activo`:** muestra el objetivo activo de cada atleta.
- **Números:** los km y el peso usan `NUMERIC` (no `FLOAT`) para no perder precisión.
- **Distancias:** se guardan como texto normalizado para que no haya `10K`, `10 km` y `10000` mezclados. Si se elige "Otro", se guarda el texto escrito en la misma columna.

## Migraciones

En `migrations/` están los cambios que se hicieron al esquema con el tiempo. Sirven para actualizar una base de datos antigua. Una base nueva creada con `schema_v1.sql` ya los incluye.

| Archivo | Qué hace |
|---|---|
| `001_replace_notificacion_feedback.sql` | Añade `leido` a `feedback_semanal`; sustituye a la tabla de notificaciones |
| `002_add_usuario_id_to_entrenadores.sql` | Añade `usuario_id` a `entrenadores` |
| `003_add_distancia_objetivo_to_objetivo.sql` | Añade `distancia_objetivo` |
| `004_add_marca_conseguida_to_objetivo.sql` | Añade `marca_conseguida` |
| `005_refactor_usuario_entrenador_atleta.sql` | Pasa el correo y el acceso a `usuario` y enlaza cada perfil con su usuario |

## Ideas para el futuro

- Plantillas de semanas reutilizables.
- Tabla con métricas semanales para informes rápidos.
- Historial de cambios (logs).
- Tabla de recordatorios y alertas.
