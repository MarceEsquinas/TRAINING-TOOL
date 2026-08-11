# Caso de Uso: Login de Usuario

## Descripción General

La pantalla de Login permite que un usuario acceda al sistema con sus credenciales.

En este bloque se implementa solo el inicio de sesión básico para preparar los siguientes bloques (roles, permisos y registro).

---

## Objetivo del Caso de Uso

1. Permitir entrada de `username` y `password`.
2. Validar credenciales en backend.
3. Evitar validar contraseñas en frontend.
4. Responder errores de autenticación de forma controlada.
5. No revelar si el username existe o no.

---

## Actor Principal

Usuario del sistema (ADMIN o ATLETA).

---

## Flujo Principal

1. El usuario abre la aplicación.
2. Si no hay sesión local, se muestra la pantalla Login.
3. El usuario introduce `username` y `password`.
4. Frontend envía `POST /auth/login`.
5. Backend valida y compara con `password_hash`.
6. Si es correcto, frontend guarda datos básicos del usuario en `localStorage` y muestra la app.

---

## Reglas de Negocio Implementadas

1. `username` es el identificador de acceso.
2. La contraseña se compara usando hash en backend.
3. No se guardan contraseñas en texto plano.
4. El error de credenciales es genérico: `Credenciales inválidas`.
5. El frontend no decide si la contraseña es correcta; solo muestra la respuesta del backend.

---

## Endpoint Implementado

### POST /auth/login

Body de entrada:

```json
{
  "username": "usuario_demo",
  "password": "123456"
}
```

Respuesta correcta:

```json
{
  "success": true,
  "message": "Login correcto",
  "data": {
    "usuario": {
      "id": 1,
      "username": "usuario_demo",
      "rol": "ADMIN"
    }
  }
}
```

Respuesta de credenciales inválidas:

```json
{
  "success": false,
  "message": "Credenciales inválidas"
}
```

---

## Archivos Relacionados

Backend:
- `backend/src/routes/negocio/authRoute.js`
- `backend/src/controllers/negocio/authController.js`
- `backend/src/services/negocio/authService.js`

Frontend:
- `frontend/src/page/login.jsx`
- `frontend/src/services/authApi.js`
- `frontend/src/App.jsx`

---

## Próximo Bloque Sugerido

- Registro (`POST /auth/register`) con reglas mínimas.
- Cierre de sesión.
- Protección de rutas por sesión.
- Roles y permisos por pantalla.
