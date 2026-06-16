-- ====================================================================
-- TRAINING TOOL - Queries Útiles para Node.js
-- ====================================================================

-- ====================================================================
-- AUTENTICACIÓN Y USUARIOS
-- ====================================================================

-- 1. Login: Obtener usuario por username
SELECT id, username, password_hash, rol 
FROM usuario 
WHERE username = $1;

-- 2. Crear usuario
INSERT INTO usuario (username, password_hash, rol)
VALUES ($1, $2, $3)
RETURNING id, username, rol, created_at;

-- ====================================================================
-- PERFIL DE ATLETA
-- ====================================================================

-- 3. Obtener perfil completo del atleta (por usuario_id)
SELECT 
    a.id,
    a.usuario_id,
    a.nombre,
    a.sexo,
    a.peso,
    a.dias_disponibles,
    a.km_medios_ultimos_2_meses,
    a.lesiones_ultimo_anio,
    a.created_at,
    a.updated_at
FROM atleta a
WHERE a.usuario_id = $1;

-- 4. Actualizar perfil de atleta
UPDATE atleta
SET 
    nombre = COALESCE($2, nombre),
    sexo = COALESCE($3, sexo),
    peso = COALESCE($4, peso),
    dias_disponibles = COALESCE($5, dias_disponibles),
    km_medios_ultimos_2_meses = COALESCE($6, km_medios_ultimos_2_meses),
    lesiones_ultimo_anio = COALESCE($7, lesiones_ultimo_anio)
WHERE usuario_id = $1
RETURNING *;

-- ====================================================================
-- OBJETIVOS
-- ====================================================================

-- 5. Obtener objetivo activo del atleta
SELECT 
    o.id,
    o.atleta_id,
    o.nombre,
    o.fecha_objetivo,
    o.activo,
    o.created_at
FROM objetivo o
WHERE o.atleta_id = $1 AND o.activo = true;

-- 6. Obtener todos los objetivos del atleta (activos e históricos)
SELECT 
    o.id,
    o.atleta_id,
    o.nombre,
    o.fecha_objetivo,
    o.activo,
    o.created_at
FROM objetivo o
WHERE o.atleta_id = $1
ORDER BY o.created_at DESC;

-- 7. Crear nuevo objetivo
INSERT INTO objetivo (atleta_id, nombre, fecha_objetivo, activo)
VALUES ($1, $2, $3, false)
RETURNING id, nombre, fecha_objetivo, activo;

-- 8. Activar un objetivo (desactiva el anterior, solo en transacción)
BEGIN;
-- Desactivar objetivo activo anterior
UPDATE objetivo SET activo = false
WHERE atleta_id = $1 AND activo = true;

-- Activar nuevo objetivo
UPDATE objetivo SET activo = true
WHERE id = $2 AND atleta_id = $1
RETURNING id, nombre, activo;
COMMIT;

-- ====================================================================
-- SEMANAS DE ENTRENAMIENTO
-- ====================================================================

-- 9. Obtener todas las semanas de un objetivo
SELECT 
    s.id,
    s.objetivo_id,
    s.fecha_inicio,
    s.fecha_fin,
    COUNT(ses.id) as num_sesiones,
    s.created_at
FROM semana_entrenamiento s
LEFT JOIN sesion_entrenamiento ses ON s.id = ses.semana_id
WHERE s.objetivo_id = $1
GROUP BY s.id, s.objetivo_id, s.fecha_inicio, s.fecha_fin, s.created_at
ORDER BY s.fecha_inicio DESC;

-- 10. Obtener semana actual (rango de fechas)
SELECT 
    s.id,
    s.objetivo_id,
    s.fecha_inicio,
    s.fecha_fin,
    s.created_at
FROM semana_entrenamiento s
WHERE s.objetivo_id = $1
  AND s.fecha_inicio <= CURRENT_DATE
  AND s.fecha_fin >= CURRENT_DATE;

-- 11. Obtener próxima semana
SELECT 
    s.id,
    s.objetivo_id,
    s.fecha_inicio,
    s.fecha_fin,
    s.created_at
FROM semana_entrenamiento s
WHERE s.objetivo_id = $1
  AND s.fecha_inicio > CURRENT_DATE
ORDER BY s.fecha_inicio ASC
LIMIT 1;

-- 12. Crear nueva semana de entrenamiento
INSERT INTO semana_entrenamiento (objetivo_id, fecha_inicio, fecha_fin)
VALUES ($1, $2, $3)
RETURNING id, objetivo_id, fecha_inicio, fecha_fin, created_at;

-- 13. Obtener semana con sus sesiones y feedback
SELECT 
    s.id,
    s.objetivo_id,
    s.fecha_inicio,
    s.fecha_fin,
    -- Sesiones
    json_agg(
        CASE 
            WHEN ses.id IS NOT NULL THEN 
            json_build_object(
                'id', ses.id,
                'orden', ses.orden,
                'descripcion', ses.descripcion,
                'kilometros_planificados', ses.kilometros_planificados,
                'created_at', ses.created_at
            )
            ELSE NULL
        END
    ) FILTER (WHERE ses.id IS NOT NULL) as sesiones,
    -- Feedback
    json_build_object(
        'id', fb.id,
        'completada', fb.completada,
        'motivo_no_completada', fb.motivo_no_completada,
        'sensaciones', fb.sensaciones,
        'molestias', fb.molestias,
        'ritmo_rodaje', fb.ritmo_rodaje,
        'created_at', fb.created_at
    ) as feedback,
    s.created_at
FROM semana_entrenamiento s
LEFT JOIN sesion_entrenamiento ses ON s.id = ses.semana_id
LEFT JOIN feedback_semanal fb ON s.id = fb.semana_id
WHERE s.id = $1
GROUP BY s.id, fb.id, fb.completada, fb.motivo_no_completada, 
         fb.sensaciones, fb.molestias, fb.ritmo_rodaje, fb.created_at;

-- ====================================================================
-- SESIONES DE ENTRENAMIENTO
-- ====================================================================

-- 14. Obtener todas las sesiones de una semana
SELECT 
    ses.id,
    ses.semana_id,
    ses.orden,
    ses.descripcion,
    ses.kilometros_planificados,
    ses.created_at
FROM sesion_entrenamiento ses
WHERE ses.semana_id = $1
ORDER BY ses.orden ASC;

-- 15. Crear sesión de entrenamiento
INSERT INTO sesion_entrenamiento (semana_id, orden, descripcion, kilometros_planificados)
VALUES ($1, $2, $3, $4)
RETURNING id, semana_id, orden, descripcion, kilometros_planificados;

-- 16. Actualizar sesión
UPDATE sesion_entrenamiento
SET 
    orden = COALESCE($2, orden),
    descripcion = COALESCE($3, descripcion),
    kilometros_planificados = COALESCE($4, kilometros_planificados)
WHERE id = $1
RETURNING *;

-- 17. Eliminar sesión
DELETE FROM sesion_entrenamiento
WHERE id = $1 AND semana_id = $2
RETURNING id;

-- ====================================================================
-- FEEDBACK SEMANAL
-- ====================================================================

-- 18. Obtener feedback de una semana
SELECT 
    fb.id,
    fb.semana_id,
    fb.completada,
    fb.motivo_no_completada,
    fb.sensaciones,
    fb.molestias,
    fb.ritmo_rodaje,
    fb.created_at,
    fb.updated_at
FROM feedback_semanal fb
WHERE fb.semana_id = $1;

-- 19. Crear o actualizar feedback de una semana
-- Opción A: Insertar (si no existe)
INSERT INTO feedback_semanal 
    (semana_id, completada, motivo_no_completada, sensaciones, molestias, ritmo_rodaje)
VALUES ($1, $2, $3, $4, $5, $6)
ON CONFLICT (semana_id) 
DO UPDATE SET
    completada = EXCLUDED.completada,
    motivo_no_completada = EXCLUDED.motivo_no_completada,
    sensaciones = EXCLUDED.sensaciones,
    molestias = EXCLUDED.molestias,
    ritmo_rodaje = EXCLUDED.ritmo_rodaje
RETURNING *;

-- 20. Obtener resumen de feedback del objetivo (últimas 4 semanas)
SELECT 
    s.id as semana_id,
    s.fecha_inicio,
    s.fecha_fin,
    fb.completada,
    fb.sensaciones,
    fb.molestias,
    COUNT(ses.id) as sesiones_planificadas,
    SUM(ses.kilometros_planificados) as km_totales_planificados
FROM semana_entrenamiento s
LEFT JOIN sesion_entrenamiento ses ON s.id = ses.semana_id
LEFT JOIN feedback_semanal fb ON s.id = fb.semana_id
WHERE s.objetivo_id = $1
  AND s.fecha_fin >= CURRENT_DATE - INTERVAL '4 weeks'
GROUP BY s.id, s.fecha_inicio, s.fecha_fin, fb.completada, fb.sensaciones, fb.molestias
ORDER BY s.fecha_inicio DESC;

-- ====================================================================
-- REPORTES Y ESTADÍSTICAS
-- ====================================================================

-- 21. Obtener resumen del objetivo (progreso)
SELECT 
    o.id,
    o.nombre,
    o.fecha_objetivo,
    o.activo,
    COUNT(DISTINCT s.id) as num_semanas,
    COUNT(DISTINCT ses.id) as num_sesiones,
    COALESCE(SUM(ses.kilometros_planificados), 0) as km_totales_planificados,
    COALESCE(ROUND(AVG(ses.kilometros_planificados)::numeric, 2), 0) as km_promedio_por_sesion,
    -- % de semanas completadas
    COALESCE(
        ROUND(
            (SUM(CASE WHEN fb.completada = true THEN 1 ELSE 0 END)::numeric / 
             COUNT(DISTINCT s.id)::numeric * 100),
            1
        ),
        0
    ) as porcentaje_semanas_completadas
FROM objetivo o
LEFT JOIN semana_entrenamiento s ON o.id = s.objetivo_id
LEFT JOIN sesion_entrenamiento ses ON s.id = ses.semana_id
LEFT JOIN feedback_semanal fb ON s.id = fb.semana_id
WHERE o.id = $1
GROUP BY o.id, o.nombre, o.fecha_objetivo, o.activo;

-- 22. Obtener tabla de objetivo actual con detalles
SELECT 
    o.id as objetivo_id,
    o.nombre as objetivo,
    a.id as atleta_id,
    a.nombre as atleta,
    o.fecha_objetivo,
    o.activo,
    -- Semanas
    COUNT(DISTINCT s.id) as semanas_planificadas,
    -- Sesiones
    COUNT(DISTINCT ses.id) as sesiones_planificadas,
    -- Feedback
    COALESCE(SUM(CASE WHEN fb.completada = true THEN 1 ELSE 0 END), 0) as semanas_completadas
FROM objetivo o
JOIN atleta a ON o.atleta_id = a.id
LEFT JOIN semana_entrenamiento s ON o.id = s.objetivo_id
LEFT JOIN sesion_entrenamiento ses ON s.id = ses.semana_id
LEFT JOIN feedback_semanal fb ON s.id = fb.semana_id
WHERE o.activo = true AND a.usuario_id = $1
GROUP BY o.id, o.nombre, a.id, a.nombre, o.fecha_objetivo, o.activo;

-- 23. Obtener atletas sin objetivo activo
SELECT 
    a.id,
    a.usuario_id,
    a.nombre,
    COUNT(o.id) as objetivos_historicos
FROM atleta a
LEFT JOIN objetivo o ON a.id = o.atleta_id
WHERE NOT EXISTS (
    SELECT 1 
    FROM objetivo o2 
    WHERE o2.atleta_id = a.id AND o2.activo = true
)
GROUP BY a.id, a.usuario_id, a.nombre;

-- ====================================================================
-- OPERACIONES ADMINISTRATIVAS
-- ====================================================================

-- 24. Obtener todos los atletas con su estado actual
SELECT 
    u.id as usuario_id,
    u.username,
    a.id as atleta_id,
    a.nombre,
    a.peso,
    o.id as objetivo_activo_id,
    o.nombre as objetivo_activo,
    COUNT(DISTINCT s.id) as semanas,
    COUNT(DISTINCT ses.id) as sesiones
FROM usuario u
LEFT JOIN atleta a ON u.id = a.usuario_id
LEFT JOIN objetivo o ON a.id = o.atleta_id AND o.activo = true
LEFT JOIN semana_entrenamiento s ON o.id = s.objetivo_id
LEFT JOIN sesion_entrenamiento ses ON s.id = ses.semana_id
WHERE u.rol = 'ATLETA'
GROUP BY u.id, u.username, a.id, a.nombre, a.peso, o.id, o.nombre
ORDER BY u.username;

-- 25. Eliminar un atleta (cascada completa)
DELETE FROM atleta WHERE id = $1;
-- Nota: Esto elimina atleta, sus objetivos, semanas, sesiones y feedbacks

-- ====================================================================
-- VALIDACIONES Y CHECKS
-- ====================================================================

-- 26. Verificar si hay solapamiento de semanas (debería fallar en la BD)
-- Esta query ayuda a debuggear si hay problemas con la constraint
SELECT 
    s1.id as semana_1,
    s1.fecha_inicio as inicio_1,
    s1.fecha_fin as fin_1,
    s2.id as semana_2,
    s2.fecha_inicio as inicio_2,
    s2.fecha_fin as fin_2
FROM semana_entrenamiento s1
JOIN semana_entrenamiento s2 ON 
    s1.objetivo_id = s2.objetivo_id 
    AND s1.id < s2.id
    AND NOT (s1.fecha_fin < s2.fecha_inicio OR s2.fecha_fin < s1.fecha_inicio)
WHERE s1.objetivo_id = $1;

-- 27. Verificar feedback sin motivo de incumplimiento
SELECT 
    fb.id,
    fb.semana_id,
    fb.completada,
    fb.motivo_no_completada
FROM feedback_semanal fb
WHERE fb.completada = false AND fb.motivo_no_completada IS NULL;

-- ====================================================================
-- LIBRARÍA NODE.JS - EJEMPLO CON PARAMETRIZACIÓN
-- ====================================================================

/*
// Ejemplo en Node.js con pg:

const { Pool } = require('pg');
const pool = new Pool();

// Login
async function loginUser(username, password) {
    const result = await pool.query(
        'SELECT id, username, password_hash, rol FROM usuario WHERE username = $1',
        [username]
    );
    return result.rows[0];
}

// Obtener objetivo activo
async function getActiveObjective(userId) {
    const result = await pool.query(
        'SELECT o.id, o.nombre, o.fecha_objetivo, o.activo ' +
        'FROM objetivo o ' +
        'JOIN atleta a ON o.atleta_id = a.id ' +
        'WHERE a.usuario_id = $1 AND o.activo = true',
        [userId]
    );
    return result.rows[0];
}

// Crear semana con sesiones (transacción)
async function createWeekWithSessions(objectiveId, startDate, endDate, sessions) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // Crear semana
        const weekResult = await client.query(
            'INSERT INTO semana_entrenamiento (objetivo_id, fecha_inicio, fecha_fin) ' +
            'VALUES ($1, $2, $3) RETURNING id',
            [objectiveId, startDate, endDate]
        );
        const weekId = weekResult.rows[0].id;
        
        // Crear sesiones
        for (const session of sessions) {
            await client.query(
                'INSERT INTO sesion_entrenamiento (semana_id, fecha, descripcion, kilometros_planificados) ' +
                'VALUES ($1, $2, $3, $4)',
                [weekId, session.fecha, session.descripcion, session.kilometros_planificados]
            );
        }
        
        await client.query('COMMIT');
        return weekId;
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
}
*/

