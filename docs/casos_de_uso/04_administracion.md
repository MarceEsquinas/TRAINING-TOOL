# 04 - Administración

## Para qué sirve

Solo la usa el **administrador**. Tiene dos bloques: **Entrenadores** y **Atletas**.

## Entrenadores

- **Crear** un entrenador con `username`, `email`, `nombre` y `password` (mínimo 6 caracteres).
  Se crean a la vez su usuario (con rol `ENTRENADOR`) y su perfil de entrenador. Si algo falla, no se guarda nada.
- **Editar** el nombre de usuario (`username`), el email y el nombre.
- **Cambiar la contraseña** desde su bloque de edición.

## Atletas

- **Listar** los atletas. Se distinguen los **pendientes**, que son los que aún no tienen entrenador.
- **Asignar** un entrenador a un atleta pendiente.
- **Reasignar** un atleta a otro entrenador.
- **Editar** nombre, sexo (`M`, `F` u `OTRO`) y peso.
- **Resetear** la contraseña: se le pone una temporal.

## Reglas

1. Las contraseñas se guardan solo como hash. El frontend nunca recibe el hash.
2. Un atleta puede crearse sin entrenador. Se asigna después desde aquí.
3. El usuario y el email no pueden repetirse (error 409).
4. La contraseña nueva debe tener al menos 6 caracteres.

El entrenador asignado a un atleta determina qué atletas ve cada entrenador en la aplicación (en Atletas y en el Dashboard).

## Endpoints

Todos exigen el rol `ADMIN`.

| Método | Ruta |
|---|---|
| POST | `/administracion/entrenadores` |
| PUT | `/administracion/entrenadores/:entrenadorId` |
| PUT | `/administracion/entrenadores/:entrenadorId/password` |
| GET | `/administracion/atletas` |
| POST | `/administracion/atletas/:atletaId/autoasignacion` |
| POST | `/administracion/atletas/:atletaId/reasignacion` |
| PUT | `/administracion/atletas/:atletaId` |
| POST | `/administracion/atletas/:atletaId/reset-password` |

En la reasignación y la asignación se envía `{ "entrenador_id": 2 }`.
