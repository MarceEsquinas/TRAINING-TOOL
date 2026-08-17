import crypto from 'crypto';
import pool, { query } from '../../config/db.js';
import { createUsuario, updateUsuario } from '../crud/usuarioService.js';
import { ServiceError } from '../serviceError.js';

// Seguridad mínima de V1: nunca persistir contraseñas en texto plano.
function hashPassword(password) {
  return crypto.createHash('sha256').update(String(password)).digest('hex');
}

function validateNumericId(idValue, fieldName) {
  if (!idValue || Number.isNaN(Number(idValue))) {
    throw new ServiceError(400, `El ${fieldName} debe ser un número válido`);
  }
}

async function assertEntrenadorExists(entrenadorId) {
  const result = await query('SELECT id FROM entrenadores WHERE id = $1', [entrenadorId]);

  if (result.rows.length === 0) {
    throw new ServiceError(404, `No se encontró entrenador con id ${entrenadorId}`);
  }
}

// Lectura centralizada para no repetir validación 404 en varias acciones admin.
async function getAtletaByIdForAdmin(atletaId) {
  const result = await query(
    `SELECT id, nombre, entrenador_id, usuario_id
     FROM atleta
     WHERE id = $1`,
    [atletaId]
  );

  if (result.rows.length === 0) {
    throw new ServiceError(404, `No se encontró atleta con id ${atletaId}`);
  }

  return result.rows[0];
}

export async function crearEntrenadorConUsuarioData({ username, email, password, nombre }) {
  const cleanUsername = String(username ?? '').trim();
  const cleanEmail = String(email ?? '').trim().toLowerCase();
  const cleanPassword = String(password ?? '');
  const cleanNombre = String(nombre ?? '').trim();

  if (!cleanUsername) {
    throw new ServiceError(400, 'El username es requerido');
  }

  if (!cleanEmail) {
    throw new ServiceError(400, 'El email es requerido');
  }

  if (cleanPassword.length < 6) {
    throw new ServiceError(400, 'La contraseña es requerida y debe tener al menos 6 caracteres');
  }

  if (!cleanNombre) {
    throw new ServiceError(400, 'El nombre del entrenador es requerido');
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const usuarioCreado = await createUsuario(
      {
        username: cleanUsername,
        email: cleanEmail,
        password: cleanPassword,
        rol: 'ENTRENADOR',
      },
      client
    );

    const entrenadorResult = await client.query(
      `INSERT INTO entrenadores (usuario_id, nombre)
       VALUES ($1, $2)
       RETURNING id, usuario_id, nombre, created_at, updated_at`,
      [usuarioCreado.id, cleanNombre]
    );

    await client.query('COMMIT');

    return {
      usuario: usuarioCreado,
      entrenador: entrenadorResult.rows[0],
    };
  } catch (error) {
    await client.query('ROLLBACK');

    if (error instanceof ServiceError) {
      throw error;
    }

    if (error.code === '23505') {
      throw new ServiceError(409, 'Ya existe un usuario o perfil de entrenador con esos datos');
    }

    throw error;
  } finally {
    client.release();
  }
}

export async function actualizarEntrenadorConUsuarioData({ entrenadorId, payload = {} }) {
  validateNumericId(entrenadorId, 'entrenadorId');

  const { username, email, nombre } = payload ?? {};
  const userFields = {};
  const trainerFields = {};

  if (username !== undefined) {
    const cleanUsername = String(username ?? '').trim();
    if (!cleanUsername) {
      throw new ServiceError(400, 'El username no puede estar vacío');
    }
    userFields.username = cleanUsername;
  }

  if (email !== undefined) {
    const cleanEmail = String(email ?? '').trim().toLowerCase();
    if (!cleanEmail) {
      throw new ServiceError(400, 'El email no puede estar vacío');
    }
    userFields.email = cleanEmail;
  }

  if (nombre !== undefined) {
    const cleanNombre = String(nombre ?? '').trim();
    if (!cleanNombre) {
      throw new ServiceError(400, 'El nombre del entrenador no puede estar vacío');
    }
    trainerFields.nombre = cleanNombre;
  }

  if (Object.keys(userFields).length === 0 && Object.keys(trainerFields).length === 0) {
    throw new ServiceError(400, 'No hay campos para actualizar');
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const entrenadorResult = await client.query(
      `SELECT e.id, e.usuario_id, e.nombre, u.username, u.email
       FROM entrenadores e
       INNER JOIN usuario u ON u.id = e.usuario_id
       WHERE e.id = $1`,
      [entrenadorId]
    );

    if (entrenadorResult.rows.length === 0) {
      throw new ServiceError(404, `No se encontró entrenador con id ${entrenadorId}`);
    }

    const { usuario_id } = entrenadorResult.rows[0];

    if (Object.keys(userFields).length > 0) {
      await updateUsuario(usuario_id, userFields, client);
    }

    let entrenadorActualizado = entrenadorResult.rows[0];
    if (Object.keys(trainerFields).length > 0) {
      const updateResult = await client.query(
        `UPDATE entrenadores
         SET nombre = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING id, usuario_id, nombre, created_at, updated_at`,
        [trainerFields.nombre, entrenadorId]
      );
      entrenadorActualizado = updateResult.rows[0];
    }

    await client.query('COMMIT');

    return {
      usuario_id,
      entrenador: entrenadorActualizado,
    };
  } catch (error) {
    await client.query('ROLLBACK');

    if (error instanceof ServiceError) {
      throw error;
    }

    if (error.code === '23505') {
      throw new ServiceError(409, 'El username o email ya existen');
    }

    throw error;
  } finally {
    client.release();
  }
}

export async function actualizarPasswordEntrenadorData({ entrenadorId, nuevaPassword }) {
  validateNumericId(entrenadorId, 'entrenadorId');

  if (!nuevaPassword || String(nuevaPassword).trim().length < 6) {
    throw new ServiceError(400, 'La contraseña debe tener al menos 6 caracteres');
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const entrenadorResult = await client.query(
      'SELECT usuario_id FROM entrenadores WHERE id = $1',
      [entrenadorId]
    );

    if (entrenadorResult.rows.length === 0) {
      throw new ServiceError(404, `No se encontró entrenador con id ${entrenadorId}`);
    }

    const { usuario_id } = entrenadorResult.rows[0];
    const usuarioActualizado = await updateUsuario(usuario_id, { password: nuevaPassword }, client);

    await client.query('COMMIT');

    return {
      usuario_id,
      usuario: usuarioActualizado,
    };
  } catch (error) {
    await client.query('ROLLBACK');

    if (error instanceof ServiceError) {
      throw error;
    }

    throw error;
  } finally {
    client.release();
  }
}

export async function getAdministracionAtletasData({ estado }) {
  // Filtro opcional de negocio: pendientes = atletas sin entrenador asignado.
  const onlyPendientes = String(estado || '').toLowerCase() === 'pendiente';

  const params = [];
  let sql = `
    SELECT
      a.id,
      a.nombre,
      a.usuario_id,
      a.entrenador_id,
      a.sexo,
      a.peso,
      e.nombre AS entrenador_nombre,
      a.created_at,
      a.updated_at
    FROM atleta a
    LEFT JOIN entrenadores e ON e.id = a.entrenador_id`;

  if (onlyPendientes) {
    sql += '\nWHERE a.entrenador_id IS NULL';
  }

  sql += '\nORDER BY a.id';

  const result = await query(sql, params);
  return {
    data: result.rows,
    count: result.rows.length,
  };
}

export async function updateAtletaAdministracionData({ atletaId, payload }) {
  validateNumericId(atletaId, 'atletaId');

  const { nombre, sexo, peso } = payload ?? {};
  const fields = [];
  const params = [];
  let idx = 1;

  if (nombre !== undefined) {
    if (nombre === null || String(nombre).trim() === '') {
      throw new ServiceError(400, 'El nombre del atleta no puede estar vacío');
    }
    fields.push(`nombre = $${idx++}`);
    params.push(String(nombre).trim());
  }

  if (sexo !== undefined) {
    if (sexo !== null) {
      const sexoUpper = String(sexo).toUpperCase();
      const sexosValidos = ['M', 'F', 'OTRO'];
      if (!sexosValidos.includes(sexoUpper)) {
        throw new ServiceError(400, 'El sexo debe ser M, F u OTRO');
      }
      fields.push(`sexo = $${idx++}`);
      params.push(sexoUpper);
    } else {
      fields.push(`sexo = $${idx++}`);
      params.push(null);
    }
  }

  if (peso !== undefined) {
    if (peso === null || peso === '') {
      fields.push(`peso = $${idx++}`);
      params.push(null);
    } else {
      const pesoNumerico = Number(peso);
      if (!Number.isFinite(pesoNumerico) || pesoNumerico <= 0) {
        throw new ServiceError(400, 'El peso debe ser un número mayor a 0');
      }
      fields.push(`peso = $${idx++}`);
      params.push(pesoNumerico);
    }
  }

  if (fields.length === 0) {
    throw new ServiceError(400, 'No hay campos de atleta para actualizar');
  }

  params.push(atletaId);
  const result = await query(
    `UPDATE atleta
     SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
     WHERE id = $${idx}
     RETURNING *`,
    params
  );

  if (result.rows.length === 0) {
    throw new ServiceError(404, `No se encontró atleta con id ${atletaId}`);
  }

  return result.rows[0];
}

export async function autoasignarAtletaPendienteData({ atletaId, entrenadorId }) {
  validateNumericId(atletaId, 'atletaId');
  validateNumericId(entrenadorId, 'entrenadorId');

  await assertEntrenadorExists(entrenadorId);
  const atleta = await getAtletaByIdForAdmin(atletaId);

  // Regla V1: autoasignación solo permitida si el atleta aún está pendiente.
  if (atleta.entrenador_id !== null) {
    throw new ServiceError(409, 'El atleta ya tiene un entrenador asignado. Solo Admin puede reasignar');
  }

  const result = await query(
    `UPDATE atleta
     SET entrenador_id = $1,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $2
     RETURNING *`,
    [entrenadorId, atletaId]
  );

  return result.rows[0];
}

export async function reasignarAtletaData({ atletaId, entrenadorId }) {
  validateNumericId(atletaId, 'atletaId');
  validateNumericId(entrenadorId, 'entrenadorId');

  await assertEntrenadorExists(entrenadorId);
  await getAtletaByIdForAdmin(atletaId);

  // Reasignación explícita: operación administrativa, no flujo deportivo.
  const result = await query(
    `UPDATE atleta
     SET entrenador_id = $1,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $2
     RETURNING *`,
    [entrenadorId, atletaId]
  );

  return result.rows[0];
}

export async function getAdministracionUsuariosData() {
  const result = await query(
    `SELECT id, username, rol, created_at, updated_at
     FROM usuario
     ORDER BY id`
  );

  return {
    data: result.rows,
    count: result.rows.length,
  };
}

export async function resetearPasswordTemporalAtletaData({ atletaId, nuevaPassword }) {
  validateNumericId(atletaId, 'atletaId');

  if (!nuevaPassword || String(nuevaPassword).trim().length < 4) {
    throw new ServiceError(400, 'La nueva contraseña temporal debe tener al menos 4 caracteres');
  }

  const atleta = await getAtletaByIdForAdmin(atletaId);
  if (!atleta.usuario_id) {
    throw new ServiceError(409, 'El atleta no tiene un usuario vinculado para resetear contraseña');
  }

  const passwordHash = hashPassword(nuevaPassword);
  const result = await query(
    `UPDATE usuario
     SET password_hash = $1,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $2
     RETURNING id, username, rol, created_at, updated_at`,
    [passwordHash, atleta.usuario_id]
  );

  if (result.rows.length === 0) {
    throw new ServiceError(404, `No se encontró usuario con id ${atleta.usuario_id}`);
  }

  return {
    atleta_id: Number(atletaId),
    usuario: result.rows[0],
  };
}

export async function resetearPasswordTemporalUsuarioData({ usuarioId, nuevaPassword }) {
  validateNumericId(usuarioId, 'usuarioId');

  if (!nuevaPassword || String(nuevaPassword).trim().length < 4) {
    throw new ServiceError(400, 'La nueva contraseña temporal debe tener al menos 4 caracteres');
  }

  // El admin define una contraseña temporal; el usuario la cambiará después.
  const passwordHash = hashPassword(nuevaPassword);
  const result = await query(
    `UPDATE usuario
     SET password_hash = $1,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $2
     RETURNING id, username, rol, created_at, updated_at`,
    [passwordHash, usuarioId]
  );

  if (result.rows.length === 0) {
    throw new ServiceError(404, `No se encontró usuario con id ${usuarioId}`);
  }

  return result.rows[0];
}
