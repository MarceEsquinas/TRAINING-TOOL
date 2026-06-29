import { query } from '../../config/db.js';
import { ServiceError } from '../serviceError.js';

export async function listFeedback() {
  const result = await query('SELECT * FROM feedback_semanal ORDER BY id');
  return result.rows;
}

export async function findFeedbackById(id) {
  const result = await query('SELECT * FROM feedback_semanal WHERE id = $1', [id]);
  return result.rows[0] ?? null;
}

export async function createFeedback(payload) {
  const { semana_id, completada = true, motivo_no_completada, sensaciones, molestias, ritmo_rodaje } = payload;

  if (!semana_id) {
    throw new ServiceError(400, 'El campo semana_id es requerido');
  }

  if (completada === false && (!motivo_no_completada || String(motivo_no_completada).trim() === '')) {
    throw new ServiceError(400, 'motivo_no_completada es requerido cuando completada es false');
  }

  const sql = `
    INSERT INTO feedback_semanal
    (semana_id, completada, motivo_no_completada, sensaciones, molestias, ritmo_rodaje)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *;
  `;

  const params = [
    semana_id,
    completada,
    motivo_no_completada || null,
    sensaciones || null,
    molestias || null,
    ritmo_rodaje || null,
  ];

  const result = await query(sql, params);
  return result.rows[0];
}

export async function updateFeedback(id, payload) {
  const { semana_id, completada, motivo_no_completada, sensaciones, molestias, ritmo_rodaje } = payload;

  if (completada === false && (!motivo_no_completada || String(motivo_no_completada).trim() === '')) {
    throw new ServiceError(400, 'motivo_no_completada es requerido cuando completada es false');
  }

  const fields = [];
  const params = [];
  let idx = 1;

  if (semana_id !== undefined) {
    fields.push(`semana_id = $${idx++}`);
    params.push(semana_id);
  }
  if (completada !== undefined) {
    fields.push(`completada = $${idx++}`);
    params.push(completada);
  }
  if (motivo_no_completada !== undefined) {
    fields.push(`motivo_no_completada = $${idx++}`);
    params.push(motivo_no_completada || null);
  }
  if (sensaciones !== undefined) {
    fields.push(`sensaciones = $${idx++}`);
    params.push(sensaciones || null);
  }
  if (molestias !== undefined) {
    fields.push(`molestias = $${idx++}`);
    params.push(molestias || null);
  }
  if (ritmo_rodaje !== undefined) {
    fields.push(`ritmo_rodaje = $${idx++}`);
    params.push(ritmo_rodaje || null);
  }

  if (fields.length === 0) {
    throw new ServiceError(400, 'No hay campos para actualizar');
  }

  params.push(id);
  const sql = `UPDATE feedback_semanal SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *;`;
  const result = await query(sql, params);

  if (result.rows.length === 0) {
    throw new ServiceError(404, `No se encontró feedback con id ${id}`);
  }

  return result.rows[0];
}

export async function deleteFeedback(id) {
  const result = await query('DELETE FROM feedback_semanal WHERE id = $1 RETURNING *;', [id]);
  if (result.rows.length === 0) {
    throw new ServiceError(404, `No se encontró feedback con id ${id}`);
  }
  return result.rows[0];
}
