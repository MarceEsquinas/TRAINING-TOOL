import { query } from '../../config/db.js';
import { ServiceError } from '../serviceError.js';

async function hasFeedbackLeidoColumn() {
  const result = await query(
    `SELECT 1
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'feedback_semanal'
       AND column_name = 'leido'
     LIMIT 1;`
  );

  return result.rows.length > 0;
}

function esNumeroValido(valor) {
  return valor && !Number.isNaN(Number(valor));
}

// Servicio para obtener un atleta por su id.
export async function getAtletaById(atletaId) {
  return query(
    `SELECT a.id, a.nombre
     FROM atleta a
     WHERE a.id = $1;`,
    [atletaId]
  );
}

// Servicio para obtener un objetivo por su id.
export async function getObjetivoById(objetivoId) {
  return query(
    `SELECT o.id, o.atleta_id, o.nombre, o.distancia_objetivo, o.fecha_objetivo, o.activo
     FROM objetivo o
     WHERE o.id = $1;`,
    [objetivoId]
  );
}

// Servicio para obtener el historial de objetivos de un atleta.
export async function getHistorialObjetivosByAtletaId(atletaId) {
  return query(
    `SELECT
       o.id AS objetivo_id,
       o.nombre AS nombre_objetivo,
       o.distancia_objetivo,
       o.marca_conseguida,
       o.fecha_objetivo,
       CASE
         WHEN o.activo = true THEN 'activo'
         WHEN o.fecha_objetivo < CURRENT_DATE THEN 'finalizado'
         ELSE 'inactivo'
       END AS estado
     FROM objetivo o
     WHERE o.atleta_id = $1
     ORDER BY o.fecha_objetivo DESC, o.id DESC;`,
    [atletaId]
  );
}

// Servicio para obtener el historial de planificación de un objetivo (kilómetros realizados).
// total_sesiones se añadió para que planificacionService pueda reutilizar esta misma consulta
// al listar semanas (evita duplicar la lógica de agregación km/sesiones por semana).
export async function getHistorialPlanificacionByObjetivoId(objetivoId) {
  return query(
    `SELECT
       s.id AS semana_id,
       s.fecha_inicio,
       s.fecha_fin,
       COUNT(ses.id) AS total_sesiones,
       COALESCE(SUM(COALESCE(ses.kilometros_realizados, 0)), 0) AS kilometros_realizados,
       COALESCE(SUM(COALESCE(ses.kilometros_planificados, 0)), 0) AS kilometros_planificados
     FROM semana_entrenamiento s
     LEFT JOIN sesion_entrenamiento ses ON ses.semana_id = s.id
     WHERE s.objetivo_id = $1
     GROUP BY s.id, s.fecha_inicio, s.fecha_fin
     ORDER BY s.fecha_inicio ASC, s.id ASC;`,
    [objetivoId]
  );
}

// Servicio para obtener el historial resumido de feedback de un atleta.
export async function getHistorialFeedbackResumenByAtletaId(atletaId) {
  return query(
    `SELECT
       f.id AS feedback_id,
       f.created_at::date AS fecha_feedback,
       f.completada,
       COALESCE(
         LEFT(COALESCE(to_jsonb(f)->>'comentario', f.sensaciones, f.molestias, f.motivo_no_completada, 'Sin resumen'), 180)
       ) AS resumen_corto,
       f.semana_id,
       s.fecha_inicio AS semana_fecha_inicio,
       s.fecha_fin AS semana_fecha_fin,
       o.id AS objetivo_id,
       o.nombre AS objetivo_nombre
     FROM feedback_semanal f
     JOIN semana_entrenamiento s ON s.id = f.semana_id
     JOIN objetivo o ON o.id = s.objetivo_id
     WHERE o.atleta_id = $1
     ORDER BY f.created_at DESC, f.id DESC;`,
    [atletaId]
  );
}

// Servicio para obtener el detalle completo de un feedback.
export async function getDetalleFeedbackById(feedbackId) {
  const hasLeido = await hasFeedbackLeidoColumn();

  if (hasLeido) {
    return query(
      // Regla de negocio: abrir detalle equivale a lectura del feedback.
      `WITH feedback_marcado AS (
         UPDATE feedback_semanal
         SET leido = true,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING *
       )
       SELECT
         f.id,
         f.semana_id,
         f.leido,
         f.completada,
         f.motivo_no_completada,
         f.sensaciones,
         f.molestias,
         f.ritmo_rodaje,
         f.ritmo_rodaje AS ritmo_medio,
         to_jsonb(f)->>'comentario' AS comentario,
         f.created_at,
         f.updated_at,
         s.fecha_inicio AS semana_fecha_inicio,
         s.fecha_fin AS semana_fecha_fin,
         o.id AS objetivo_id,
         o.nombre AS objetivo_nombre,
         o.fecha_objetivo,
         a.id AS atleta_id,
         a.nombre AS atleta_nombre
       FROM feedback_marcado f
       JOIN semana_entrenamiento s ON s.id = f.semana_id
       JOIN objetivo o ON o.id = s.objetivo_id
       JOIN atleta a ON a.id = o.atleta_id
       ;`,
      [feedbackId]
    );
  }

  return query(
    `SELECT
       f.id,
       f.semana_id,
       false AS leido,
       f.completada,
       f.motivo_no_completada,
       f.sensaciones,
       f.molestias,
       f.ritmo_rodaje,
       f.ritmo_rodaje AS ritmo_medio,
       to_jsonb(f)->>'comentario' AS comentario,
       f.created_at,
       f.updated_at,
       s.fecha_inicio AS semana_fecha_inicio,
       s.fecha_fin AS semana_fecha_fin,
       o.id AS objetivo_id,
       o.nombre AS objetivo_nombre,
       o.fecha_objetivo,
       a.id AS atleta_id,
       a.nombre AS atleta_nombre
     FROM feedback_semanal f
     JOIN semana_entrenamiento s ON s.id = f.semana_id
     JOIN objetivo o ON o.id = s.objetivo_id
     JOIN atleta a ON a.id = o.atleta_id
     WHERE f.id = $1;`,
    [feedbackId]
  );
}

export async function getHistorialCompletoAtletaData(atletaId) {
  if (!esNumeroValido(atletaId)) {
    throw new ServiceError(400, 'El atletaId debe ser un número válido');
  }

  const atletaResult = await getAtletaById(atletaId);
  if (atletaResult.rows.length === 0) {
    throw new ServiceError(404, `No se encontró atleta con id ${atletaId}`);
  }

  const objetivosResult = await getHistorialObjetivosByAtletaId(atletaId);
  const feedbackResult = await getHistorialFeedbackResumenByAtletaId(atletaId);

  const objetivosConPlanificacion = await Promise.all(
    objetivosResult.rows.map(async (objetivo) => {
      const planificacionResult = await getHistorialPlanificacionByObjetivoId(objetivo.objetivo_id);

      return {
        id: objetivo.objetivo_id,
        nombre: objetivo.nombre_objetivo,
        distancia_objetivo: objetivo.distancia_objetivo || null,
        marca_conseguida: objetivo.marca_conseguida || null,
        fecha_objetivo: objetivo.fecha_objetivo,
        estado: objetivo.estado,
        planificacion: planificacionResult.rows.map((semana) => ({
          semana_id: semana.semana_id,
          fecha_inicio: semana.fecha_inicio,
          fecha_fin: semana.fecha_fin,
          total_sesiones: Number(semana.total_sesiones),
          kilometros_realizados: Number(semana.kilometros_realizados),
          kilometros_planificados: Number(semana.kilometros_planificados),
        })),
      };
    })
  );

  return {
    atleta: atletaResult.rows[0],
    objetivos: objetivosConPlanificacion,
    feedback_resumen: feedbackResult.rows.map((feedback) => ({
      feedback_id: feedback.feedback_id,
      fecha_feedback: feedback.fecha_feedback,
      completada: feedback.completada,
      resumen_corto: feedback.resumen_corto,
      semana_id: feedback.semana_id,
      semana_fecha_inicio: feedback.semana_fecha_inicio,
      semana_fecha_fin: feedback.semana_fecha_fin,
      objetivo_id: feedback.objetivo_id,
      objetivo_nombre: feedback.objetivo_nombre,
    })),
  };
}

export async function getHistorialObjetivosAtletaData(atletaId) {
  if (!esNumeroValido(atletaId)) {
    throw new ServiceError(400, 'El atletaId debe ser un número válido');
  }

  const atletaResult = await getAtletaById(atletaId);
  if (atletaResult.rows.length === 0) {
    throw new ServiceError(404, `No se encontró atleta con id ${atletaId}`);
  }

  const result = await getHistorialObjetivosByAtletaId(atletaId);

  return {
    atleta: atletaResult.rows[0],
    data: result.rows.map((objetivo) => ({
      id: objetivo.objetivo_id,
      nombre: objetivo.nombre_objetivo,
      distancia_objetivo: objetivo.distancia_objetivo || null,
      marca_conseguida: objetivo.marca_conseguida || null,
      fecha_objetivo: objetivo.fecha_objetivo,
      estado: objetivo.estado,
    })),
    count: result.rows.length,
  };
}

export async function getHistorialPlanificacionObjetivoData(objetivoId) {
  if (!esNumeroValido(objetivoId)) {
    throw new ServiceError(400, 'El objetivoId debe ser un número válido');
  }

  const objetivoResult = await getObjetivoById(objetivoId);
  if (objetivoResult.rows.length === 0) {
    throw new ServiceError(404, `No se encontró objetivo con id ${objetivoId}`);
  }

  const result = await getHistorialPlanificacionByObjetivoId(objetivoId);

  return {
    objetivo: objetivoResult.rows[0],
    data: result.rows.map((semana) => ({
      semana_id: semana.semana_id,
      fecha_inicio: semana.fecha_inicio,
      total_sesiones: Number(semana.total_sesiones),
      fecha_fin: semana.fecha_fin,
      kilometros_realizados: Number(semana.kilometros_realizados),
      kilometros_planificados: Number(semana.kilometros_planificados),
    })),
    count: result.rows.length,
  };
}

export async function getHistorialFeedbackAtletaData(atletaId) {
  if (!esNumeroValido(atletaId)) {
    throw new ServiceError(400, 'El atletaId debe ser un número válido');
  }

  const atletaResult = await getAtletaById(atletaId);
  if (atletaResult.rows.length === 0) {
    throw new ServiceError(404, `No se encontró atleta con id ${atletaId}`);
  }

  const result = await getHistorialFeedbackResumenByAtletaId(atletaId);

  return {
    atleta: atletaResult.rows[0],
    data: result.rows.map((feedback) => ({
      feedback_id: feedback.feedback_id,
      fecha_feedback: feedback.fecha_feedback,
      completada: feedback.completada,
      resumen_corto: feedback.resumen_corto,
      semana_id: feedback.semana_id,
      semana_fecha_inicio: feedback.semana_fecha_inicio,
      semana_fecha_fin: feedback.semana_fecha_fin,
      objetivo_id: feedback.objetivo_id,
      objetivo_nombre: feedback.objetivo_nombre,
    })),
    count: result.rows.length,
  };
}

export async function getDetalleFeedbackData(feedbackId) {
  if (!esNumeroValido(feedbackId)) {
    throw new ServiceError(400, 'El feedbackId debe ser un número válido');
  }

  const result = await getDetalleFeedbackById(feedbackId);
  if (result.rows.length === 0) {
    throw new ServiceError(404, `No se encontró feedback con id ${feedbackId}`);
  }

  return result.rows[0];
}
