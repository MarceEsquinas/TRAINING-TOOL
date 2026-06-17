-- Queries para GET /dashboard
-- 1) KPIs resumen

-- num_atletas_activos
-- Atletas que tienen un objetivo activo
SELECT COUNT(*) AS num_atletas_activos
FROM objetivo o
WHERE o.activo = true;

-- num_feedback_nuevos
SELECT COUNT(*) AS num_feedback_nuevos
FROM notificacion_feedback nf
WHERE nf.leido = false AND nf.tipo = 'feedback_enviado';

-- num_planificaciones_pendientes
-- Contamos atletas con objetivo activo cuya semana actual (o próxima) tiene <=2 días hasta fecha_fin y 0 sesiones planificadas
WITH atletas_activos AS (
  SELECT o.id AS objetivo_id, o.atleta_id
  FROM objetivo o
  WHERE o.activo = true
), semana_seleccionada AS (
  SELECT a.objetivo_id, COALESCE(
    (SELECT s.id FROM semana_entrenamiento s WHERE s.objetivo_id = a.objetivo_id AND CURRENT_DATE BETWEEN s.fecha_inicio AND s.fecha_fin LIMIT 1),
    (SELECT s2.id FROM semana_entrenamiento s2 WHERE s2.objetivo_id = a.objetivo_id AND s2.fecha_inicio >= CURRENT_DATE ORDER BY s2.fecha_inicio ASC LIMIT 1)
  ) AS semana_id
  FROM atletas_activos a
)
SELECT COUNT(*) AS num_planificaciones_pendientes
FROM semana_seleccionada ss
JOIN semana_entrenamiento s ON s.id = ss.semana_id
LEFT JOIN sesion_entrenamiento ses ON ses.semana_id = s.id
GROUP BY ss.objetivo_id, s.id, s.fecha_fin
HAVING (s.fecha_fin - CURRENT_DATE) <= 2 AND COUNT(ses.id) = 0;

-- num_objetivos_proximos
SELECT COUNT(*) AS num_objetivos_proximos
FROM objetivo o
WHERE o.activo = true AND (o.fecha_objetivo - CURRENT_DATE) <= 9;

-- 2) Notificaciones recientes (para listar)
SELECT nf.id,
       nf.tipo,
       nf.atleta_id,
       a.nombre AS atleta_nombre,
       nf.objetivo_id,
       o.nombre AS objetivo_nombre,
       nf.semana_id,
       nf.fecha_envio,
       nf.resumen,
       nf.leido
FROM notificacion_feedback nf
JOIN atleta a ON a.id = nf.atleta_id
LEFT JOIN objetivo o ON o.id = nf.objetivo_id
WHERE nf.tipo = 'feedback_enviado'
ORDER BY nf.fecha_envio DESC
LIMIT 50;

-- 3) Lista de atletas priorizada (paginable)
-- Devuelve atletas con objetivo activo y calcula estado_prioritario, kms y semanas
WITH atletas_activos AS (
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
SELECT a.atleta_id,
       a.atleta_nombre,
       a.objetivo_id,
       a.objetivo_nombre,
       (a.fecha_objetivo - CURRENT_DATE) AS dias_hasta_objetivo,
       s.id AS semana_id,
       s.fecha_inicio AS semana_fecha_inicio,
       s.fecha_fin AS semana_fecha_fin,
       COALESCE(sa.km_planificados,0) AS km_planificados_semana,
       COALESCE(sa.km_realizados,0) AS km_realizados_semana,
       CASE
         WHEN s.id IS NOT NULL AND (s.fecha_fin - CURRENT_DATE) <= 2 AND COALESCE(sa.sesiones_planificadas,0) = 0 THEN 'planificacion_pendiente'
         WHEN (a.fecha_objetivo - CURRENT_DATE) <= 9 THEN 'objetivo_proximo'
         ELSE 'ok'
       END AS estado_prioritario,
       CASE
         WHEN s.id IS NOT NULL AND (s.fecha_fin - CURRENT_DATE) <= 2 AND COALESCE(sa.sesiones_planificadas,0) = 0 THEN CONCAT('faltan ', (s.fecha_fin - CURRENT_DATE), ' dias y ', COALESCE(sa.sesiones_planificadas,0), ' sesiones planificadas')
         WHEN (a.fecha_objetivo - CURRENT_DATE) <= 9 THEN CONCAT('objetivo en ', (a.fecha_objetivo - CURRENT_DATE), ' dias')
         ELSE 'todo correcto'
       END AS razon_estado
FROM semana_seleccionada ss
JOIN atletas_activos a ON a.objetivo_id = ss.objetivo_id
LEFT JOIN semana_entrenamiento s ON s.id = ss.semana_id
LEFT JOIN sesiones_agg sa ON sa.semana_id = s.id
ORDER BY
  CASE
    WHEN (s.id IS NOT NULL AND (s.fecha_fin - CURRENT_DATE) <= 2 AND COALESCE(sa.sesiones_planificadas,0) = 0) THEN 1
    WHEN (a.fecha_objetivo - CURRENT_DATE) <= 9 THEN 2
    ELSE 3
  END,
  a.atleta_nombre ASC
LIMIT 50 OFFSET 0;
