import { query } from '../../config/db.js';
import { ServiceError } from '../serviceError.js';

async function assertUsuarioEntrenadorValido(usuarioId, excludeId = null) {
  if (!usuarioId || Number.isNaN(Number(usuarioId))) {
    throw new ServiceError(400, 'El usuario_id del entrenador debe ser un número válido');
  }

  const userResult = await query(
    'SELECT id, rol FROM usuario WHERE id = $1',
    [usuarioId]
  );

  if (userResult.rows.length === 0) {
    throw new ServiceError(404, `No se encontró usuario con id ${usuarioId}`);
  }

  if (userResult.rows[0].rol !== 'ENTRENADOR') {
    throw new ServiceError(409, 'El usuario asociado debe tener rol ENTRENADOR');
  }

  const perfilResult = await query(
    'SELECT id FROM entrenadores WHERE usuario_id = $1 AND id <> COALESCE($2, -1)',
    [usuarioId, excludeId]
  );

  if (perfilResult.rows.length > 0) {
    throw new ServiceError(409, 'Ese usuario ya tiene un perfil de entrenador asociado');
  }
}

export async function listEntrenadores() {
  const result = await query(
    `SELECT e.id, e.usuario_id, e.nombre, u.username, u.email, u.rol, e.created_at, e.updated_at
     FROM entrenadores e
     INNER JOIN usuario u ON u.id = e.usuario_id
     ORDER BY e.id`
  );

  return result.rows;
}

export async function findEntrenadorById(id) {
  const result = await query(
    `SELECT e.id, e.usuario_id, e.nombre, u.username, u.email, u.rol, e.created_at, e.updated_at
     FROM entrenadores e
     INNER JOIN usuario u ON u.id = e.usuario_id
     WHERE e.id = $1`,
    [id]
  );

  return result.rows[0] ?? null;
}

export async function createEntrenador(payload = {}) {
  const { nombre, usuario_id } = payload;

  if (!nombre || String(nombre).trim() === '') {
    throw new ServiceError(400, 'El nombre del entrenador es requerido');
  }

  if (!usuario_id || Number.isNaN(Number(usuario_id))) {
    throw new ServiceError(400, 'El usuario_id del entrenador es requerido');
  }

  await assertUsuarioEntrenadorValido(usuario_id);

  try {
    const result = await query(
      `INSERT INTO entrenadores (usuario_id, nombre)
       VALUES ($1, $2)
       RETURNING id, usuario_id, nombre, created_at, updated_at`,
      [Number(usuario_id), String(nombre).trim()]
    );

    return result.rows[0];
  } catch (error) {
    if (error.code === '23505') {
      throw new ServiceError(409, 'Ese usuario ya tiene un perfil de entrenador asociado');
    }

    throw error;
  }
}

export async function updateEntrenador(id, payload = {}) {
  const { nombre, usuario_id } = payload;

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

  if (usuario_id !== undefined) {
    if (usuario_id === null || Number.isNaN(Number(usuario_id))) {
      throw new ServiceError(400, 'El usuario_id del entrenador debe ser un número válido');
    }
    fields.push(`usuario_id = $${idx++}`);
    params.push(Number(usuario_id));
  }

  if (fields.length === 0) {
    throw new ServiceError(400, 'No hay campos para actualizar');
  }

  try {
    const existing = await query('SELECT usuario_id FROM entrenadores WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      throw new ServiceError(404, `No se encontró entrenador con id ${id}`);
    }

    const nextUsuarioId = usuario_id !== undefined ? Number(usuario_id) : existing.rows[0].usuario_id;
    await assertUsuarioEntrenadorValido(nextUsuarioId, id);

    params.push(id);
    const result = await query(
      `UPDATE entrenadores
       SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${idx}
       RETURNING id, usuario_id, nombre, created_at, updated_at`,
      params
    );

    if (result.rows.length === 0) {
      throw new ServiceError(404, `No se encontró entrenador con id ${id}`);
    }

    return result.rows[0];
  } catch (error) {
    if (error instanceof ServiceError) {
      throw error;
    }
    if (error.code === '23505') {
      throw new ServiceError(409, 'Ese usuario ya tiene un perfil de entrenador asociado');
    }
    throw error;
  }
}
