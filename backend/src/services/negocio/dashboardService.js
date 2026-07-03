import { query } from '../../config/db.js';

const BUSINESS_TZ = 'Europe/Madrid';

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

// Servicio de negocio del dashboard: concentra consultas y armado de datos.
export async function getDashboardData({ limit, offset }) {
  const hasLeido = await hasFeedbackLeidoColumn();

  // 1) KPIs
  const numAtletasResult = await query(
    `SELECT COUNT(*) AS num_atletas_activos FROM objetivo o WHERE o.activo = true;`
  );
  const numFeedbackNuevosResult = await query(
    // Regla de negocio: feedback no leído es la única fuente de notificaciones.
    hasLeido
      ? `SELECT COUNT(*) AS num_feedback_nuevos
         FROM feedback_semanal f
         WHERE f.leido = false;`
      : `SELECT COUNT(*) AS num_feedback_nuevos
         FROM feedback_semanal f;`
  );
  const numPlanificacionesPendientesResult = await query(
    `WITH atletas_activos AS (
      SELECT o.id AS objetivo_id, o.atleta_id FROM objetivo o WHERE o.activo = true
    ), semana_seleccionada AS (
      SELECT a.objetivo_id, COALESCE(
        (SELECT s.id FROM semana_entrenamiento s WHERE s.objetivo_id = a.objetivo_id AND CURRENT_DATE BETWEEN s.fecha_inicio AND s.fecha_fin LIMIT 1),
        (SELECT s2.id FROM semana_entrenamiento s2 WHERE s2.objetivo_id = a.objetivo_id AND s2.fecha_inicio >= CURRENT_DATE ORDER BY s2.fecha_inicio ASC LIMIT 1)
      ) AS semana_id
      FROM atletas_activos a
    )
    SELECT COUNT(*) AS num_planificaciones_pendientes
    FROM (
      SELECT ss.objetivo_id, s.id, s.fecha_fin, COUNT(ses.id) AS sesiones_count
      FROM semana_seleccionada ss
      JOIN semana_entrenamiento s ON s.id = ss.semana_id
      LEFT JOIN sesion_entrenamiento ses ON ses.semana_id = s.id
      GROUP BY ss.objetivo_id, s.id, s.fecha_fin
      HAVING (s.fecha_fin - CURRENT_DATE) <= 2 AND COUNT(ses.id) = 0
    ) t;`
  );
  const numObjetivosProximosResult = await query(
    `SELECT COUNT(*) AS num_objetivos_proximos
     FROM objetivo o
     WHERE o.activo = true
       AND (o.fecha_objetivo - (CURRENT_TIMESTAMP AT TIME ZONE '${BUSINESS_TZ}')::date) <= 9;`
  );

  const summary = {
    num_atletas_activos: parseInt(numAtletasResult.rows[0].num_atletas_activos, 10),
    num_feedback_nuevos: parseInt(numFeedbackNuevosResult.rows[0].num_feedback_nuevos, 10),
    num_planificaciones_pendientes: parseInt(
      numPlanificacionesPendientesResult.rows[0].num_planificaciones_pendientes,
      10
    ),
    num_objetivos_proximos: parseInt(numObjetivosProximosResult.rows[0].num_objetivos_proximos, 10),
  };

  // 2) Notificaciones
  const notificationsResult = await query(
    // Responsabilidad: campana con datos mínimos de negocio (atleta, objetivo, semana).
    hasLeido
      ? `SELECT
           f.id,
           o.atleta_id,
           a.nombre AS atleta_nombre,
           o.id AS objetivo_id,
           o.nombre AS objetivo_nombre,
           f.semana_id,
           s.fecha_inicio AS semana_fecha_inicio,
           s.fecha_fin AS semana_fecha_fin,
           f.created_at AS fecha_envio,
           f.leido
         FROM feedback_semanal f
         JOIN semana_entrenamiento s ON s.id = f.semana_id
         JOIN objetivo o ON o.id = s.objetivo_id
         JOIN atleta a ON a.id = o.atleta_id
         WHERE f.leido = false
         ORDER BY f.created_at DESC
         LIMIT $1`
      : `SELECT
           f.id,
           o.atleta_id,
           a.nombre AS atleta_nombre,
           o.id AS objetivo_id,
           o.nombre AS objetivo_nombre,
           f.semana_id,
           s.fecha_inicio AS semana_fecha_inicio,
           s.fecha_fin AS semana_fecha_fin,
           f.created_at AS fecha_envio,
           false AS leido
         FROM feedback_semanal f
         JOIN semana_entrenamiento s ON s.id = f.semana_id
         JOIN objetivo o ON o.id = s.objetivo_id
         JOIN atleta a ON a.id = o.atleta_id
         ORDER BY f.created_at DESC
         LIMIT $1`,
    [limit]
  );

  // 3) Lista de atletas priorizada
  const atletasResult = await query(
    `WITH atletas_activos AS (
       SELECT at.id AS atleta_id, at.nombre AS atleta_nombre, o.id AS objetivo_id, o.nombre AS objetivo_nombre, o.fecha_objetivo
       FROM atleta at
       JOIN objetivo o ON o.atleta_id = at.id AND o.activo = true
     ), semana_seleccionada AS (
       SELECT aa.*, COALESCE(
         (SELECT s.id FROM semana_entrenamiento s WHERE s.objetivo_id = aa.objetivo_id AND CURRENT_DATE BETWEEN s.fecha_inicio AND s.fecha_fin LIMIT 1),
         (SELECT s2.id FROM semana_entrenamiento s2 WHERE s2.objetivo_id = aa.objetivo_id AND s2.fecha_inicio >= CURRENT_DATE ORDER BY s2.fecha_inicio ASC LIMIT 1)
       ) AS semana_id
       FROM atletas_activos aa
     ), sesiones_agg AS (
       SELECT ses.semana_id,
              COUNT(ses.id) AS sesiones_planificadas,
              COALESCE(SUM(ses.kilometros_planificados),0) AS km_planificados,
              COALESCE(SUM(CASE WHEN ses.realizada = true THEN ses.kilometros_realizados ELSE 0 END),0) AS km_realizados
       FROM sesion_entrenamiento ses
       GROUP BY ses.semana_id
     )
     SELECT a.atleta_id, a.atleta_nombre, a.objetivo_id, a.objetivo_nombre, a.fecha_objetivo, (a.fecha_objetivo - (CURRENT_TIMESTAMP AT TIME ZONE '${BUSINESS_TZ}')::date) AS dias_hasta_objetivo, s.id AS semana_id, s.fecha_inicio AS semana_fecha_inicio, s.fecha_fin AS semana_fecha_fin, COALESCE(sa.km_planificados,0) AS km_planificados_semana, COALESCE(sa.km_realizados,0) AS km_realizados_semana,
       CASE
         WHEN s.id IS NOT NULL AND (s.fecha_fin - CURRENT_DATE) <= 2 AND COALESCE(sa.sesiones_planificadas,0) = 0 THEN 'planificacion_pendiente'
         WHEN (a.fecha_objetivo - (CURRENT_TIMESTAMP AT TIME ZONE '${BUSINESS_TZ}')::date) <= 9 THEN 'objetivo_proximo'
         ELSE 'ok'
       END AS estado_prioritario,
       CASE
         WHEN s.id IS NOT NULL AND (s.fecha_fin - CURRENT_DATE) <= 2 AND COALESCE(sa.sesiones_planificadas,0) = 0 THEN CONCAT('faltan ', (s.fecha_fin - CURRENT_DATE), ' dias y ', COALESCE(sa.sesiones_planificadas,0), ' sesiones planificadas')
         WHEN (a.fecha_objetivo - (CURRENT_TIMESTAMP AT TIME ZONE '${BUSINESS_TZ}')::date) <= 0 THEN 'Objetivo alcanzado: registrar marca conseguida'
         WHEN (a.fecha_objetivo - (CURRENT_TIMESTAMP AT TIME ZONE '${BUSINESS_TZ}')::date) <= 9 THEN CONCAT('objetivo en ', (a.fecha_objetivo - (CURRENT_TIMESTAMP AT TIME ZONE '${BUSINESS_TZ}')::date), ' dias')
         ELSE 'todo correcto'
       END AS razon_estado
     FROM semana_seleccionada ss
     JOIN atletas_activos a ON a.objetivo_id = ss.objetivo_id
     LEFT JOIN semana_entrenamiento s ON s.id = ss.semana_id
     LEFT JOIN sesiones_agg sa ON sa.semana_id = s.id
     ORDER BY
       CASE
         WHEN (s.id IS NOT NULL AND (s.fecha_fin - CURRENT_DATE) <= 2 AND COALESCE(sa.sesiones_planificadas,0) = 0) THEN 1
         WHEN (a.fecha_objetivo - (CURRENT_TIMESTAMP AT TIME ZONE '${BUSINESS_TZ}')::date) <= 9 THEN 2
         ELSE 3
       END,
       a.atleta_nombre ASC
     LIMIT $1 OFFSET $2;`,
    [limit, offset]
  );

  return {
    summary,
    notifications: notificationsResult.rows,
    atletas: atletasResult.rows,
  };
}
