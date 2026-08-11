import crypto from 'crypto';
import { query } from '../../config/db.js';
import { ServiceError } from '../serviceError.js';

function hashPassword(password) {
  return crypto.createHash('sha256').update(String(password)).digest('hex');
}

export async function loginData({ username, password }) {
  const usernameValue = String(username ?? '').trim();
  const passwordValue = String(password ?? '');

  if (!usernameValue || !passwordValue) {
    throw new ServiceError(400, 'Username y contraseña son obligatorios');
  }

  const result = await query(
    `SELECT id, username, password_hash, rol
     FROM usuario
     WHERE username = $1
     LIMIT 1`,
    [usernameValue]
  );

  const usuario = result.rows[0] ?? null;
  const passwordHash = hashPassword(passwordValue);

  if (!usuario || usuario.password_hash !== passwordHash) {
    // Mensaje genérico para no revelar si el username existe.
    throw new ServiceError(401, 'Credenciales inválidas');
  }

  // ─── CONCEPTO: GENERACIÓN DE TOKEN ───────────────────────────────────────
  //
  // Una vez verificadas las credenciales, el backend genera un TOKEN.
  // Un token es una cadena firmada que contiene datos del usuario (payload).
  //
  // Ejemplo con la librería jsonwebtoken (JWT):
  //
  //   import jwt from 'jsonwebtoken';
  //
  //   const token = jwt.sign(
  //     { id: usuario.id, username: usuario.username, rol: usuario.rol },  // payload: qué guarda
  //     process.env.JWT_SECRET,                                            // firma secreta del servidor
  //     { expiresIn: '8h' }                                                // cuánto tiempo es válido
  //   );
  //
  // El cliente guarda ese token y lo envía en cada petición futura:
  //   Authorization: Bearer <token>
  //
  // El servidor puede verificar que el token es auténtico (fue firmado por él)
  // sin necesidad de consultar la base de datos en cada petición.
  //
  // POR QUÉ NO LO IMPLEMENTAMOS AÚN:
  //   Este bloque solo necesita verificar credenciales.
  //   El token protegería las rutas del panel, que viene en el siguiente bloque.
  // ────────────────────────────────────────────────────────────────────────────

  return {
    id: usuario.id,
    username: usuario.username,
    rol: usuario.rol,
  };
}
