import crypto from 'crypto';
import { query } from '../../config/db.js';
import { ServiceError } from '../serviceError.js';

function hashPassword(password) {
  return crypto.createHash('sha256').update(String(password)).digest('hex');
}

export async function listEntrenadores() {
  const result = await query(
    `SELECT id, nombre, correo, created_at, updated_at
     FROM entrenadores
     ORDER BY id`
  );

  return result.rows;
}

export async function findEntrenadorById(id) {
  const result = await query(
    `SELECT id, nombre, correo, created_at, updated_at
     FROM entrenadores
     WHERE id = $1`,
    [id]
  );

  return result.rows[0] ?? null;
}

export async function createEntrenador(payload) {
  const { nombre, correo, password } = payload ?? {};

  if (!nombre || String(nombre).trim() === '') {
    throw new ServiceError(400, 'El nombre del entrenador es requerido');
  }

  if (!correo || String(correo).trim() === '') {
    throw new ServiceError(400, 'El correo del entrenador es requerido');
  }

  if (!password || String(password).trim().length < 6) {
    throw new ServiceError(400, 'La contraseña es requerida y debe tener al menos 6 caracteres');
  }

  const params = [String(nombre).trim(), String(correo).trim().toLowerCase(), hashPassword(password)];

  try {
    const result = await query(
      `INSERT INTO entrenadores (nombre, correo, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, nombre, correo, created_at, updated_at`,
      params
    );

    return result.rows[0];
  } catch (error) {
    if (error.code === '23505') {
      throw new ServiceError(409, 'Ya existe un entrenador con ese correo');
    }

    throw error;
  }
}

export async function updateEntrenador(id, payload) {
  const { nombre, correo, password } = payload ?? {};

  const fields = [];
  const params = [];
  let idx = 1;

  if (nombre !== undefined) {
    if (nombre === null || String(nombre).trim() === '') {
      throw new ServiceError(400, 'El nombre del entrenador no puede estar vacío');
    }
    fields.push(`nombre = $${idx++}`);
    params.push(String(nombre).trim());
  }

  if (correo !== undefined) {
    if (correo === null || String(correo).trim() === '') {
      throw new ServiceError(400, 'El correo del entrenador no puede estar vacío');
    }
    fields.push(`correo = $${idx++}`);
    params.push(String(correo).trim().toLowerCase());
  }

  if (password !== undefined) {
    if (password === null || String(password).trim().length < 6) {
      throw new ServiceError(400, 'La contraseña debe tener al menos 6 caracteres');
    }
    fields.push(`password_hash = $${idx++}`);
    params.push(hashPassword(password));
  }

  if (fields.length === 0) {
    throw new ServiceError(400, 'No hay campos para actualizar');
  }

  params.push(id);

  try {
    const result = await query(
      `UPDATE entrenadores
       SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${idx}
       RETURNING id, nombre, correo, created_at, updated_at`,
      params
    );

    if (result.rows.length === 0) {
      throw new ServiceError(404, `No se encontró entrenador con id ${id}`);
    }

    return result.rows[0];
  } catch (error) {
    if (error.code === '23505') {
      throw new ServiceError(409, 'Ya existe un entrenador con ese correo');
    }

    throw error;
  }
}
