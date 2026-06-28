import { query } from '../../config/db.js';

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
    `SELECT o.id, o.atleta_id, o.nombre, o.fecha_objetivo, o.activo
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
       NULL::NUMERIC AS distancia,
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
export async function getHistorialPlanificacionByObjetivoId(objetivoId) {
  return query(
    `SELECT
       s.id AS semana_id,
       s.fecha_inicio,
       s.fecha_fin,
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
         nf_ultimo.resumen,
         LEFT(COALESCE(f.comentario, f.sensaciones, f.molestias, f.motivo_no_completada, 'Sin resumen'), 180)
       ) AS resumen_corto,
       f.semana_id,
       s.fecha_inicio AS semana_fecha_inicio,
       s.fecha_fin AS semana_fecha_fin,
       o.id AS objetivo_id,
       o.nombre AS objetivo_nombre
     FROM feedback_semanal f
     JOIN semana_entrenamiento s ON s.id = f.semana_id
     JOIN objetivo o ON o.id = s.objetivo_id
     LEFT JOIN LATERAL (
       SELECT nf.resumen
       FROM notificacion_feedback nf
       WHERE nf.semana_id = s.id
         AND nf.tipo = 'feedback_enviado'
       ORDER BY nf.fecha_envio DESC, nf.id DESC
       LIMIT 1
     ) nf_ultimo ON true
     WHERE o.atleta_id = $1
     ORDER BY f.created_at DESC, f.id DESC;`,
    [atletaId]
  );
}

// Servicio para obtener el detalle completo de un feedback.
export async function getDetalleFeedbackById(feedbackId) {
  return query(
    `SELECT
       f.id,
       f.semana_id,
       f.completada,
       f.motivo_no_completada,
       f.sensaciones,
       f.molestias,
       f.ritmo_rodaje,
       f.comentario,
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
