# 05 - Login, registro y permisos

## Para qué sirve

Permite entrar a la aplicación con un usuario y una contraseña, y hace que cada persona vea y haga solo lo que le corresponde según su rol.

## Roles

| Rol | Quién es |
|---|---|
| `ADMIN` | Gestiona entrenadores y atletas. Se crea a mano en la base de datos (ver el [README](../../README.md)) |
| `ENTRENADOR` | Planifica y sigue a sus atletas |
| `ATLETA` | Consulta su plan, registra sus km y envía feedback |

## Registro

Un atleta puede crear su cuenta con `POST /auth/register`. Se crean a la vez su usuario (rol `ATLETA`) y su perfil de atleta. Si falla una de las dos cosas, no se guarda ninguna.

Datos obligatorios: `nombre`, `username`, `email`, `password`, `peso`, `dias_disponibles`, `km_medios_ultimos_2_meses` y `lesiones_ultimo_anio` (puede ser una lista vacía).

El atleta nace **sin entrenador**. El administrador se lo asigna después (ver [04 - Administración](04_administracion.md)).

## Login

1. El usuario abre la aplicación. Si no hay sesión guardada, ve la pantalla de Login.
2. Escribe `username` y `password`. El frontend envía `POST /auth/login`.
3. El backend compara la contraseña con su hash.
4. Si es correcta, devuelve los datos del usuario y un **token**.
5. El frontend guarda todo en el `localStorage` (clave `tt_auth_user`) y muestra la aplicación.

### Reglas
1. El frontend nunca comprueba la contraseña; solo muestra la respuesta del backend.
2. Las contraseñas no se guardan en texto plano, solo su hash.
3. Si el usuario no existe o la contraseña es incorrecta, el mensaje es el mismo (`Credenciales inválidas`). Así no se sabe si el usuario existe.
4. El token caduca a las 8 horas. Después hay que volver a iniciar sesión.
5. Si un usuario `ATLETA` no tiene perfil de atleta, no puede entrar (403).

### Ejemplo

Petición:

```json
{ "username": "usuario_demo", "password": "123456" }
```

Respuesta correcta:

```json
{
  "success": true,
  "message": "Login correcto",
  "data": {
    "usuario": { "id": 1, "username": "usuario_demo", "rol": "ATLETA", "atletaId": 5 },
    "token": "eyJhbGciOi..."
  }
}
```

`atletaId` solo aparece si el usuario es atleta.

## El token

- Cada petición, excepto login y registro, debe llevar `Authorization: Bearer <token>`. El frontend lo hace con `fetchWithAuth` (en `frontend/src/services/apiBaseUrl.js`).
- Sin token o con un token caducado, el backend responde 401.
- Si el rol no tiene permiso, responde 403.
- El `atletaId` sale del token, nunca de lo que envía el navegador.

## Qué puede ver cada rol en la aplicación

| Pantalla | `ADMIN` | `ENTRENADOR` | `ATLETA` |
|---|---|---|---|
| Dashboard | Sí | Sí | Sí |
| Atletas | Sí | Sí | No |
| Administración | Sí | No | No |
| Planificación | Desde Dashboard o Atletas | Desde Dashboard o Atletas | Sí (la suya) |
| Historial | Desde Dashboard o Atletas | Desde Dashboard o Atletas | Sí (el suyo) |
| Perfil | No | No | Sí |

## Qué puede hacer cada rol

| Acción | `ADMIN` | `ENTRENADOR` | `ATLETA` |
|---|---|---|---|
| Ver atletas | Todos | Solo los suyos | No |
| Crear objetivo | No | Para sus atletas | Para sí mismo |
| Crear semanas y sesiones | Sí | Sí | No |
| Registrar km realizados | Sí | Sí | Solo semana actual |
| Enviar feedback | No | No | Sí |
| Registrar marca del objetivo | Sí | Sí (sus atletas) | No |
| Gestionar entrenadores y atletas | Sí | No | No |

**Nota:** en la aplicación, un entrenador solo ve a sus atletas (en Atletas y en el Dashboard) y solo puede crearles objetivos a ellos. Planificación e Historial se abren desde esas listas. Por API, si un entrenador conoce el id de un atleta ajeno, el backend todavía no lo bloquea en Planificación ni en Historial (solo al registrar la marca).
