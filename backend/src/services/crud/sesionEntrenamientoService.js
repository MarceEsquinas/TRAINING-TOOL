import { query } from '../../config/db.js';
import { ServiceError } from '../serviceError.js';

export async function listSesionesEntrenamiento() {
  const result = await query('SELECT * FROM sesion_entrenamiento ORDER BY id');
  return result.rows;
}

async function assertSemanaEntrenamientoExists(semanaId) {
  if (!semanaId || Number.isNaN(Number(semanaId))) {
    throw new ServiceError(400, 'El semanaId debe ser un número válido');
  }

  const result = await query(
    'SELECT id FROM semana_entrenamiento WHERE id = $1 LIMIT 1;',
    [semanaId]
  );

  if (result.rows.length === 0) {
    throw new ServiceError(404, `No se encontró semana de entrenamiento con id ${semanaId}`);
  }
}

export async function listSesionesEntrenamientoBySemanaId(semanaId) {
  await assertSemanaEntrenamientoExists(semanaId);

  const result = await query(
    `SELECT *
     FROM sesion_entrenamiento
     WHERE semana_id = $1
     ORDER BY orden ASC, id ASC;`,
    [semanaId]
  );

  return result.rows;
}

export async function findSesionEntrenamientoById(id) {
  const result = await query('SELECT * FROM sesion_entrenamiento WHERE id = $1', [id]);
  return result.rows[0] ?? null;
}

export async function createSesionEntrenamiento(payload) {
  const {
    semana_id,
    orden,
    fecha_sesion,
    descripcion,
    observaciones,
    kilometros_planificados,
    kilometros_realizados,
    realizada,
  } = payload ?? {};

  if (!semana_id) {
    throw new ServiceError(400, 'El semana_id es requerido');
  }
  if (!orden || String(orden).trim() === '') {
    throw new ServiceError(400, 'El orden es requerido');
  }
  if (!descripcion || String(descripcion).trim() === '') {
    throw new ServiceError(400, 'La descripción es requerida');
  }
  if (!fecha_sesion) {
    throw new ServiceError(400, 'La fecha_sesion es requerida');
  }

  const sql = `
    INSERT INTO sesion_entrenamiento
    (semana_id, orden, fecha_sesion, descripcion, observaciones, kilometros_planificados, kilometros_realizados, realizada)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *;
  `;

  const params = [
    semana_id,
    String(orden).trim(),
    fecha_sesion,
    String(descripcion).trim(),
    observaciones ? String(observaciones).trim() : null,
    kilometros_planificados || null,
    kilometros_realizados || null,
    realizada === undefined ? false : Boolean(realizada),
  ];
  const result = await query(sql, params);
  return result.rows[0];
}

export async function updateSesionEntrenamiento(id, payload) {
  const {
    semana_id,
    orden,
    fecha_sesion,
    descripcion,
    observaciones,
    kilometros_planificados,
    kilometros_realizados,
    realizada,
  } = payload ?? {};

  const fields = [];
  const params = [];
  let idx = 1;

  if (semana_id !== undefined) {
    fields.push(`semana_id = $${idx++}`);
    params.push(semana_id);
  }
  if (orden !== undefined) {
    fields.push(`orden = $${idx++}`);
    params.push(String(orden).trim());
  }
  if (descripcion !== undefined) {
    fields.push(`descripcion = $${idx++}`);
    params.push(String(descripcion).trim());
  }
  if (observaciones !== undefined) {
    fields.push(`observaciones = $${idx++}`);
    params.push(observaciones === null ? null : String(observaciones).trim());
  }
  if (fecha_sesion !== undefined) {
    fields.push(`fecha_sesion = $${idx++}`);
    params.push(fecha_sesion);
  }
  if (kilometros_planificados !== undefined) {
    fields.push(`kilometros_planificados = $${idx++}`);
    params.push(kilometros_planificados);
  }
  if (kilometros_realizados !== undefined) {
    fields.push(`kilometros_realizados = $${idx++}`);
    params.push(kilometros_realizados);
  }
  if (realizada !== undefined) {
    fields.push(`realizada = $${idx++}`);
    params.push(Boolean(realizada));
  }

  if (fields.length === 0) {
    throw new ServiceError(400, 'No hay campos para actualizar');
  }

  params.push(id);
  const sql = `UPDATE sesion_entrenamiento SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *;`;
  const result = await query(sql, params);

  if (result.rows.length === 0) {
    throw new ServiceError(404, `No se encontró sesión de entrenamiento con id ${id}`);
  }

  return result.rows[0];
}

export async function deleteSesionEntrenamiento(id) {
  const result = await query('DELETE FROM sesion_entrenamiento WHERE id = $1 RETURNING *;', [id]);
  if (result.rows.length === 0) {
    throw new ServiceError(404, `No se encontró sesión de entrenamiento con id ${id}`);
  }
  return result.rows[0];
}
