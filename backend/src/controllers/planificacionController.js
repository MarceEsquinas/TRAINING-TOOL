import { query } from '../config/db.js';

// Controlador para GET /planificacion/:atletaId
export async function getPlanificacionAtleta(req, res) {
  try {
    const { atletaId } = req.params;

    if (!atletaId || Number.isNaN(Number(atletaId))) {
      return res.status(400).json({
        success: false,
        message: 'El atletaId debe ser un número válido',
      });
    }

    const result = await query(
      `WITH atleta_objetivo AS (
         SELECT
           a.id AS atleta_id,
           a.nombre AS atleta_nombre,
           o.id AS objetivo_id,
           o.nombre AS objetivo_nombre,
           o.fecha_objetivo,
           (o.fecha_objetivo - CURRENT_DATE) AS dias_hasta_objetivo
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
      return res.status(404).json({
        success: false,
        message: `No se encontró atleta con id ${atletaId}`,
      });
    }

    const rowPrincipal = result.rows[0];
    const sesiones = result.rows
      .filter((row) => row.sesion_id !== null)
      .map((row) => ({
        id: row.sesion_id,
        orden: row.orden,
        descripcion: row.descripcion,
        kilometros_planificados: row.kilometros_planificados !== null ? Number(row.kilometros_planificados) : null,
        kilometros_realizados: row.kilometros_realizados !== null ? Number(row.kilometros_realizados) : null,
        realizada: row.realizada,
        fecha_realizada: row.fecha_realizada,
      }));

    const data = {
      atleta: {
        id: rowPrincipal.atleta_id,
        nombre: rowPrincipal.atleta_nombre,
      },
      objetivo: rowPrincipal.objetivo_id
        ? {
            id: rowPrincipal.objetivo_id,
            nombre: rowPrincipal.objetivo_nombre,
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

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error al obtener la planificación del atleta:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener la planificación del atleta',
      error: error.message,
    });
  }
}