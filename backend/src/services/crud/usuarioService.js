import crypto from 'crypto';
import pool, { query } from '../../config/db.js';
import { ServiceError } from '../serviceError.js';

function hashPassword(password) {
  return crypto.createHash('sha256').update(String(password)).digest('hex');
}

export async function listUsuarios() {
  const result = await query('SELECT id, username, email, rol, created_at, updated_at FROM usuario ORDER BY id');
  return result.rows;
}

export async function findUsuarioById(id) {
  const result = await query('SELECT id, username, email, rol, created_at, updated_at FROM usuario WHERE id = $1', [id]);
  return result.rows[0] ?? null;
}

export async function createUsuario(payload) {
  const {
    username,
    email,
    password,
    rol = 'ATLETA',
    nombre,
    sexo,
    peso,
    dias_disponibles,
    km_medios_ultimos_2_meses,
    lesiones_ultimo_anio,
  } = payload;
  const rolUpper = rol ? String(rol).toUpperCase() : 'ATLETA';

  if (!username || String(username).trim() === '') {
    throw new ServiceError(400, 'El username es requerido');
  }

  if (!email || String(email).trim() === '') {
    throw new ServiceError(400, 'El email es requerido');
  }

  if (!password || String(password).trim().length < 6) {
    throw new ServiceError(400, 'La contraseña es requerida y debe tener al menos 6 caracteres');
  }

  const rolesValidos = ['ADMIN', 'ATLETA', 'ENTRENADOR'];
  if (!rolesValidos.includes(rolUpper)) {
    throw new ServiceError(400, 'El rol debe ser ADMIN, ATLETA o ENTRENADOR');
  }

  if (rolUpper === 'ATLETA') {
    if (!nombre || String(nombre).trim() === '') {
      throw new ServiceError(400, 'El nombre del atleta es requerido');
    }

    if (peso !== undefined && peso !== null && Number(peso) <= 0) {
      throw new ServiceError(400, 'El peso debe ser mayor a 0');
    }

    const sexosValidos = ['M', 'F', 'OTRO'];
    if (sexo && !sexosValidos.includes(sexo)) {
      throw new ServiceError(400, 'El sexo debe ser M, F u OTRO');
    }
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const passwordHash = hashPassword(password);
    const userResult = await client.query(
      'INSERT INTO usuario (username, email, password_hash, rol) VALUES ($1, $2, $3, $4) RETURNING id, username, email, rol, created_at, updated_at',
      [String(username).trim(), String(email).trim().toLowerCase(), passwordHash, rolUpper]
    );

    const usuarioCreado = userResult.rows[0];

    if (rolUpper === 'ATLETA') {
      const atletaSql = `
        INSERT INTO atleta
        (nombre, usuario_id, sexo, peso, dias_disponibles, km_medios_ultimos_2_meses, lesiones_ultimo_anio, entrenador_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NULL)
        RETURNING *;
      `;

      const atletaParams = [
        String(nombre).trim(),
        usuarioCreado.id,
        sexo || null,
        peso || null,
        dias_disponibles ? JSON.stringify(dias_disponibles) : '[]',
        km_medios_ultimos_2_meses || null,
        lesiones_ultimo_anio ? JSON.stringify(lesiones_ultimo_anio) : '[]',
      ];

      await client.query(atletaSql, atletaParams);
    }

    await client.query('COMMIT');
    return usuarioCreado;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});

    if (error.code === '23505') {
      throw new ServiceError(409, 'El username ya existe');
    }
    throw error;
  } finally {
    client.release();
  }
}

export async function updateUsuario(id, payload) {
  const { username, email, password, rol } = payload;

  const fields = [];
  const params = [];
  let idx = 1;

  if (username !== undefined) {
    if (username === null || String(username).trim() === '') {
      throw new ServiceError(400, 'El username no puede estar vacío');
    }
    fields.push(`username = $${idx++}`);
    params.push(String(username).trim());
  }

  if (email !== undefined) {
    if (email === null || String(email).trim() === '') {
      throw new ServiceError(400, 'El email no puede estar vacío');
    }
    fields.push(`email = $${idx++}`);
    params.push(String(email).trim().toLowerCase());
  }

  if (password !== undefined) {
    if (password === null || String(password).trim().length < 6) {
      throw new ServiceError(400, 'La contraseña debe tener al menos 6 caracteres');
    }
    fields.push(`password_hash = $${idx++}`);
    params.push(hashPassword(password));
  }

  if (rol !== undefined) {
    const rolUpper = String(rol).toUpperCase();
    const rolesValidos = ['ADMIN', 'ATLETA', 'ENTRENADOR'];
    if (!rolesValidos.includes(rolUpper)) {
      throw new ServiceError(400, 'El rol debe ser ADMIN, ATLETA o ENTRENADOR');
    }
    fields.push(`rol = $${idx++}`);
    params.push(rolUpper);
  }

  if (fields.length === 0) {
    throw new ServiceError(400, 'No hay campos para actualizar');
  }

  try {
    params.push(id);
    const sql = `UPDATE usuario SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${idx} RETURNING id, username, email, rol, created_at, updated_at`;
    const result = await query(sql, params);

    if (result.rows.length === 0) {
      throw new ServiceError(404, `No se encontró usuario con id ${id}`);
    }

    return result.rows[0];
  } catch (error) {
    if (error.code === '23505') {
      throw new ServiceError(409, 'El username ya existe');
    }
    throw error;
  }
}

export async function deleteUsuario(id) {
  const result = await query('DELETE FROM usuario WHERE id = $1 RETURNING id, username, email, rol, created_at, updated_at', [id]);

  if (result.rows.length === 0) {
    throw new ServiceError(404, `No se encontró usuario con id ${id}`);
  }

  return result.rows[0];
}
