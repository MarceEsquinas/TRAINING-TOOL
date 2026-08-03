# SesionEntrenamiento

## Propósito

`SesionEntrenamiento` representa una sesión individual dentro de una `SemanaEntrenamiento`.
Desde CU-04, la sesión se crea desde la pantalla de Planificación y el foco está en reducir al mínimo la carga manual del entrenador.

## Atributos actuales

- `id`
- `semana_id`
- `orden`
- `fecha_sesion` (interna, calculada automáticamente)
- `descripcion`
- `observaciones`
- `kilometros_planificados`

## Estado actual de la implementación

- El backend expone CU-04 en `POST /planificacion/:atletaId/semanas/:semanaId/sesiones`.
- El backend expone consulta focalizada por recurso en `GET /semanasEntrenamiento/:semanaId/sesiones`.
- Se mantiene también el CRUD general de sesiones para operaciones técnicas y mantenimiento.
- El controlador de negocio está en `backend/src/controllers/negocio/planificacionController.js`.
- La lógica de negocio está en `backend/src/services/negocio/planificacionService.js`.

## Comportamiento actual

- El Sidebar consulta las sesiones por semana mediante `GET /semanasEntrenamiento/:semanaId/sesiones`, evitando descargar todas las sesiones y filtrarlas en frontend.

- En CU-04 el entrenador solo introduce:
  - `descripcion`
  - `observaciones`
  - `kilometros_planificados`
- El backend calcula automáticamente:
  - `orden` (siguiente correlativo dentro de la semana)
  - `fecha_sesion` (dentro del rango `[fecha_inicio, fecha_fin]` de la semana)
  - `created_at`
- `creada_por`/`registrado_por` no se solicita manualmente y queda reservado para integración futura con JWT.

## Patrón de implementación

Se mantiene exactamente la arquitectura del proyecto:

- `Page`
- `Evento`
- `Service Frontend`
- `Ruta HTTP`
- `Controller`
- `Service Backend`
- `PostgreSQL`

## Buenas prácticas para futuras mejoras

1. Mantener validación de pertenencia atleta-semana en backend.
2. Preservar la regla de orden automático con unicidad por semana.
3. No introducir `kilometros_realizados` en CU-04; ese dato pertenece a CU-05.
4. Mantener `fecha_sesion` como dato interno no visible en UI.

## Relación con otras entidades

- `SesionEntrenamiento` pertenece a `SemanaEntrenamiento`.
- La relación es 1:N: una semana puede tener varias sesiones.
- CU-05 gestionará ejecución real (realizada y kilómetros realizados) sin doble conteo de kilómetros.
