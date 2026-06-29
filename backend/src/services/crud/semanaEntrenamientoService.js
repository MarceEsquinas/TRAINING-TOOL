import { query } from '../../config/db.js';
import { ServiceError } from '../serviceError.js';

export async function listSemanasEntrenamiento() {
  const result = await query('SELECT * FROM semana_entrenamiento ORDER BY id');
  return result.rows;
}

export async function findSemanaEntrenamientoById(id) {
  const result = await query('SELECT * FROM semana_entrenamiento WHERE id = $1', [id]);
  return result.rows[0] ?? null;
}

export async function createSemanaEntrenamiento(payload) {
  const { objetivo_id, fecha_inicio, fecha_fin } = payload;

  if (!objetivo_id) {
    throw new ServiceError(400, 'El objetivo_id es requerido');
  }
  if (!fecha_inicio) {
    throw new ServiceError(400, 'La fecha_inicio es requerida');
  }
  if (!fecha_fin) {
    throw new ServiceError(400, 'La fecha_fin es requerida');
  }

  const sql = `
    INSERT INTO semana_entrenamiento
    (objetivo_id, fecha_inicio, fecha_fin)
    VALUES ($1, $2, $3)
    RETURNING *;
  `;

  const result = await query(sql, [objetivo_id, fecha_inicio, fecha_fin]);
  return result.rows[0];
}

export async function updateSemanaEntrenamiento(id, payload) {
  const { objetivo_id, fecha_inicio, fecha_fin } = payload;

  const fields = [];
  const params = [];
  let idx = 1;

  if (objetivo_id !== undefined) {
    fields.push(`objetivo_id = $${idx++}`);
    params.push(objetivo_id);
  }
  if (fecha_inicio !== undefined) {
    fields.push(`fecha_inicio = $${idx++}`);
    params.push(fecha_inicio);
  }
  if (fecha_fin !== undefined) {
    fields.push(`fecha_fin = $${idx++}`);
    params.push(fecha_fin);
  }

  if (fields.length === 0) {
    throw new ServiceError(400, 'No hay campos para actualizar');
  }

  params.push(id);
  const sql = `UPDATE semana_entrenamiento SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *;`;
  const result = await query(sql, params);

  if (result.rows.length === 0) {
    throw new ServiceError(404, `No se encontró semana de entrenamiento con id ${id}`);
  }

  return result.rows[0];
}

export async function deleteSemanaEntrenamiento(id) {
  const result = await query('DELETE FROM semana_entrenamiento WHERE id = $1 RETURNING *;', [id]);
  if (result.rows.length === 0) {
    throw new ServiceError(404, `No se encontró semana de entrenamiento con id ${id}`);
  }
  return result.rows[0];
}
