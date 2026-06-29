import { query } from '../../config/db.js';
import { ServiceError } from '../serviceError.js';

export async function listAtletas() {
  const result = await query('SELECT * FROM atleta ORDER BY id');
  return result.rows;
}

export async function findAtletaById(id) {
  const result = await query('SELECT * FROM atleta WHERE id = $1', [id]);
  return result.rows[0] ?? null;
}

export async function createAtleta(payload) {
  const {
    nombre,
    usuario_id,
    sexo,
    peso,
    dias_disponibles,
    km_medios_ultimos_2_meses,
    lesiones_ultimo_anio,
  } = payload;

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

  const sql = `
    INSERT INTO atleta
    (nombre, usuario_id, sexo, peso, dias_disponibles, km_medios_ultimos_2_meses, lesiones_ultimo_anio)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *;
  `;

  const params = [
    String(nombre).trim(),
    usuario_id || null,
    sexo || null,
    peso || null,
    dias_disponibles ? JSON.stringify(dias_disponibles) : '[]',
    km_medios_ultimos_2_meses || null,
    lesiones_ultimo_anio ? JSON.stringify(lesiones_ultimo_anio) : '[]',
  ];

  const result = await query(sql, params);
  return result.rows[0];
}

export async function updateAtleta(id, payload) {
  const {
    nombre,
    usuario_id,
    sexo,
    peso,
    dias_disponibles,
    km_medios_ultimos_2_meses,
    lesiones_ultimo_anio,
  } = payload;

  if (nombre !== undefined && (nombre === null || String(nombre).trim() === '')) {
    throw new ServiceError(400, 'El nombre del atleta no puede estar vacío');
  }

  const sexosValidos = ['M', 'F', 'OTRO'];
  if (sexo !== undefined && sexo !== null && !sexosValidos.includes(sexo)) {
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
    fields.push(`usuario_id = $${idx++}`);
    params.push(usuario_id);
  }
  if (sexo !== undefined) {
    fields.push(`sexo = $${idx++}`);
    params.push(sexo);
  }
  if (peso !== undefined) {
    fields.push(`peso = $${idx++}`);
    params.push(peso);
  }
  if (dias_disponibles !== undefined) {
    fields.push(`dias_disponibles = $${idx++}`);
    params.push(JSON.stringify(dias_disponibles));
  }
  if (km_medios_ultimos_2_meses !== undefined) {
    fields.push(`km_medios_ultimos_2_meses = $${idx++}`);
    params.push(km_medios_ultimos_2_meses);
  }
  if (lesiones_ultimo_anio !== undefined) {
    fields.push(`lesiones_ultimo_anio = $${idx++}`);
    params.push(JSON.stringify(lesiones_ultimo_anio));
  }

  if (fields.length === 0) {
    throw new ServiceError(400, 'No hay campos para actualizar');
  }

  params.push(id);
  const sql = `UPDATE atleta SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${idx} RETURNING *;`;
  const result = await query(sql, params);

  if (result.rows.length === 0) {
    throw new ServiceError(404, `No se encontró atleta con id ${id}`);
  }

  return result.rows[0];
}

export async function deleteAtleta(id) {
  const result = await query('DELETE FROM atleta WHERE id = $1 RETURNING *;', [id]);
  if (result.rows.length === 0) {
    throw new ServiceError(404, `No se encontró atleta con id ${id}`);
  }
  return result.rows[0];
}
