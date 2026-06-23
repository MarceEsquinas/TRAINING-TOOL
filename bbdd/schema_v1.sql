-- ====================================================================
-- TRAINING TOOL - Database Schema V1
-- PostgreSQL 12+
-- ====================================================================

-- Habilitar extensión para EXCLUDE constraint
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ====================================================================
-- ENUM TYPES
-- ====================================================================

CREATE TYPE rol_enum AS ENUM ('ADMIN', 'ATLETA');
CREATE TYPE sexo_enum AS ENUM ('M', 'F', 'OTRO');

-- ====================================================================
-- TABLA: usuario
-- Descripción: Usuarios del sistema (admins y atletas)
-- ====================================================================

CREATE TABLE usuario (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol rol_enum NOT NULL DEFAULT 'ATLETA',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE usuario IS 'Usuarios del sistema: administradores y atletas';
COMMENT ON COLUMN usuario.username IS 'Nombre de usuario único para login';
COMMENT ON COLUMN usuario.password_hash IS 'Hash de contraseña (bcrypt/argon2 en Node.js)';
COMMENT ON COLUMN usuario.rol IS 'Rol: ADMIN o ATLETA';

CREATE INDEX idx_usuario_username ON usuario(username);

-- ====================================================================
-- TABLA: entrenadores
-- Descripción: Entrenadores con acceso a planificar atletas
-- ====================================================================

CREATE TABLE entrenadores (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE entrenadores IS 'Entrenadores del sistema responsables de la planificación';
COMMENT ON COLUMN entrenadores.nombre IS 'Nombre completo del entrenador';
COMMENT ON COLUMN entrenadores.correo IS 'Correo único para autenticación del entrenador';
COMMENT ON COLUMN entrenadores.password_hash IS 'Hash de contraseña del entrenador (bcrypt/argon2)';

CREATE INDEX idx_entrenador_correo ON entrenadores(correo);

-- ====================================================================
-- TABLA: atleta
-- Descripción: Perfil de atleta con información base, estadísticas y asignación de entrenador
-- ====================================================================

CREATE TABLE atleta (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER UNIQUE,
    entrenador_id INTEGER,
    nombre VARCHAR(100) NOT NULL,
    sexo sexo_enum,
    peso NUMERIC(5, 2) CHECK (peso > 0),
    dias_disponibles JSONB DEFAULT '[]',
    km_medios_ultimos_2_meses NUMERIC(5, 2),
    lesiones_ultimo_anio JSONB DEFAULT '[]',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_usuario FOREIGN KEY (usuario_id)
        REFERENCES usuario(id) ON DELETE SET NULL,
    CONSTRAINT fk_entrenador FOREIGN KEY (entrenador_id)
        REFERENCES entrenadores(id) ON DELETE SET NULL
);

COMMENT ON TABLE atleta IS 'Perfil de atleta vinculado a usuario y entrenador';
COMMENT ON COLUMN atleta.usuario_id IS 'FK a usuario (NULLABLE para admins sin perfil atleta)';
COMMENT ON COLUMN atleta.entrenador_id IS 'FK a entrenador responsable de la planificación del atleta';
COMMENT ON COLUMN atleta.nombre IS 'Nombre completo del atleta';
COMMENT ON COLUMN atleta.sexo IS 'Sexo biológico';
COMMENT ON COLUMN atleta.peso IS 'Peso en kg (no puede ser negativo)';
COMMENT ON COLUMN atleta.dias_disponibles IS 'JSON array: ["lunes", "martes", ...]';
COMMENT ON COLUMN atleta.km_medios_ultimos_2_meses IS 'Promedio de km/semana en últimos 2 meses';
COMMENT ON COLUMN atleta.lesiones_ultimo_anio IS 'JSON array de lesiones: [{"tipo": "...", "fecha": "...", "notas": "..."}]';

CREATE INDEX idx_atleta_usuario_id ON atleta(usuario_id);
CREATE INDEX idx_atleta_entrenador_id ON atleta(entrenador_id);

-- ====================================================================
-- TABLA: objetivo
-- Descripción: Objetivos de entrenamiento del atleta
-- Regla: Un atleta puede tener múltiples objetivos históricos, pero solo uno activo
-- ====================================================================

CREATE TABLE objetivo (
    id SERIAL PRIMARY KEY,
    atleta_id INTEGER NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    fecha_objetivo DATE NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_atleta FOREIGN KEY (atleta_id)
        REFERENCES atleta(id) ON DELETE CASCADE
);

COMMENT ON TABLE objetivo IS 'Objetivos de entrenamiento del atleta';
COMMENT ON COLUMN objetivo.atleta_id IS 'FK a atleta (cascade delete)';
COMMENT ON COLUMN objetivo.nombre IS 'Nombre del objetivo (ej: "Media maratón en 1:45")';
COMMENT ON COLUMN objetivo.fecha_objetivo IS 'Fecha objetivo del evento/meta';
COMMENT ON COLUMN objetivo.activo IS 'Solo un objetivo activo por atleta';

CREATE INDEX idx_objetivo_atleta_id ON objetivo(atleta_id);

-- Constraint: Un solo objetivo activo por atleta
CREATE UNIQUE INDEX idx_objetivo_activo_por_atleta 
    ON objetivo(atleta_id) 
    WHERE activo = true;

-- ====================================================================
-- TABLA: semana_entrenamiento
-- Descripción: Semanas de entrenamiento del objetivo
-- Reglas: 
--   - Una semana puede no tener sesiones (vacaciones, recuperación)
--   - No se pueden solapar fechas del mismo objetivo
-- ====================================================================

CREATE TABLE semana_entrenamiento (
    id SERIAL PRIMARY KEY,
    objetivo_id INTEGER NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_objetivo FOREIGN KEY (objetivo_id)
        REFERENCES objetivo(id) ON DELETE CASCADE,
    
    -- Validación básica: fecha_fin >= fecha_inicio
    CONSTRAINT fecha_valida CHECK (fecha_fin >= fecha_inicio),
    
    -- No se solapan semanas del mismo objetivo
    CONSTRAINT no_solapamiento_fechas EXCLUDE USING gist (
        objetivo_id WITH =,
        daterange(fecha_inicio, fecha_fin, '[]') WITH &&
    )
);

COMMENT ON TABLE semana_entrenamiento IS 'Semanas de entrenamiento (pueden estar vacías)';
COMMENT ON COLUMN semana_entrenamiento.objetivo_id IS 'FK a objetivo (cascade delete)';
COMMENT ON COLUMN semana_entrenamiento.fecha_inicio IS 'Fecha inicio de la semana (lunes típicamente)';
COMMENT ON COLUMN semana_entrenamiento.fecha_fin IS 'Fecha fin de la semana (domingo típicamente)';
COMMENT ON CONSTRAINT no_solapamiento_fechas ON semana_entrenamiento 
    IS 'EXCLUDE constraint: no se solapan semanas del mismo objetivo';

CREATE INDEX idx_semana_objetivo_id ON semana_entrenamiento(objetivo_id);
CREATE INDEX idx_semana_fechas ON semana_entrenamiento(fecha_inicio, fecha_fin);

-- ====================================================================
-- TABLA: sesion_entrenamiento
-- Descripción: Sesiones individuales dentro de una semana
-- ====================================================================

CREATE TABLE sesion_entrenamiento (
    id SERIAL PRIMARY KEY,
    semana_id INTEGER NOT NULL,
    orden VARCHAR(50) NOT NULL DEFAULT '1',
    descripcion TEXT NOT NULL,
    kilometros_planificados NUMERIC(5, 2),
    kilometros_realizados NUMERIC(6, 2),
    realizada BOOLEAN NOT NULL DEFAULT false,
    fecha_realizada DATE,
    registrado_por VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_semana FOREIGN KEY (semana_id)
        REFERENCES semana_entrenamiento(id) ON DELETE CASCADE,
    CONSTRAINT orden_unico_por_semana UNIQUE (semana_id, orden)
);

COMMENT ON TABLE sesion_entrenamiento IS 'Sesiones de entrenamiento dentro de una semana';
COMMENT ON COLUMN sesion_entrenamiento.semana_id IS 'FK a semana_entrenamiento (cascade delete)';
COMMENT ON COLUMN sesion_entrenamiento.orden IS 'Orden de la sesión dentro de la semana; no hay fecha fija para mayor flexibilidad';
COMMENT ON COLUMN sesion_entrenamiento.descripcion IS 'Descripción libre: "60 min Z2", "12 km suaves", "20 cal + 6x1000 + 10 enfr"';
COMMENT ON COLUMN sesion_entrenamiento.kilometros_planificados IS 'Km planificados para la sesión';
COMMENT ON COLUMN sesion_entrenamiento.kilometros_realizados IS 'Km reales realizados en la sesión (registro manual)';
COMMENT ON COLUMN sesion_entrenamiento.realizada IS 'Marca si la sesión fue completada/relevada';
COMMENT ON COLUMN sesion_entrenamiento.fecha_realizada IS 'Fecha en que la sesión fue realizada';
COMMENT ON COLUMN sesion_entrenamiento.registrado_por IS 'Usuario que registró la realización (athlete/coach)';

CREATE INDEX idx_sesion_semana_id ON sesion_entrenamiento(semana_id);
CREATE INDEX idx_sesion_semana_orden ON sesion_entrenamiento(semana_id, orden);

-- ====================================================================
-- TABLA: feedback_semanal
-- Descripción: Feedback semanal post-entrenamiento (1:1 con semana)
-- Reglas:
--   - Si no completada, debe tener motivo_no_completada
--   - Una semana solo tiene un feedback
-- ====================================================================

CREATE TABLE feedback_semanal (
    id SERIAL PRIMARY KEY,
    semana_id INTEGER NOT NULL UNIQUE,
    completada BOOLEAN NOT NULL DEFAULT true,
    motivo_no_completada VARCHAR(255),
    sensaciones TEXT,
    molestias TEXT,
    comentario TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_semana FOREIGN KEY (semana_id)
        REFERENCES semana_entrenamiento(id) ON DELETE CASCADE,
    
    -- Lógica: si no está completada, debe tener motivo
    CONSTRAINT motivo_requerido CHECK (
        (completada = true) OR 
        (completada = false AND motivo_no_completada IS NOT NULL)
    )
);

COMMENT ON TABLE feedback_semanal IS 'Feedback semanal del atleta (1:1 con semana)';
COMMENT ON COLUMN feedback_semanal.semana_id IS 'FK a semana_entrenamiento (UNIQUE, cascade delete)';
COMMENT ON COLUMN feedback_semanal.completada IS 'true si la semana se completó según plan';
COMMENT ON COLUMN feedback_semanal.motivo_no_completada IS 'Motivo de no completarla (enfermedad, lesión, etc)';
COMMENT ON COLUMN feedback_semanal.sensaciones IS 'Sensaciones generales del atleta durante la semana';
COMMENT ON COLUMN feedback_semanal.molestias IS 'Molestias físicas reportadas';
COMMENT ON COLUMN feedback_semanal.comentario IS 'Comentario libre del atleta';

CREATE INDEX idx_feedback_semana_id ON feedback_semanal(semana_id);

-- ====================================================================
-- TABLA: notificacion_feedback
-- Descripción: Eventos de notificación cuando un atleta envía feedback (marca para el entrenador)
-- ====================================================================

CREATE TABLE notificacion_feedback (
    id SERIAL PRIMARY KEY,
    tipo VARCHAR(50) NOT NULL DEFAULT 'feedback_enviado',
    atleta_id INTEGER NOT NULL,
    objetivo_id INTEGER,
    semana_id INTEGER,
    fecha_envio TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resumen TEXT,
    leido BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_notif_atleta FOREIGN KEY (atleta_id)
        REFERENCES atleta(id) ON DELETE CASCADE,
    CONSTRAINT fk_notif_objetivo FOREIGN KEY (objetivo_id)
        REFERENCES objetivo(id) ON DELETE SET NULL,
    CONSTRAINT fk_notif_semana FOREIGN KEY (semana_id)
        REFERENCES semana_entrenamiento(id) ON DELETE SET NULL
);

COMMENT ON TABLE notificacion_feedback IS 'Notificaciones para entrenador cuando se envía feedback (manual read)';
COMMENT ON COLUMN notificacion_feedback.tipo IS 'Tipo de evento (ej: feedback_enviado)';
COMMENT ON COLUMN notificacion_feedback.resumen IS 'Resumen corto del feedback para mostrar en la lista de notificaciones';

CREATE INDEX idx_notif_atleta_id ON notificacion_feedback(atleta_id);
CREATE INDEX idx_notif_leido ON notificacion_feedback(leido);
CREATE INDEX idx_notif_fecha_envio ON notificacion_feedback(fecha_envio DESC);

-- Función y trigger: crear notificación al insertar feedback_semanal
CREATE OR REPLACE FUNCTION fn_notify_feedback_insert()
RETURNS TRIGGER AS $$
DECLARE
    v_objetivo_id INTEGER;
    v_atleta_id INTEGER;
    v_resumen TEXT;
BEGIN
    -- Obtener objetivo y atleta a partir de la semana
    SELECT objetivo_id INTO v_objetivo_id FROM semana_entrenamiento WHERE id = NEW.semana_id;
    IF v_objetivo_id IS NOT NULL THEN
        SELECT atleta_id INTO v_atleta_id FROM objetivo WHERE id = v_objetivo_id;
    END IF;

    v_resumen := COALESCE(NEW.sensaciones,'') || CASE WHEN NEW.molestias IS NOT NULL THEN ' | Molestias: ' || NEW.molestias ELSE '' END;

    INSERT INTO notificacion_feedback (tipo, atleta_id, objetivo_id, semana_id, fecha_envio, resumen, leido)
    VALUES ('feedback_enviado', v_atleta_id, v_objetivo_id, NEW.semana_id, CURRENT_TIMESTAMP, v_resumen, false);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_notify_feedback_insert
    AFTER INSERT ON feedback_semanal
    FOR EACH ROW
    EXECUTE FUNCTION fn_notify_feedback_insert();

-- ====================================================================
-- ÍNDICES ADICIONALES PARA OPTIMIZACIÓN
-- ====================================================================

-- Para búsquedas por usuario (relación many-to-many implícita)
CREATE INDEX idx_objetivo_activo ON objetivo(activo) WHERE activo = true;

-- Para reportes: semanas por rango de fecha
CREATE INDEX idx_semana_objetivo_fecha ON semana_entrenamiento(objetivo_id, fecha_inicio);

-- ====================================================================
-- VISTAS ÚTILES (Opcional, para V1)
-- ====================================================================

-- Vista: Obtener objetivo activo por atleta
CREATE OR REPLACE VIEW v_objetivo_activo AS
SELECT 
    a.id as atleta_id,
    a.nombre as atleta_nombre,
    o.id as objetivo_id,
    o.nombre as objetivo_nombre,
    o.fecha_objetivo,
    o.created_at as objetivo_creado
FROM atleta a
LEFT JOIN objetivo o ON a.id = o.atleta_id AND o.activo = true;

COMMENT ON VIEW v_objetivo_activo IS 
    'Vista para obtener rápidamente el objetivo activo de cada atleta';

-- ====================================================================
-- TRIGGERS (Recomendado para updated_at)
-- ====================================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION actualizar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a todas las tablas
CREATE TRIGGER trg_usuario_updated_at 
    BEFORE UPDATE ON usuario
    FOR EACH ROW 
    EXECUTE FUNCTION actualizar_updated_at();

CREATE TRIGGER trg_atleta_updated_at 
    BEFORE UPDATE ON atleta
    FOR EACH ROW 
    EXECUTE FUNCTION actualizar_updated_at();

CREATE TRIGGER trg_objetivo_updated_at 
    BEFORE UPDATE ON objetivo
    FOR EACH ROW 
    EXECUTE FUNCTION actualizar_updated_at();

CREATE TRIGGER trg_semana_updated_at 
    BEFORE UPDATE ON semana_entrenamiento
    FOR EACH ROW 
    EXECUTE FUNCTION actualizar_updated_at();

CREATE TRIGGER trg_sesion_updated_at 
    BEFORE UPDATE ON sesion_entrenamiento
    FOR EACH ROW 
    EXECUTE FUNCTION actualizar_updated_at();

CREATE TRIGGER trg_feedback_updated_at 
    BEFORE UPDATE ON feedback_semanal
    FOR EACH ROW 
    EXECUTE FUNCTION actualizar_updated_at();

-- ====================================================================
-- SEED DATA OPCIONAL (Para desarrollo)
-- ====================================================================

-- Descomenta para insertar datos de prueba:

/*
-- Usuario admin
INSERT INTO usuario (username, password_hash, rol) 
VALUES ('admin', '$2b$12$...', 'ADMIN');

-- Usuario atleta
INSERT INTO usuario (username, password_hash, rol)
VALUES ('juan', '$2b$12$...', 'ATLETA');

-- Atleta
INSERT INTO atleta (usuario_id, nombre, sexo, peso, dias_disponibles, km_medios_ultimos_2_meses)
VALUES (
    2,
    'Juan Pérez',
    'M',
    75.50,
    '["lunes", "martes", "miércoles", "jueves", "viernes", "sábado"]'::jsonb,
    45.5
);

-- Objetivo
INSERT INTO objetivo (atleta_id, nombre, fecha_objetivo, activo)
VALUES (1, 'Media maratón en 1:45', '2026-09-15', true);

-- Semana
INSERT INTO semana_entrenamiento (objetivo_id, fecha_inicio, fecha_fin)
VALUES (1, '2026-06-02', '2026-06-08');

-- Sesiones
INSERT INTO sesion_entrenamiento (semana_id, fecha, descripcion, kilometros_planificados)
VALUES 
    (1, '2026-06-02', '60 minutos Z2', 12.5),
    (1, '2026-06-04', '20 cal + 6x1000 + 10 enfr', 14.0),
    (1, '2026-06-06', '30 km suave', 30.0),
    (1, '2026-06-08', '20 minutos Z1', 5.0);

-- Feedback
INSERT INTO feedback_semanal (semana_id, completada, sensaciones, molestias)
VALUES (1, true, 'Me sentí bien, con energía', 'Ligera molestia en rodilla derecha');
*/

-- ====================================================================
-- FIN DEL SCRIPT
-- ====================================================================

COMMENT ON SCHEMA public IS 'Schema de Training Tool V1';

