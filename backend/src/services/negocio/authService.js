import crypto from 'crypto';
import jwt from 'jsonwebtoken';
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

  const payload = { id: usuario.id, username: usuario.username, rol: usuario.rol };
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });

  return { token, usuario: payload };
}
