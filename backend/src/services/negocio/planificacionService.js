import { query } from '../../config/db.js';
import { ServiceError } from '../serviceError.js';

const BUSINESS_TZ = 'Europe/Madrid';
const SQL_DIAS_HASTA_OBJETIVO = `(o.fecha_objetivo - (CURRENT_TIMESTAMP AT TIME ZONE '${BUSINESS_TZ}')::date)`;

function toIsoDateUTC(date) {
  return date.toISOString().slice(0, 10);
}

function normalizeDateInputToIsoDate(dateInput) {
  if (dateInput instanceof Date) {
    if (Number.isNaN(dateInput.getTime())) {
      throw new ServiceError(400, 'La fecha_inicio no es válida');
    }
    return toIsoDateUTC(dateInput);
  }

  const raw = String(dateInput ?? '');

  // Formato esperado de entrada del cliente.
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw;
  }

  // Permite normalizar timestamps ISO a fecha cuando provienen de integraciones externas.
  if (/^\d{4}-\d{2}-\d{2}T/.test(raw)) {
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) {
      throw new ServiceError(400, 'La fecha_inicio no es válida');
    }
    return toIsoDateUTC(parsed);
  }

  throw new ServiceError(400, 'La fecha_inicio debe tener formato YYYY-MM-DD');
}

function parseIsoDateOrThrow(dateStr) {
  const isoDate = normalizeDateInputToIsoDate(dateStr);
  const date = new Date(`${isoDate}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new ServiceError(400, 'La fecha_inicio no es válida');
  }

  return date;
}

function plusDaysISO(dateStr, days) {
  const base = parseIsoDateOrThrow(dateStr);
  base.setUTCDate(base.getUTCDate() + days);
  return toIsoDateUTC(base);
}

async function getContextoPlanificacionOrThrow(atletaId) {
  if (!atletaId || Number.isNaN(Number(atletaId))) {
    throw new ServiceError(400, 'El atletaId debe ser un número válido');
  }

  const atletaResult = await query('SELECT id, nombre FROM atleta WHERE id = $1', [atletaId]);
  if (atletaResult.rows.length === 0) {
    throw new ServiceError(404, `No se encontró atleta con id ${atletaId}`);
  }

  const objetivoResult = await query(
    `SELECT id, nombre, distancia_objetivo, marca_conseguida, fecha_objetivo
     FROM objetivo
     WHERE atleta_id = $1 AND activo = true
     ORDER BY id DESC
     LIMIT 1;`,
    [atletaId]
  );

  if (objetivoResult.rows.length === 0) {
    throw new ServiceError(409, 'El atleta no tiene un objetivo activo para planificar');
  }

  return {
    atleta: atletaResult.rows[0],
    objetivo: objetivoResult.rows[0],
  };
}

export async function getPlanificacionAtletaData(atletaId) {
  if (!atletaId || Number.isNaN(Number(atletaId))) {
    throw new ServiceError(400, 'El atletaId debe ser un número válido');
  }

  const result = await query(
    `WITH atleta_objetivo AS (
       SELECT
         a.id AS atleta_id,
         a.nombre AS atleta_nombre,
         o.id AS objetivo_id,
         o.nombre AS objetivo_nombre,
         o.distancia_objetivo,
         o.marca_conseguida,
         o.fecha_objetivo,
         ${SQL_DIAS_HASTA_OBJETIVO} AS dias_hasta_objetivo
       FROM atleta a
       LEFT JOIN objetivo o ON a.id = o.atleta_id AND o.activo = true
       WHERE a.id = $1
     ),
     semana_seleccionada AS (
       SELECT
         ao.atleta_id,
         ao.atleta_nombre,
         ao.objetivo_id,
         ao.objetivo_nombre,
         ao.distancia_objetivo,
         ao.marca_conseguida,
         ao.fecha_objetivo,
         ao.dias_hasta_objetivo,
         COALESCE(
           (
             SELECT s.id
             FROM semana_entrenamiento s
             WHERE s.objetivo_id = ao.objetivo_id
               AND CURRENT_DATE BETWEEN s.fecha_inicio AND s.fecha_fin
             LIMIT 1
           ),
           (
             SELECT s2.id
             FROM semana_entrenamiento s2
             WHERE s2.objetivo_id = ao.objetivo_id
               AND s2.fecha_inicio >= CURRENT_DATE
             ORDER BY s2.fecha_inicio ASC
             LIMIT 1
           )
         ) AS semana_id
       FROM atleta_objetivo ao
     ),
     sesiones_agg AS (
       SELECT
         ses.semana_id,
         COUNT(ses.id) AS total_sesiones,
         COALESCE(SUM(ses.kilometros_planificados), 0) AS km_planificados_semana,
         COALESCE(SUM(CASE WHEN ses.realizada = true THEN COALESCE(ses.kilometros_realizados, 0) ELSE 0 END), 0) AS km_realizados_semana
       FROM sesion_entrenamiento ses
       GROUP BY ses.semana_id
     )
     SELECT
       ss.atleta_id,
       ss.atleta_nombre,
       ss.objetivo_id,
       ss.objetivo_nombre,
      ss.distancia_objetivo,
      ss.marca_conseguida,
       ss.fecha_objetivo,
       ss.dias_hasta_objetivo,
       ss.semana_id,
       s.fecha_inicio AS semana_fecha_inicio,
       s.fecha_fin AS semana_fecha_fin,
       COALESCE(sa.total_sesiones, 0) AS total_sesiones,
       COALESCE(sa.km_planificados_semana, 0) AS km_planificados_semana,
       COALESCE(sa.km_realizados_semana, 0) AS km_realizados_semana,
       ses.id AS sesion_id,
       ses.orden,
      to_jsonb(ses)->>'observaciones' AS observaciones,
       ses.descripcion,
       ses.kilometros_planificados,
       ses.kilometros_realizados,
       ses.realizada,
       ses.fecha_realizada
     FROM semana_seleccionada ss
     LEFT JOIN semana_entrenamiento s ON s.id = ss.semana_id
     LEFT JOIN sesiones_agg sa ON sa.semana_id = s.id
     LEFT JOIN sesion_entrenamiento ses ON ses.semana_id = s.id
     ORDER BY
       CASE
         WHEN ses.orden ~ '^[0-9]+$' THEN ses.orden::int
         ELSE 999999
       END,
       ses.id;`,
    [atletaId]
  );

  if (result.rows.length === 0) {
    throw new ServiceError(404, `No se encontró atleta con id ${atletaId}`);
  }

  const rowPrincipal = result.rows[0];
  const sesiones = result.rows
    .filter((row) => row.sesion_id !== null)
    .map((row) => ({
      id: row.sesion_id,
      orden: row.orden,
      descripcion: row.descripcion,
      observaciones: row.observaciones,
      kilometros_planificados: row.kilometros_planificados !== null ? Number(row.kilometros_planificados) : null,
      kilometros_realizados: row.kilometros_realizados !== null ? Number(row.kilometros_realizados) : null,
      realizada: row.realizada,
      fecha_realizada: row.fecha_realizada,
    }));

  return {
    atleta: {
      id: rowPrincipal.atleta_id,
      nombre: rowPrincipal.atleta_nombre,
    },
    objetivo: rowPrincipal.objetivo_id
      ? {
          id: rowPrincipal.objetivo_id,
          nombre: rowPrincipal.objetivo_nombre,
          distancia_objetivo: rowPrincipal.distancia_objetivo || null,
          marca_conseguida: rowPrincipal.marca_conseguida || null,
          fecha_objetivo: rowPrincipal.fecha_objetivo,
          dias_hasta_objetivo: Number(rowPrincipal.dias_hasta_objetivo),
        }
      : null,
    semana: rowPrincipal.semana_id
      ? {
          id: rowPrincipal.semana_id,
          fecha_inicio: rowPrincipal.semana_fecha_inicio,
          fecha_fin: rowPrincipal.semana_fecha_fin,
          total_sesiones: Number(rowPrincipal.total_sesiones),
          km_planificados_semana: Number(rowPrincipal.km_planificados_semana),
          km_realizados_semana: Number(rowPrincipal.km_realizados_semana),
        }
      : null,
    sesiones,
  };
}

export async function getPropuestaNuevaSemanaData(atletaId) {
  const { atleta, objetivo } = await getContextoPlanificacionOrThrow(atletaId);

  const ultimaSemanaResult = await query(
    `SELECT id, fecha_inicio, fecha_fin
     FROM semana_entrenamiento
     WHERE objetivo_id = $1
     ORDER BY fecha_fin DESC, id DESC
     LIMIT 1;`,
    [objetivo.id]
  );

  let fecha_inicio_sugerida;
  let fuente_sugerencia;

  if (ultimaSemanaResult.rows.length > 0) {
    fecha_inicio_sugerida = plusDaysISO(normalizeDateInputToIsoDate(ultimaSemanaResult.rows[0].fecha_fin), 1);
    fuente_sugerencia = 'dia_siguiente_ultima_semana';
  } else {
    fecha_inicio_sugerida = toIsoDateUTC(new Date());
    fuente_sugerencia = 'fecha_actual';
  }

  const fecha_fin_calculada = plusDaysISO(fecha_inicio_sugerida, 6);

  return {
    atleta: {
      id: atleta.id,
      nombre: atleta.nombre,
    },
    objetivo: {
      id: objetivo.id,
      nombre: objetivo.nombre,
      distancia_objetivo: objetivo.distancia_objetivo || null,
      marca_conseguida: objetivo.marca_conseguida || null,
      fecha_objetivo: objetivo.fecha_objetivo,
    },
    propuesta: {
      fecha_inicio_sugerida,
      fecha_fin_calculada,
      fuente_sugerencia,
    },
  };
}

export async function createSemanaDesdePlanificacionData({ atletaId, fecha_inicio, fecha_fin: fecha_fin_input }) {
  if (fecha_fin_input !== undefined) {
    throw new ServiceError(400, 'No se permite informar fecha_fin; se calcula automáticamente desde fecha_inicio');
  }

  const { atleta, objetivo } = await getContextoPlanificacionOrThrow(atletaId);
  const fechaInicio = parseIsoDateOrThrow(fecha_inicio);
  const fecha_inicio_normalizada = toIsoDateUTC(fechaInicio);
  const fecha_fin = plusDaysISO(fecha_inicio_normalizada, 6);

  let insertResult;
  try {
    insertResult = await query(
      `INSERT INTO semana_entrenamiento (objetivo_id, fecha_inicio, fecha_fin)
       VALUES ($1, $2, $3)
       RETURNING *;`,
      [objetivo.id, fecha_inicio_normalizada, fecha_fin]
    );
  } catch (error) {
    // PostgreSQL EXCLUDE constraint: no_solapamiento_fechas
    if (error.code === '23P01') {
      throw new ServiceError(409, 'La semana propuesta se solapa con una semana existente');
    }
    throw error;
  }

  return {
    atleta: {
      id: atleta.id,
      nombre: atleta.nombre,
    },
    objetivo: {
      id: objetivo.id,
      nombre: objetivo.nombre,
      marca_conseguida: objetivo.marca_conseguida || null,
      fecha_objetivo: objetivo.fecha_objetivo,
    },
    semana: insertResult.rows[0],
  };
}

function parseRequiredNonNegativeNumber(value, fieldName) {
  if (value === undefined || value === null || String(value).trim() === '') {
    throw new ServiceError(400, `El campo ${fieldName} es requerido`);
  }

  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new ServiceError(400, `El campo ${fieldName} debe ser numérico`);
  }
  if (parsed < 0) {
    throw new ServiceError(400, `El campo ${fieldName} no puede ser negativo`);
  }

  return parsed;
}

async function getSemanaDelAtletaOrThrow({ atletaId, semanaId }) {
  if (!semanaId || Number.isNaN(Number(semanaId))) {
    throw new ServiceError(400, 'El semanaId debe ser un número válido');
  }

  const result = await query(
    `SELECT
       s.id,
       s.objetivo_id,
       s.fecha_inicio,
       s.fecha_fin,
       o.atleta_id
     FROM semana_entrenamiento s
     INNER JOIN objetivo o ON o.id = s.objetivo_id
     WHERE s.id = $1
     LIMIT 1;`,
    [semanaId]
  );

  if (result.rows.length === 0) {
    throw new ServiceError(404, `No se encontró semana con id ${semanaId}`);
  }

  const semana = result.rows[0];
  if (Number(semana.atleta_id) !== Number(atletaId)) {
    throw new ServiceError(409, 'La semana seleccionada no pertenece al atleta indicado');
  }

  return semana;
}

function calculateFechaSesionISO({ fechaInicio, fechaFin, ordenNumerico }) {
  const inicio = parseIsoDateOrThrow(fechaInicio);
  const fin = parseIsoDateOrThrow(fechaFin);
  const diffMs = fin.getTime() - inicio.getTime();
  const totalDias = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  const desplazamiento = Math.max(0, Math.min(ordenNumerico - 1, totalDias));

  inicio.setUTCDate(inicio.getUTCDate() + desplazamiento);
  return toIsoDateUTC(inicio);
}

async function getSesionEntrenamientoSchemaCapabilities() {
  const result = await query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'sesion_entrenamiento';`
  );

  const names = new Set(result.rows.map((row) => row.column_name));
  return {
    hasObservaciones: names.has('observaciones'),
    hasFechaSesion: names.has('fecha_sesion'),
  };
}

export async function createSesionSemanaDesdePlanificacionData({
  atletaId,
  semanaId,
  descripcion,
  observaciones,
  kilometros_planificados,
}) {
  const { atleta } = await getContextoPlanificacionOrThrow(atletaId);
  const semana = await getSemanaDelAtletaOrThrow({ atletaId, semanaId });

  const descripcionNormalizada = String(descripcion ?? '').trim();
  if (!descripcionNormalizada) {
    throw new ServiceError(400, 'La descripción es requerida');
  }

  const observacionesNormalizadas = String(observaciones ?? '').trim() || null;
  const kmPlanificados = parseRequiredNonNegativeNumber(kilometros_planificados, 'kilometros_planificados');

  const siguienteOrdenResult = await query(
    `SELECT
       (
         COALESCE(
           MAX(
             CASE
               WHEN orden ~ '^[0-9]+$' THEN orden::integer
               ELSE 0
             END
           ),
           0
         ) + 1
       ) AS siguiente_orden
     FROM sesion_entrenamiento
     WHERE semana_id = $1;`,
    [semana.id]
  );

  const siguienteOrden = Number(siguienteOrdenResult.rows[0]?.siguiente_orden ?? 1);
  const fechaSesion = calculateFechaSesionISO({
    fechaInicio: semana.fecha_inicio,
    fechaFin: semana.fecha_fin,
    ordenNumerico: siguienteOrden,
  });

  const capabilities = await getSesionEntrenamientoSchemaCapabilities();
  const columns = ['semana_id', 'orden', 'descripcion', 'kilometros_planificados'];
  const values = [semana.id, String(siguienteOrden), descripcionNormalizada, kmPlanificados];

  if (capabilities.hasObservaciones) {
    columns.push('observaciones');
    values.push(observacionesNormalizadas);
  }

  if (capabilities.hasFechaSesion) {
    columns.push('fecha_sesion');
    values.push(fechaSesion);
  }

  const placeholders = values.map((_, index) => `$${index + 1}`);

  let insertResult;
  try {
    insertResult = await query(
      `INSERT INTO sesion_entrenamiento
       (${columns.join(', ')})
       VALUES (${placeholders.join(', ')})
       RETURNING *;`,
      values
    );
  } catch (error) {
    if (error.code === '23505') {
      throw new ServiceError(409, 'No se pudo asignar el orden de la sesión. Inténtalo nuevamente');
    }
    throw error;
  }

  return {
    atleta: {
      id: atleta.id,
      nombre: atleta.nombre,
    },
    semana: {
      id: semana.id,
      fecha_inicio: semana.fecha_inicio,
      fecha_fin: semana.fecha_fin,
    },
    sesion: insertResult.rows[0],
  };
}

async function getSesionDeSemanaOrThrow({ semanaId, sesionId }) {
  if (!sesionId || Number.isNaN(Number(sesionId))) {
    throw new ServiceError(400, 'El sesionId debe ser un número válido');
  }

  const result = await query(
    `SELECT id, semana_id, kilometros_planificados
     FROM sesion_entrenamiento
     WHERE id = $1
     LIMIT 1;`,
    [sesionId]
  );

  if (result.rows.length === 0) {
    throw new ServiceError(404, `No se encontró sesión con id ${sesionId}`);
  }

  const sesion = result.rows[0];
  if (Number(sesion.semana_id) !== Number(semanaId)) {
    throw new ServiceError(409, 'La sesión no pertenece a la semana seleccionada');
  }

  return sesion;
}

function parseOptionalNonNegativeNumber(value, fieldName) {
  if (value === undefined || value === null || String(value).trim() === '') {
    return null;
  }

  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new ServiceError(400, `El campo ${fieldName} debe ser numérico`);
  }
  if (parsed < 0) {
    throw new ServiceError(400, `El campo ${fieldName} no puede ser negativo`);
  }

  return parsed;
}

export async function registrarResultadoSesionDesdePlanificacionData({
  atletaId,
  semanaId,
  sesionId,
  realizado_segun_planificacion,
  kilometros_realizados,
}) {
  await getContextoPlanificacionOrThrow(atletaId);
  await getSemanaDelAtletaOrThrow({ atletaId, semanaId });
  const sesion = await getSesionDeSemanaOrThrow({ semanaId, sesionId });

  const marcadoSegunPlan = Boolean(realizado_segun_planificacion);
  const kmPlanificados = sesion.kilometros_planificados !== null
    ? Number(sesion.kilometros_planificados)
    : null;

  let kmRealizadosFinal = null;
  if (marcadoSegunPlan) {
    if (kmPlanificados === null) {
      throw new ServiceError(409, 'No se puede marcar según planificación sin kilómetros planificados');
    }
    kmRealizadosFinal = kmPlanificados;
  } else {
    kmRealizadosFinal = parseOptionalNonNegativeNumber(kilometros_realizados, 'kilometros_realizados');
  }

  const result = await query(
    `UPDATE sesion_entrenamiento
     SET kilometros_realizados = $1,
         realizada = $2
     WHERE id = $3
     RETURNING *;`,
    [kmRealizadosFinal, kmRealizadosFinal !== null, sesion.id]
  );

  return {
    sesion: result.rows[0],
    regla_aplicada: marcadoSegunPlan ? 'segun_planificacion' : 'registro_manual',
  };
}

function parseMarcaConseguidaOrThrow(marcaConseguida) {
  const marcaNormalizada = String(marcaConseguida ?? '').trim();
  if (!marcaNormalizada) {
    throw new ServiceError(400, 'La marca_conseguida es requerida');
  }
  if (marcaNormalizada.length > 120) {
    throw new ServiceError(400, 'La marca_conseguida no puede superar 120 caracteres');
  }

  return marcaNormalizada;
}

export async function registrarMarcaObjetivoDesdePlanificacionData({ atletaId, objetivoId, marca_conseguida }) {
  if (!objetivoId || Number.isNaN(Number(objetivoId))) {
    throw new ServiceError(400, 'El objetivoId debe ser un número válido');
  }

  const marcaNormalizada = parseMarcaConseguidaOrThrow(marca_conseguida);

  const objetivoResult = await query(
    `SELECT
       o.id,
       o.atleta_id,
       o.activo,
       o.fecha_objetivo,
       (o.fecha_objetivo - (CURRENT_TIMESTAMP AT TIME ZONE '${BUSINESS_TZ}')::date) AS dias_hasta_objetivo,
       o.marca_conseguida
     FROM objetivo o
     WHERE o.id = $1
     LIMIT 1;`,
    [objetivoId]
  );

  if (objetivoResult.rows.length === 0) {
    throw new ServiceError(404, `No se encontró objetivo con id ${objetivoId}`);
  }

  const objetivo = objetivoResult.rows[0];
  if (Number(objetivo.atleta_id) !== Number(atletaId)) {
    throw new ServiceError(409, 'El objetivo seleccionado no pertenece al atleta indicado');
  }

  const diasRestantes = Number(objetivo.dias_hasta_objetivo);
  if (diasRestantes > 0) {
    throw new ServiceError(409, 'La marca solo se puede registrar cuando quedan 0 o menos días');
  }

  // Regla de negocio: registrar marca cierra el objetivo automáticamente.
  const updateResult = await query(
    `UPDATE objetivo
     SET marca_conseguida = $1,
         activo = false,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $2
     RETURNING id, atleta_id, nombre, distancia_objetivo, marca_conseguida, fecha_objetivo, activo, updated_at;`,
    [marcaNormalizada, objetivo.id]
  );

  return {
    objetivo: updateResult.rows[0],
    dias_hasta_objetivo: diasRestantes,
    regla_aplicada: 'registro_marca_cierra_objetivo',
  };
}
