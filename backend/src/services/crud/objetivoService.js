import { query } from '../../config/db.js';
import { ServiceError } from '../serviceError.js';

export async function listObjetivos() {
  const result = await query('SELECT * FROM objetivo ORDER BY id');
  return result.rows;
}

export async function findObjetivoById(id) {
  const result = await query('SELECT * FROM objetivo WHERE id = $1', [id]);
  return result.rows[0] ?? null;
}

export async function createObjetivo(payload) {
  const { nombre, atleta_id, fecha_objetivo, activo } = payload;

  if (!nombre || String(nombre).trim() === '') {
    throw new ServiceError(400, 'El nombre del objetivo es requerido');
  }

  if (!atleta_id) {
    throw new ServiceError(400, 'El atleta_id es requerido para el objetivo');
  }

  if (!fecha_objetivo) {
    throw new ServiceError(400, 'La fecha_objetivo es requerida');
  }

  const sql = `
    INSERT INTO objetivo
    (nombre, atleta_id, fecha_objetivo, activo)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;

  const params = [String(nombre).trim(), atleta_id, fecha_objetivo, activo === undefined ? false : activo];
  const result = await query(sql, params);
  return result.rows[0];
}

export async function updateObjetivo(id, payload) {
  const { nombre, atleta_id, fecha_objetivo, activo } = payload;

  if (nombre !== undefined && String(nombre).trim() === '') {
    throw new ServiceError(400, 'El nombre del objetivo no puede estar vacío');
  }

  const fields = [];
  const params = [];
  let idx = 1;

  if (nombre !== undefined) {
    fields.push(`nombre = $${idx++}`);
    params.push(String(nombre).trim());
  }
  if (atleta_id !== undefined) {
    fields.push(`atleta_id = $${idx++}`);
    params.push(atleta_id);
  }
  if (fecha_objetivo !== undefined) {
    fields.push(`fecha_objetivo = $${idx++}`);
    params.push(fecha_objetivo);
  }
  if (activo !== undefined) {
    fields.push(`activo = $${idx++}`);
    params.push(activo);
  }

  if (fields.length === 0) {
    throw new ServiceError(400, 'No hay campos para actualizar');
  }

  params.push(id);
  const sql = `UPDATE objetivo SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${idx} RETURNING *;`;
  const result = await query(sql, params);

  if (result.rows.length === 0) {
    throw new ServiceError(404, `No se encontró objetivo con id ${id}`);
  }

  return result.rows[0];
}

export async function deleteObjetivo(id) {
  const result = await query('DELETE FROM objetivo WHERE id = $1 RETURNING *;', [id]);
  if (result.rows.length === 0) {
    throw new ServiceError(404, `No se encontró objetivo con id ${id}`);
  }
  return result.rows[0];
}
