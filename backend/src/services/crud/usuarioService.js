import crypto from 'crypto';
import { query } from '../../config/db.js';
import { ServiceError } from '../serviceError.js';

const ROLES_VALIDOS = ['ADMIN', 'ENTRENADOR', 'ATLETA'];

function hashPassword(password) {
  return crypto.createHash('sha256').update(String(password)).digest('hex');
}

function normalizeRol(rol) {
  if (rol === undefined || rol === null || rol === '') {
    return 'ATLETA';
  }

  const rolUpper = String(rol).toUpperCase();
  if (!ROLES_VALIDOS.includes(rolUpper)) {
    throw new ServiceError(400, 'El rol debe ser ADMIN, ENTRENADOR o ATLETA');
  }

  return rolUpper;
}

export async function listUsuarios() {
  const result = await query(
    'SELECT id, username, email, rol, created_at, updated_at FROM usuario ORDER BY id'
  );
  return result.rows;
}

export async function findUsuarioById(id) {
  const result = await query(
    'SELECT id, username, email, rol, created_at, updated_at FROM usuario WHERE id = $1',
    [id]
  );
  return result.rows[0] ?? null;
}

export async function createUsuario(payload = {}, client = null) {
  const { username, email, password, rol = 'ATLETA' } = payload;

  const cleanUsername = String(username ?? '').trim();
  const cleanEmail = String(email ?? '').trim().toLowerCase();
  const rolUpper = normalizeRol(rol);

  if (!cleanUsername) {
    throw new ServiceError(400, 'El username es requerido');
  }

  if (!cleanEmail) {
    throw new ServiceError(400, 'El email es requerido');
  }

  if (!password || String(password).trim().length < 6) {
    throw new ServiceError(400, 'La contraseña es requerida y debe tener al menos 6 caracteres');
  }

  const dbQuery = client ? client.query.bind(client) : query;

  const existingUser = await dbQuery(
    'SELECT id FROM usuario WHERE username = $1 OR email = $2 LIMIT 1',
    [cleanUsername, cleanEmail]
  );

  if (existingUser.rows.length > 0) {
    throw new ServiceError(409, 'Ya existe un usuario con ese username o email');
  }

  try {
    const passwordHash = hashPassword(password);
    const result = await dbQuery(
      'INSERT INTO usuario (username, email, password_hash, rol) VALUES ($1, $2, $3, $4) RETURNING id, username, email, rol, created_at, updated_at',
      [cleanUsername, cleanEmail, passwordHash, rolUpper]
    );
    return result.rows[0];
  } catch (error) {
    if (error.code === '23505') {
      throw new ServiceError(409, 'El username o email ya existen');
    }
    throw error;
  }
}

export async function updateUsuario(id, payload = {}, client = null) {
  const { username, email, password, rol } = payload;

  const fields = [];
  const params = [];
  let idx = 1;

  if (username !== undefined) {
    const cleanUsername = String(username ?? '').trim();
    if (!cleanUsername) {
      throw new ServiceError(400, 'El username no puede estar vacío');
    }
    fields.push(`username = $${idx++}`);
    params.push(cleanUsername);
  }

  if (email !== undefined) {
    const cleanEmail = String(email ?? '').trim().toLowerCase();
    if (!cleanEmail) {
      throw new ServiceError(400, 'El email no puede estar vacío');
    }
    fields.push(`email = $${idx++}`);
    params.push(cleanEmail);
  }

  if (password !== undefined) {
    if (password === null || String(password).trim().length < 6) {
      throw new ServiceError(400, 'La contraseña debe tener al menos 6 caracteres');
    }
    fields.push(`password_hash = $${idx++}`);
    params.push(hashPassword(password));
  }

  if (rol !== undefined) {
    const rolUpper = normalizeRol(rol);
    fields.push(`rol = $${idx++}`);
    params.push(rolUpper);
  }

  if (fields.length === 0) {
    throw new ServiceError(400, 'No hay campos para actualizar');
  }

  try {
    params.push(id);
    const sql = `UPDATE usuario SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${idx} RETURNING id, username, email, rol, created_at, updated_at`;
    const dbQuery = client ? client.query.bind(client) : query;
    const result = await dbQuery(sql, params);

    if (result.rows.length === 0) {
      throw new ServiceError(404, `No se encontró usuario con id ${id}`);
    }

    return result.rows[0];
  } catch (error) {
    if (error.code === '23505') {
      throw new ServiceError(409, 'El username o email ya existen');
    }
    throw error;
  }
}

export async function deleteUsuario(id) {
  const result = await query(
    'DELETE FROM usuario WHERE id = $1 RETURNING id, username, email, rol, created_at, updated_at',
    [id]
  );

  if (result.rows.length === 0) {
    throw new ServiceError(404, `No se encontró usuario con id ${id}`);
  }

  return result.rows[0];
}
