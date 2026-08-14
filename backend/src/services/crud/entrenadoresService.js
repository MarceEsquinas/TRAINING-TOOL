import crypto from 'crypto';
import pool, { query } from '../../config/db.js';
import { ServiceError } from '../serviceError.js';

function hashPassword(password) {
  return crypto.createHash('sha256').update(String(password)).digest('hex');
}

function normalizeUsernameFromCorreo(correo, fallback = '') {
  const base = String(correo ?? fallback ?? '').trim();
  if (!base) {
    return '';
  }

  const normalized = base.split('@')[0].trim().toLowerCase();
  return normalized || base.toLowerCase();
}

function toUsernameFromPayload(payload, correo) {
  const provided = payload?.username ?? payload?.email ?? payload?.usuario?.username ?? null;
  if (provided && String(provided).trim() !== '') {
    return String(provided).trim();
  }

  return normalizeUsernameFromCorreo(correo, 'entrenador');
}

export async function listEntrenadores() {
  const result = await query(
    `SELECT e.id, e.nombre, u.email AS correo, e.usuario_id, u.username, e.created_at, e.updated_at
     FROM entrenadores e
     LEFT JOIN usuario u ON u.id = e.usuario_id
     ORDER BY e.id`
  );

  return result.rows;
}

export async function findEntrenadorById(id) {
  const result = await query(
    `SELECT e.id, e.nombre, u.email AS correo, e.usuario_id, u.username, e.created_at, e.updated_at
     FROM entrenadores e
     LEFT JOIN usuario u ON u.id = e.usuario_id
     WHERE e.id = $1`,
    [id]
  );

  return result.rows[0] ?? null;
}

export async function createEntrenador(payload) {
  const { nombre, correo, email, password, username, rol } = payload ?? {};
  const rolValue = String(rol ?? 'ENTRENADOR').toUpperCase();

  if (rolValue !== 'ENTRENADOR') {
    throw new ServiceError(400, 'El rol del usuario debe ser ENTRENADOR');
  }

  if (!nombre || String(nombre).trim() === '') {
    throw new ServiceError(400, 'El nombre del entrenador es requerido');
  }

  const emailValue = String(email ?? correo ?? '').trim().toLowerCase();
  if (!emailValue || emailValue.trim() === '') {
    throw new ServiceError(400, 'El email del entrenador es requerido');
  }

  if (!password || String(password).trim().length < 6) {
    throw new ServiceError(400, 'La contraseña es requerida y debe tener al menos 6 caracteres');
  }

  const usernameValue = toUsernameFromPayload({ username }, emailValue);
  if (!usernameValue || usernameValue.trim() === '') {
    throw new ServiceError(400, 'El username del entrenador es requerido');
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const hasEmailColumnResult = await client.query(
      `SELECT 1
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'usuario'
         AND column_name = 'email'
       LIMIT 1`
    );
    const hasEmailColumn = hasEmailColumnResult.rowCount > 0;

    const userResult = hasEmailColumn
      ? await client.query(
          `INSERT INTO usuario (username, email, password_hash, rol)
           VALUES ($1, $2, $3, 'ENTRENADOR')
           ON CONFLICT (username) DO NOTHING
           RETURNING id, username, email, rol`,
          [String(usernameValue).trim(), emailValue, hashPassword(password)]
        )
      : await client.query(
          `INSERT INTO usuario (username, password_hash, rol)
           VALUES ($1, $2, 'ENTRENADOR')
           ON CONFLICT (username) DO NOTHING
           RETURNING id, username, rol`,
          [String(usernameValue).trim(), hashPassword(password)]
        );

    const usuario = userResult.rows[0];
    if (!usuario) {
      const existingUser = hasEmailColumn
        ? await client.query(
            `SELECT id, username, email FROM usuario WHERE username = $1 AND rol = 'ENTRENADOR'`,
            [String(usernameValue).trim()]
          )
        : await client.query(
            `SELECT id, username FROM usuario WHERE username = $1 AND rol = 'ENTRENADOR'`,
            [String(usernameValue).trim()]
          );

      if (existingUser.rows.length === 0) {
        throw new ServiceError(409, 'No se pudo crear el usuario del entrenador');
      }

      const usuarioExistente = existingUser.rows[0];
      const trainerResult = await client.query(
        `INSERT INTO entrenadores (nombre, usuario_id)
         VALUES ($1, $2)
         ON CONFLICT (usuario_id) DO NOTHING
         RETURNING id, nombre, usuario_id, created_at, updated_at`,
        [String(nombre).trim(), usuarioExistente.id]
      );

      if (trainerResult.rows.length === 0) {
        throw new ServiceError(409, 'Ya existe un perfil de entrenador para ese usuario');
      }

      await client.query('COMMIT');
      return {
        ...trainerResult.rows[0],
        username: usuarioExistente.username,
        email: usuarioExistente.email ?? emailValue,
      };
    }

    const trainerResult = await client.query(
      `INSERT INTO entrenadores (nombre, usuario_id)
       VALUES ($1, $2)
       RETURNING id, nombre, usuario_id, created_at, updated_at`,
      [String(nombre).trim(), usuario.id]
    );

    await client.query('COMMIT');
    return {
      ...trainerResult.rows[0],
      username: usuario.username,
      email: usuario.email ?? emailValue,
    };
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});

    if (error.code === '23505') {
      throw new ServiceError(409, 'Ya existe un entrenador con ese correo o username');
    }

    throw error;
  } finally {
    client.release();
  }
}

export async function updateEntrenador(id, payload) {
  const { nombre, correo, email, password, username } = payload ?? {};
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const existing = await client.query(
      `SELECT e.id, e.nombre, e.usuario_id, u.username, u.email, u.password_hash
       FROM entrenadores e
       LEFT JOIN usuario u ON u.id = e.usuario_id
       WHERE e.id = $1`,
      [id]
    );

    if (existing.rows.length === 0) {
      throw new ServiceError(404, `No se encontró entrenador con id ${id}`);
    }

    const entrenador = existing.rows[0];

    if (nombre !== undefined) {
      if (nombre === null || String(nombre).trim() === '') {
        throw new ServiceError(400, 'El nombre del entrenador no puede estar vacío');
      }
      await client.query(
        `UPDATE entrenadores SET nombre = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [String(nombre).trim(), id]
      );
    }

    const targetEmail = correo !== undefined ? correo : email;
    if (targetEmail !== undefined) {
      if (targetEmail === null || String(targetEmail).trim() === '') {
        throw new ServiceError(400, 'El correo del entrenador no puede estar vacío');
      }

      if (!entrenador.usuario_id) {
        throw new ServiceError(409, 'El entrenador no tiene un usuario asociado para actualizar su email');
      }

      await client.query(
        `UPDATE usuario SET email = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [String(targetEmail).trim().toLowerCase(), entrenador.usuario_id]
      );
    }

    if (username !== undefined) {
      const usernameValue = String(username).trim();
      if (!usernameValue) {
        throw new ServiceError(400, 'El username no puede estar vacío');
      }

      if (!entrenador.usuario_id) {
        throw new ServiceError(409, 'El entrenador no tiene un usuario asociado para actualizar su username');
      }

      await client.query(
        `UPDATE usuario SET username = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [usernameValue, entrenador.usuario_id]
      );
    }

    if (password !== undefined) {
      if (password === null || String(password).trim().length < 6) {
        throw new ServiceError(400, 'La contraseña debe tener al menos 6 caracteres');
      }

      if (!entrenador.usuario_id) {
        throw new ServiceError(409, 'El entrenador no tiene un usuario asociado para actualizar la contraseña');
      }

      await client.query(
        `UPDATE usuario SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [hashPassword(password), entrenador.usuario_id]
      );
    }

    const result = await client.query(
      `SELECT e.id, e.nombre, u.email AS correo, e.usuario_id, u.username, e.created_at, e.updated_at
       FROM entrenadores e
       LEFT JOIN usuario u ON u.id = e.usuario_id
       WHERE e.id = $1`,
      [id]
    );

    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});

    if (error.code === '23505') {
      throw new ServiceError(409, 'Ya existe un entrenador con ese correo o username');
    }

    throw error;
  } finally {
    client.release();
  }
}
