# API de Training Tool

Lista de todos los endpoints del backend. Para ver ejemplos de respuestas y las reglas de cada pantalla, consulta los [casos de uso](casos_de_uso/).

- Dirección del servidor en local: `http://localhost:3000` (el puerto está fijo en `backend/src/server.js`).
- Todas las respuestas llevan `"success": true` o `"success": false` y, si hay error, un `message`.
- Excepto el login y el registro, todas las rutas necesitan el token en la cabecera: `Authorization: Bearer <token>`.

## Quién puede usar cada endpoint

Los roles son `ADMIN`, `ENTRENADOR` y `ATLETA`. Si no se indica otra cosa, un `ATLETA` solo puede ver sus propios datos.

### Acceso

| Método | Ruta | Quién | Qué hace |
|---|---|---|---|
| POST | `/auth/register` | Público | Crea un usuario con rol `ATLETA` y su perfil de atleta |
| POST | `/auth/login` | Público | Devuelve `{ usuario, token }` |

### Pantallas de la aplicación

| Método | Ruta | Quién | Qué hace |
|---|---|---|---|
| GET | `/dashboard` | Todos | Resumen, notificaciones y lista de atletas (`?limit=` y `?offset=`) |
| GET | `/planificacion/:atletaId` | Todos | Objetivo activo, semana actual o próxima y sus sesiones |
| GET | `/planificacion/:atletaId/semanas` | Todos | Todas las semanas del objetivo activo |
| GET | `/planificacion/:atletaId/semanas/propuesta` | `ADMIN`, `ENTRENADOR` | Fechas sugeridas para la siguiente semana |
| POST | `/planificacion/:atletaId/semanas` | `ADMIN`, `ENTRENADOR` | Crea una semana (body: `fecha_inicio`) |
| POST | `/planificacion/:atletaId/semanas/:semanaId/sesiones` | `ADMIN`, `ENTRENADOR` | Crea una sesión |
| PATCH | `/planificacion/:atletaId/semanas/:semanaId/sesiones/:sesionId/resultado` | Todos | Registra los km realizados de una sesión |
| POST | `/planificacion/:atletaId/semanas/:semanaId/feedback` | `ATLETA` | Envía el feedback de una semana |
| PATCH | `/planificacion/:atletaId/objetivos/:objetivoId/marca` | `ADMIN`, `ENTRENADOR` | Registra la marca y cierra el objetivo |
| GET | `/historial/atletas/:atletaId` | Todos | Historial completo de un atleta |
| GET | `/historial/atletas/:atletaId/objetivos` | Todos | Solo los objetivos |
| GET | `/historial/atletas/:atletaId/feedback` | Todos | Lista resumida de feedback |
| GET | `/historial/objetivos/:objetivoId/planificacion` | Todos | Semanas de un objetivo con sus km realizados |
| GET | `/historial/feedback/:feedbackId` | Todos | Detalle de un feedback (lo marca como leído) |
| GET / PUT | `/perfil` | `ATLETA` | Ver y editar su propio perfil |

### Administración (solo `ADMIN`)

| Método | Ruta | Qué hace |
|---|---|---|
| POST | `/administracion/entrenadores` | Crea un entrenador (usuario + perfil) |
| PUT | `/administracion/entrenadores/:entrenadorId` | Edita un entrenador |
| PUT | `/administracion/entrenadores/:entrenadorId/password` | Cambia su contraseña |
| GET | `/administracion/atletas` | Lista atletas (se distinguen los que no tienen entrenador) |
| POST | `/administracion/atletas/:atletaId/autoasignacion` | Asigna un entrenador a un atleta sin entrenador |
| POST | `/administracion/atletas/:atletaId/reasignacion` | Cambia el entrenador de un atleta |
| PUT | `/administracion/atletas/:atletaId` | Edita nombre, sexo y peso |
| POST | `/administracion/atletas/:atletaId/reset-password` | Pone una contraseña temporal al atleta |

### Operaciones básicas sobre las tablas (CRUD)

| Ruta | Quién | Operaciones |
|---|---|---|
| `/atletas` | `ADMIN`, `ENTRENADOR` | listar, ver uno, crear, editar, borrar |
| `/objetivos` | Ver: todos. Crear: `ENTRENADOR`, `ATLETA`. Editar: `ADMIN`, `ENTRENADOR` | listar, ver uno, crear, editar (no se puede borrar) |
| `/semanasEntrenamiento` | `ADMIN`, `ENTRENADOR` | listar, ver una, crear, editar, borrar |
| `/sesionesEntrenamiento` | `ADMIN`, `ENTRENADOR` | listar, ver una, crear, editar, borrar |
| `GET /semanasEntrenamiento/:semanaId/sesiones` | Todos | sesiones de una semana |
| `/feedback` | `ADMIN`, `ENTRENADOR` | listar, ver uno, crear, editar, borrar |
| `/usuarios` | `ADMIN` | listar, ver uno, crear, editar, borrar |
| `/entrenadores` | `ADMIN` | listar, ver uno, crear, editar |

Estas rutas existen para consultar y mantener los datos. La aplicación usa sobre todo las de las pantallas.

## Códigos de error habituales

| Código | Cuándo |
|---|---|
| 400 | Falta un dato o no es válido |
| 401 | No hay token o no es válido |
| 403 | El rol no tiene permiso, o el dato es de otro atleta |
| 404 | No se encuentra lo pedido |
| 409 | La acción choca con una regla (por ejemplo, ya hay un objetivo activo) |
