import { query } from '../../config/db.js';
import { ServiceError } from '../serviceError.js';

const SEXOS_VALIDOS = ['M', 'F', 'OTRO'];

async function assertUsuarioAtletaValido(usuarioId, excludeId = null) {
  if (!usuarioId || Number.isNaN(Number(usuarioId))) {
    throw new ServiceError(400, 'El usuario_id del atleta debe ser un número válido');
  }

  const userResult = await query(
    'SELECT id, rol FROM usuario WHERE id = $1',
    [usuarioId]
  );

  if (userResult.rows.length === 0) {
    throw new ServiceError(404, `No se encontró usuario con id ${usuarioId}`);
  }

  if (userResult.rows[0].rol !== 'ATLETA') {
    throw new ServiceError(409, 'El usuario asociado debe tener rol ATLETA');
  }

  const perfilResult = await query(
    'SELECT id FROM atleta WHERE usuario_id = $1 AND id <> COALESCE($2, -1)',
    [usuarioId, excludeId]
  );

  if (perfilResult.rows.length > 0) {
    throw new ServiceError(409, 'Ese usuario ya tiene un perfil de atleta asociado');
  }
}

async function assertEntrenadorExiste(entrenadorId) {
  if (!entrenadorId) {
    return;
  }

  if (Number.isNaN(Number(entrenadorId))) {
    throw new ServiceError(400, 'El entrenador_id debe ser un número válido');
  }

  const result = await query(
    `SELECT e.id, u.rol
     FROM entrenadores e
     INNER JOIN usuario u ON u.id = e.usuario_id
     WHERE e.id = $1`,
    [Number(entrenadorId)]
  );

  if (result.rows.length === 0) {
    throw new ServiceError(404, `No se encontró entrenador con id ${entrenadorId}`);
  }

  if (result.rows[0].rol !== 'ENTRENADOR') {
    throw new ServiceError(409, 'El entrenador asociado debe tener rol ENTRENADOR');
  }
}

export async function listAtletas() {
  const result = await query(
    `SELECT a.*, u.username, u.email, u.rol, e.nombre AS entrenador_nombre
     FROM atleta a
     INNER JOIN usuario u ON u.id = a.usuario_id
     LEFT JOIN entrenadores e ON e.id = a.entrenador_id
     ORDER BY a.id`
  );
  return result.rows;
}

export async function findAtletaById(id) {
  const result = await query(
    `SELECT a.*, u.username, u.email, u.rol, e.nombre AS entrenador_nombre
     FROM atleta a
     INNER JOIN usuario u ON u.id = a.usuario_id
     LEFT JOIN entrenadores e ON e.id = a.entrenador_id
     WHERE a.id = $1`,
    [id]
  );
  return result.rows[0] ?? null;
}

export async function createAtleta(payload = {}) {
  const {
    nombre,
    usuario_id,
    entrenador_id,
    sexo,
    peso,
    dias_disponibles,
    km_medios_ultimos_2_meses,
    lesiones_ultimo_anio,
  } = payload;

  if (!nombre || String(nombre).trim() === '') {
    throw new ServiceError(400, 'El nombre del atleta es requerido');
  }

  if (!usuario_id || Number.isNaN(Number(usuario_id))) {
    throw new ServiceError(400, 'El usuario_id del atleta es requerido');
  }

  if (peso !== undefined && peso !== null && Number(peso) <= 0) {
    throw new ServiceError(400, 'El peso debe ser mayor a 0');
  }

  const sexoUpper = sexo !== undefined && sexo !== null ? String(sexo).toUpperCase() : null;
  if (sexoUpper && !SEXOS_VALIDOS.includes(sexoUpper)) {
    throw new ServiceError(400, 'El sexo debe ser M, F u OTRO');
  }

  await assertUsuarioAtletaValido(usuario_id);
  await assertEntrenadorExiste(entrenador_id);

  const sql = `
    INSERT INTO atleta
    (nombre, usuario_id, entrenador_id, sexo, peso, dias_disponibles, km_medios_ultimos_2_meses, lesiones_ultimo_anio)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *;
  `;

  const params = [
    String(nombre).trim(),
    Number(usuario_id),
    entrenador_id !== undefined && entrenador_id !== null ? Number(entrenador_id) : null,
    sexoUpper,
    peso !== undefined && peso !== null ? Number(peso) : null,
    dias_disponibles !== undefined ? JSON.stringify(dias_disponibles ?? []) : '[]',
    km_medios_ultimos_2_meses !== undefined && km_medios_ultimos_2_meses !== null ? Number(km_medios_ultimos_2_meses) : null,
    lesiones_ultimo_anio !== undefined ? JSON.stringify(lesiones_ultimo_anio ?? []) : '[]',
  ];

  try {
    const result = await query(sql, params);
    return result.rows[0];
  } catch (error) {
    if (error.code === '23505') {
      throw new ServiceError(409, 'Ese usuario ya tiene un perfil de atleta asociado');
    }
    throw error;
  }
}

export async function updateAtleta(id, payload = {}) {
  const {
    nombre,
    usuario_id,
    entrenador_id,
    sexo,
    peso,
    dias_disponibles,
    km_medios_ultimos_2_meses,
    lesiones_ultimo_anio,
  } = payload;

  if (nombre !== undefined && (nombre === null || String(nombre).trim() === '')) {
    throw new ServiceError(400, 'El nombre del atleta no puede estar vacío');
  }

  const sexoUpper = sexo !== undefined && sexo !== null ? String(sexo).toUpperCase() : sexo;
  if (sexoUpper !== undefined && sexoUpper !== null && !SEXOS_VALIDOS.includes(sexoUpper)) {
    throw new ServiceError(400, 'El sexo debe ser M, F u OTRO');
  }

  if (peso !== undefined && peso !== null && Number(peso) <= 0) {
    throw new ServiceError(400, 'El peso debe ser mayor a 0');
  }

  const fields = [];
  const params = [];
  let idx = 1;

  if (nombre !== undefined) {
    fields.push(`nombre = $${idx++}`);
    params.push(String(nombre).trim());
  }
  if (usuario_id !== undefined) {
    if (usuario_id === null || Number.isNaN(Number(usuario_id))) {
      throw new ServiceError(400, 'El usuario_id del atleta debe ser un número válido');
    }
    fields.push(`usuario_id = $${idx++}`);
    params.push(Number(usuario_id));
  }
  if (entrenador_id !== undefined) {
    if (entrenador_id === null) {
      fields.push(`entrenador_id = $${idx++}`);
      params.push(null);
    } else {
      if (Number.isNaN(Number(entrenador_id))) {
        throw new ServiceError(400, 'El entrenador_id debe ser un número válido');
      }
      fields.push(`entrenador_id = $${idx++}`);
      params.push(Number(entrenador_id));
    }
  }
  if (sexo !== undefined) {
    fields.push(`sexo = $${idx++}`);
    params.push(sexoUpper ?? null);
  }
  if (peso !== undefined) {
    fields.push(`peso = $${idx++}`);
    params.push(peso !== null && peso !== '' ? Number(peso) : null);
  }
  if (dias_disponibles !== undefined) {
    fields.push(`dias_disponibles = $${idx++}`);
    params.push(JSON.stringify(dias_disponibles ?? []));
  }
  if (km_medios_ultimos_2_meses !== undefined) {
    fields.push(`km_medios_ultimos_2_meses = $${idx++}`);
    params.push(km_medios_ultimos_2_meses !== null && km_medios_ultimos_2_meses !== '' ? Number(km_medios_ultimos_2_meses) : null);
  }
  if (lesiones_ultimo_anio !== undefined) {
    fields.push(`lesiones_ultimo_anio = $${idx++}`);
    params.push(JSON.stringify(lesiones_ultimo_anio ?? []));
  }

  if (fields.length === 0) {
    throw new ServiceError(400, 'No hay campos para actualizar');
  }

  try {
    const existing = await query('SELECT usuario_id, entrenador_id FROM atleta WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      throw new ServiceError(404, `No se encontró atleta con id ${id}`);
    }

    const nextUsuarioId = usuario_id !== undefined ? Number(usuario_id) : existing.rows[0].usuario_id;
    await assertUsuarioAtletaValido(nextUsuarioId, id);

    if (entrenador_id !== undefined && entrenador_id !== null) {
      await assertEntrenadorExiste(entrenador_id);
    }

    params.push(id);
    const sql = `UPDATE atleta SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${idx} RETURNING *;`;
    const result = await query(sql, params);

    if (result.rows.length === 0) {
      throw new ServiceError(404, `No se encontró atleta con id ${id}`);
    }

    return result.rows[0];
  } catch (error) {
    if (error instanceof ServiceError) {
      throw error;
    }
    if (error.code === '23505') {
      throw new ServiceError(409, 'Ese usuario ya tiene un perfil de atleta asociado');
    }
    throw error;
  }
}

export async function deleteAtleta(id) {
  const result = await query('DELETE FROM atleta WHERE id = $1 RETURNING *;', [id]);
  if (result.rows.length === 0) {
    throw new ServiceError(404, `No se encontró atleta con id ${id}`);
  }
  return result.rows[0];
}
