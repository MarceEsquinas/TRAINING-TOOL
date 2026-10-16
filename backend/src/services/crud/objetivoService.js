import { query } from '../../config/db.js';
import { ServiceError } from '../serviceError.js';

const DISTANCIAS_OBJETIVO_PREDEFINIDAS = [
  '5K',
  '10K',
  'Media Maratón',
  'Maratón',
  'Trail',
  'Ultra Trail',
];

function normalizarDistanciaObjetivo(payload, { required = false } = {}) {
  const distanciaObjetivo = payload?.distancia_objetivo;
  const distanciaObjetivoManual = payload?.distancia_objetivo_manual;

  if (distanciaObjetivo === undefined && distanciaObjetivoManual === undefined) {
    if (required) {
      throw new ServiceError(400, 'La distancia_objetivo es requerida');
    }
    return undefined;
  }

  const valorPrincipal = distanciaObjetivo === undefined || distanciaObjetivo === null
    ? ''
    : String(distanciaObjetivo).trim();
  const valorManual = distanciaObjetivoManual === undefined || distanciaObjetivoManual === null
    ? ''
    : String(distanciaObjetivoManual).trim();

  if (valorPrincipal === '' && valorManual === '') {
    if (required) {
      throw new ServiceError(400, 'La distancia_objetivo es requerida');
    }
    return null;
  }

  if (DISTANCIAS_OBJETIVO_PREDEFINIDAS.includes(valorPrincipal)) {
    return valorPrincipal;
  }

  if (valorPrincipal.toLowerCase() === 'otro') {
    if (valorManual === '') {
      throw new ServiceError(400, 'La distancia_objetivo_manual es requerida cuando distancia_objetivo es Otro');
    }
    return valorManual;
  }

  if (valorManual !== '') {
    return valorManual;
  }

  return valorPrincipal;
}

// atletaId opcional: si llega, solo se devuelven los objetivos de ese atleta.
export async function listObjetivos(atletaId = null) {
  const result = await query(
    'SELECT * FROM objetivo WHERE ($1::int IS NULL OR atleta_id = $1) ORDER BY id',
    [atletaId]
  );
  return result.rows;
}

export async function findObjetivoById(id, atletaId = null) {
  const result = await query(
    'SELECT * FROM objetivo WHERE id = $1 AND ($2::int IS NULL OR atleta_id = $2)',
    [id, atletaId]
  );
  return result.rows[0] ?? null;
}

// Decide para qué atleta se crea el objetivo según el rol; nunca confía en el body para el ATLETA.
async function resolverAtletaDestino(user, atletaIdBody) {
  if (user?.rol === 'ATLETA') {
    return Number(user.atletaId);
  }

  if (user?.rol !== 'ENTRENADOR') {
    throw new ServiceError(403, 'Tu rol no puede crear objetivos');
  }

  if (!atletaIdBody || Number.isNaN(Number(atletaIdBody))) {
    throw new ServiceError(400, 'El atleta_id es requerido para el objetivo');
  }

  // Pertenencia: el atleta debe estar asignado a este entrenador (se resuelve por BD, no por token).
  const result = await query(
    `SELECT a.id
     FROM atleta a
     JOIN entrenadores e ON e.id = a.entrenador_id
     WHERE a.id = $1 AND e.usuario_id = $2`,
    [Number(atletaIdBody), user.id]
  );
  if (result.rows.length === 0) {
    throw new ServiceError(403, 'El atleta no está asignado a tu usuario');
  }
  return result.rows[0].id;
}

export async function createObjetivo(payload, user) {
  const { nombre, fecha_objetivo } = payload;
  const distanciaObjetivo = normalizarDistanciaObjetivo(payload, { required: true });

  if (!nombre || String(nombre).trim() === '') {
    throw new ServiceError(400, 'El nombre del objetivo es requerido');
  }

  const atleta_id = await resolverAtletaDestino(user, payload.atleta_id);

  if (!fecha_objetivo) {
    throw new ServiceError(400, 'La fecha_objetivo es requerida');
  }

  const sql = `
    INSERT INTO objetivo
    (nombre, atleta_id, distancia_objetivo, fecha_objetivo, activo)
    VALUES ($1, $2, $3, $4, true)
    RETURNING *;
  `;

  const params = [String(nombre).trim(), atleta_id, distanciaObjetivo, fecha_objetivo];

  try {
    const result = await query(sql, params);
    return result.rows[0];
  } catch (error) {
    // Índice único parcial idx_objetivo_activo_por_atleta.
    if (error.code === '23505') {
      throw new ServiceError(409, 'El atleta ya tiene un objetivo activo');
    }
    throw error;
  }
}

export async function updateObjetivo(id, payload) {
  const { nombre, fecha_objetivo } = payload;
  const distanciaObjetivo = normalizarDistanciaObjetivo(payload);

  // Estado y dueño no se editan aquí: activo cambia solo al crear/finalizar.
  if (payload.activo !== undefined || payload.atleta_id !== undefined || payload.marca_conseguida !== undefined) {
    throw new ServiceError(400, 'No se puede modificar activo, atleta_id ni marca_conseguida desde este endpoint');
  }

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
  if (distanciaObjetivo !== undefined) {
    fields.push(`distancia_objetivo = $${idx++}`);
    params.push(distanciaObjetivo);
  }
  if (fecha_objetivo !== undefined) {
    fields.push(`fecha_objetivo = $${idx++}`);
    params.push(fecha_objetivo);
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
