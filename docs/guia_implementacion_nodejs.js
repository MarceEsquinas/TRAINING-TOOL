// ====================================================================
// TRAINING TOOL - Guía de Implementación con Node.js
// ====================================================================

// ====================================================================
// 1. SETUP DE BASE DE DATOS
// ====================================================================

/*
1.1 - Crear base de datos en PostgreSQL:

  psql -U postgres
  CREATE DATABASE training_tool ENCODING 'UTF8';
  
  -- Conectarse a la base de datos
  \c training_tool
  
  -- Ejecutar schema_v1.sql
  \i schema_v1.sql
  
  -- Verificar creación
  \dt  (lista tablas)
  \df  (lista funciones)
  \dv  (lista vistas)

1.2 - Verificar extensiones:
  SELECT extname FROM pg_extension;
  -- Debe mostrar: plpgsql, btree_gist

1.3 - Verificar ENUM types:
  SELECT typname FROM pg_type WHERE typtype = 'e';
  -- Debe mostrar: rol_enum, sexo_enum
*/

// ====================================================================
// 2. SETUP DE NODE.JS
// ====================================================================

// 2.1 - package.json (dependencias recomendadas)

/*
{
  "name": "training-tool-backend",
  "version": "1.0.0",
  "description": "Backend para gestión de entrenamientos",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "test": "jest"
  },
  "dependencies": {
    "pg": "^8.11.0",           // PostgreSQL client
    "bcrypt": "^5.1.1",        // Password hashing
    "jsonwebtoken": "^9.1.2",  // JWT tokens
    "express": "^4.18.2",      // Web framework
    "dotenv": "^16.3.1"        // Environment variables
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
*/

// 2.2 - Instalación
/*
npm install
npm install --save-dev nodemon
*/

// ====================================================================
// 3. CONFIGURACIÓN DE CONEXIÓN
// ====================================================================

// src/config/database.js

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'training_tool',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Manejo de errores de conexión
pool.on('error', (err) => {
  console.error('Error inesperado en el pool de conexión:', err);
  process.exit(-1);
});

module.exports = pool;

// .env (archivo de configuración)
/*
DB_HOST=localhost
DB_PORT=5432
DB_NAME=training_tool
DB_USER=postgres
DB_PASSWORD=postgres
NODE_ENV=development
JWT_SECRET=your_jwt_secret_here_change_in_production
*/

// ====================================================================
// 4. MODELOS DE BASE DE DATOS
// ====================================================================

// src/models/User.js

const pool = require('../config/database');
const bcrypt = require('bcrypt');

class User {
  // Obtener usuario por username
  static async findByUsername(username) {
    const result = await pool.query(
      'SELECT id, username, password_hash, rol FROM usuario WHERE username = $1',
      [username]
    );
    return result.rows[0];
  }

  // Obtener usuario por ID
  static async findById(id) {
    const result = await pool.query(
      'SELECT id, username, rol, created_at FROM usuario WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  // Crear usuario
  static async create(username, password, rol = 'ATLETA') {
    const passwordHash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      'INSERT INTO usuario (username, password_hash, rol) VALUES ($1, $2, $3) RETURNING id, username, rol, created_at',
      [username, passwordHash, rol]
    );
    return result.rows[0];
  }

  // Validar contraseña
  static async validatePassword(passwordHash, password) {
    return bcrypt.compare(password, passwordHash);
  }
}

module.exports = User;

// src/models/Athlete.js

const pool = require('../config/database');

class Athlete {
  // Obtener perfil de atleta por usuario_id
  static async findByUserId(userId) {
    const result = await pool.query(
      'SELECT id, usuario_id, nombre, sexo, peso, dias_disponibles, ' +
      'km_medios_ultimos_2_meses, lesiones_ultimo_anio, created_at, updated_at ' +
      'FROM atleta WHERE usuario_id = $1',
      [userId]
    );
    return result.rows[0];
  }

  // Crear atleta
  static async create(userId, nombre, sexo = null, peso = null, diasDisponibles = []) {
    const result = await pool.query(
      'INSERT INTO atleta (usuario_id, nombre, sexo, peso, dias_disponibles) ' +
      'VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [userId, nombre, sexo, peso, JSON.stringify(diasDisponibles)]
    );
    return result.rows[0];
  }

  // Actualizar perfil
  static async update(userId, data) {
    const fields = [];
    const values = [userId];
    let paramIndex = 2;

    if (data.nombre !== undefined) {
      fields.push(`nombre = $${paramIndex++}`);
      values.push(data.nombre);
    }
    if (data.peso !== undefined) {
      fields.push(`peso = $${paramIndex++}`);
      values.push(data.peso);
    }
    if (data.sexo !== undefined) {
      fields.push(`sexo = $${paramIndex++}`);
      values.push(data.sexo);
    }
    if (data.dias_disponibles !== undefined) {
      fields.push(`dias_disponibles = $${paramIndex++}`);
      values.push(JSON.stringify(data.dias_disponibles));
    }
    if (data.km_medios_ultimos_2_meses !== undefined) {
      fields.push(`km_medios_ultimos_2_meses = $${paramIndex++}`);
      values.push(data.km_medios_ultimos_2_meses);
    }
    if (data.lesiones_ultimo_anio !== undefined) {
      fields.push(`lesiones_ultimo_anio = $${paramIndex++}`);
      values.push(JSON.stringify(data.lesiones_ultimo_anio));
    }

    if (fields.length === 0) return null;

    const query = `UPDATE atleta SET ${fields.join(', ')} WHERE usuario_id = $1 RETURNING *`;
    const result = await pool.query(query, values);
    return result.rows[0];
  }
}

module.exports = Athlete;

// src/models/Objective.js

const pool = require('../config/database');

class Objective {
  // Obtener objetivo activo
  static async getActive(athleteId) {
    const result = await pool.query(
      'SELECT id, atleta_id, nombre, fecha_objetivo, activo, created_at ' +
      'FROM objetivo WHERE atleta_id = $1 AND activo = true',
      [athleteId]
    );
    return result.rows[0];
  }

  // Obtener todos los objetivos
  static async getAll(athleteId) {
    const result = await pool.query(
      'SELECT id, atleta_id, nombre, fecha_objetivo, activo, created_at ' +
      'FROM objetivo WHERE atleta_id = $1 ORDER BY created_at DESC',
      [athleteId]
    );
    return result.rows;
  }

  // Crear objetivo
  static async create(athleteId, nombre, fechaObjetivo) {
    const result = await pool.query(
      'INSERT INTO objetivo (atleta_id, nombre, fecha_objetivo, activo) ' +
      'VALUES ($1, $2, $3, false) RETURNING *',
      [athleteId, nombre, fechaObjetivo]
    );
    return result.rows[0];
  }

  // Activar objetivo (solo transaccional)
  static async activate(objectiveId, athleteId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Desactivar anterior
      await client.query(
        'UPDATE objetivo SET activo = false WHERE atleta_id = $1 AND activo = true',
        [athleteId]
      );
      
      // Activar nuevo
      const result = await client.query(
        'UPDATE objetivo SET activo = true WHERE id = $1 AND atleta_id = $2 RETURNING *',
        [objectiveId, athleteId]
      );
      
      await client.query('COMMIT');
      return result.rows[0];
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  // Obtener resumen del objetivo
  static async getSummary(objectiveId) {
    const result = await pool.query(
      'SELECT ' +
      'o.id, o.nombre, o.fecha_objetivo, o.activo, ' +
      'COUNT(DISTINCT s.id) as num_semanas, ' +
      'COUNT(DISTINCT ses.id) as num_sesiones, ' +
      'COALESCE(SUM(ses.kilometros_planificados), 0) as km_totales ' +
      'FROM objetivo o ' +
      'LEFT JOIN semana_entrenamiento s ON o.id = s.objetivo_id ' +
      'LEFT JOIN sesion_entrenamiento ses ON s.id = ses.semana_id ' +
      'WHERE o.id = $1 ' +
      'GROUP BY o.id',
      [objectiveId]
    );
    return result.rows[0];
  }
}

module.exports = Objective;

// src/models/Week.js

const pool = require('../config/database');

class Week {
  // Obtener semana actual
  static async getCurrent(objectiveId) {
    const result = await pool.query(
      'SELECT id, objetivo_id, fecha_inicio, fecha_fin, created_at ' +
      'FROM semana_entrenamiento ' +
      'WHERE objetivo_id = $1 ' +
      'AND fecha_inicio <= CURRENT_DATE ' +
      'AND fecha_fin >= CURRENT_DATE',
      [objectiveId]
    );
    return result.rows[0];
  }

  // Obtener próxima semana
  static async getNext(objectiveId) {
    const result = await pool.query(
      'SELECT id, objetivo_id, fecha_inicio, fecha_fin, created_at ' +
      'FROM semana_entrenamiento ' +
      'WHERE objetivo_id = $1 AND fecha_inicio > CURRENT_DATE ' +
      'ORDER BY fecha_inicio ASC LIMIT 1',
      [objectiveId]
    );
    return result.rows[0];
  }

  // Obtener todas las semanas
  static async getAll(objectiveId) {
    const result = await pool.query(
      'SELECT id, objetivo_id, fecha_inicio, fecha_fin, created_at ' +
      'FROM semana_entrenamiento ' +
      'WHERE objetivo_id = $1 ORDER BY fecha_inicio DESC',
      [objectiveId]
    );
    return result.rows;
  }

  // Crear semana
  static async create(objectiveId, fechaInicio, fechaFin) {
    const result = await pool.query(
      'INSERT INTO semana_entrenamiento (objetivo_id, fecha_inicio, fecha_fin) ' +
      'VALUES ($1, $2, $3) RETURNING *',
      [objectiveId, fechaInicio, fechaFin]
    );
    return result.rows[0];
  }

  // Obtener semana con sesiones y feedback
  static async getWithDetails(weekId) {
    const result = await pool.query(
      'SELECT ' +
      'w.id, w.objetivo_id, w.fecha_inicio, w.fecha_fin, ' +
      'json_agg( ' +
      '  CASE WHEN s.id IS NOT NULL THEN ' +
      '  json_build_object( ' +
      '    "id", s.id, ' +
      '    "fecha", s.fecha, ' +
      '    "descripcion", s.descripcion, ' +
      '    "kilometros_planificados", s.kilometros_planificados ' +
      '  ) ELSE NULL END ' +
      ') FILTER (WHERE s.id IS NOT NULL) as sesiones, ' +
      'json_build_object( ' +
      '  "id", fb.id, ' +
      '  "completada", fb.completada, ' +
      '  "sensaciones", fb.sensaciones, ' +
      '  "molestias", fb.molestias ' +
      ') as feedback ' +
      'FROM semana_entrenamiento w ' +
      'LEFT JOIN sesion_entrenamiento s ON w.id = s.semana_id ' +
      'LEFT JOIN feedback_semanal fb ON w.id = fb.semana_id ' +
      'WHERE w.id = $1 ' +
      'GROUP BY w.id, fb.id',
      [weekId]
    );
    return result.rows[0];
  }
}

module.exports = Week;

// src/models/Session.js

const pool = require('../config/database');

class Session {
  // Obtener sesiones de una semana
  static async getByWeek(weekId) {
    const result = await pool.query(
      'SELECT id, semana_id, fecha, descripcion, kilometros_planificados, created_at ' +
      'FROM sesion_entrenamiento WHERE semana_id = $1 ORDER BY fecha ASC',
      [weekId]
    );
    return result.rows;
  }

  // Crear sesión
  static async create(weekId, fecha, descripcion, kmPlanificados = null) {
    const result = await pool.query(
      'INSERT INTO sesion_entrenamiento (semana_id, fecha, descripcion, kilometros_planificados) ' +
      'VALUES ($1, $2, $3, $4) RETURNING *',
      [weekId, fecha, descripcion, kmPlanificados]
    );
    return result.rows[0];
  }

  // Actualizar sesión
  static async update(sessionId, data) {
    const fields = [];
    const values = [sessionId];
    let paramIndex = 2;

    if (data.descripcion !== undefined) {
      fields.push(`descripcion = $${paramIndex++}`);
      values.push(data.descripcion);
    }
    if (data.kilometros_planificados !== undefined) {
      fields.push(`kilometros_planificados = $${paramIndex++}`);
      values.push(data.kilometros_planificados);
    }
    if (data.fecha !== undefined) {
      fields.push(`fecha = $${paramIndex++}`);
      values.push(data.fecha);
    }

    if (fields.length === 0) return null;

    const query = `UPDATE sesion_entrenamiento SET ${fields.join(', ')} WHERE id = $1 RETURNING *`;
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Eliminar sesión
  static async delete(sessionId) {
    const result = await pool.query(
      'DELETE FROM sesion_entrenamiento WHERE id = $1 RETURNING id',
      [sessionId]
    );
    return result.rows[0];
  }
}

module.exports = Session;

// src/models/Feedback.js

const pool = require('../config/database');

class Feedback {
  // Obtener feedback de una semana
  static async getByWeek(weekId) {
    const result = await pool.query(
      'SELECT id, semana_id, completada, motivo_no_completada, ' +
      'sensaciones, molestias, ritmo_rodaje, created_at, updated_at ' +
      'FROM feedback_semanal WHERE semana_id = $1',
      [weekId]
    );
    return result.rows[0];
  }

  // Crear o actualizar feedback (UPSERT)
  static async upsert(weekId, data) {
    const result = await pool.query(
      'INSERT INTO feedback_semanal ' +
      '(semana_id, completada, motivo_no_completada, sensaciones, molestias, ritmo_rodaje) ' +
      'VALUES ($1, $2, $3, $4, $5, $6) ' +
      'ON CONFLICT (semana_id) ' +
      'DO UPDATE SET ' +
      'completada = EXCLUDED.completada, ' +
      'motivo_no_completada = EXCLUDED.motivo_no_completada, ' +
      'sensaciones = EXCLUDED.sensaciones, ' +
      'molestias = EXCLUDED.molestias, ' +
      'ritmo_rodaje = EXCLUDED.ritmo_rodaje ' +
      'RETURNING *',
      [
        weekId,
        data.completada || true,
        data.motivo_no_completada || null,
        data.sensaciones || null,
        data.molestias || null,
        data.ritmo_rodaje || null
      ]
    );
    return result.rows[0];
  }
}

module.exports = Feedback;

// ====================================================================
// 5. SERVICIOS
// ====================================================================

// src/services/AuthService.js

const User = require('../models/User');
const jwt = require('jsonwebtoken');

class AuthService {
  static async login(username, password) {
    const user = await User.findByUsername(username);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    const isValid = await User.validatePassword(user.password_hash, password);
    if (!isValid) {
      throw new Error('Contraseña incorrecta');
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, rol: user.rol },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return { token, user: { id: user.id, username: user.username, rol: user.rol } };
  }

  static async register(username, password) {
    const existingUser = await User.findByUsername(username);
    if (existingUser) {
      throw new Error('Username ya existe');
    }

    const newUser = await User.create(username, password, 'ATLETA');
    return newUser;
  }

  static async verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
      throw new Error('Token inválido');
    }
  }
}

module.exports = AuthService;

// ====================================================================
// 6. CONTROLADORES
// ====================================================================

// src/controllers/AuthController.js

const AuthService = require('../services/AuthService');

class AuthController {
  static async login(req, res) {
    try {
      const { username, password } = req.body;
      const result = await AuthService.login(username, password);
      res.json(result);
    } catch (error) {
      res.status(401).json({ error: error.message });
    }
  }

  static async register(req, res) {
    try {
      const { username, password } = req.body;
      const user = await AuthService.register(username, password);
      res.status(201).json(user);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = AuthController;

// src/controllers/ObjectiveController.js

const Objective = require('../models/Objective');

class ObjectiveController {
  static async getActive(req, res) {
    try {
      const { athleteId } = req.params;
      const objective = await Objective.getActive(athleteId);
      res.json(objective);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getAll(req, res) {
    try {
      const { athleteId } = req.params;
      const objectives = await Objective.getAll(athleteId);
      res.json(objectives);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async create(req, res) {
    try {
      const { athleteId } = req.params;
      const { nombre, fecha_objetivo } = req.body;
      const objective = await Objective.create(athleteId, nombre, fecha_objetivo);
      res.status(201).json(objective);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async activate(req, res) {
    try {
      const { objectiveId, athleteId } = req.params;
      const objective = await Objective.activate(objectiveId, athleteId);
      res.json(objective);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getSummary(req, res) {
    try {
      const { objectiveId } = req.params;
      const summary = await Objective.getSummary(objectiveId);
      res.json(summary);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = ObjectiveController;

// ====================================================================
// 7. MIDDLEWARE
// ====================================================================

// src/middleware/auth.js

const AuthService = require('../services/AuthService');

async function authMiddleware(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const decoded = AuthService.verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'No autorizado' });
  }
}

module.exports = authMiddleware;

// ====================================================================
// 8. RUTAS
// ====================================================================

// src/routes/auth.js

const express = require('express');
const AuthController = require('../controllers/AuthController');

const router = express.Router();

router.post('/login', AuthController.login);
router.post('/register', AuthController.register);

module.exports = router;

// src/routes/objectives.js

const express = require('express');
const ObjectiveController = require('../controllers/ObjectiveController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

router.get('/:athleteId/active', ObjectiveController.getActive);
router.get('/:athleteId', ObjectiveController.getAll);
router.post('/:athleteId', ObjectiveController.create);
router.put('/:objectiveId/:athleteId/activate', ObjectiveController.activate);
router.get('/:objectiveId/summary', ObjectiveController.getSummary);

module.exports = router;

// ====================================================================
// 9. APLICACIÓN PRINCIPAL
// ====================================================================

// src/index.js

const express = require('express');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const objectiveRoutes = require('./routes/objectives');

const app = express();

// Middleware
app.use(express.json());

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/objectives', objectiveRoutes);

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Error interno del servidor' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en puerto ${PORT}`);
});

// ====================================================================
// 10. PASOS SIGUIENTES
// ====================================================================

/*
CHECKLIST DE IMPLEMENTACIÓN:

✅ 1. Crear base de datos y ejecutar schema_v1.sql
✅ 2. Crear estructura de carpetas:
    src/
    ├── config/
    ├── controllers/
    ├── middleware/
    ├── models/
    ├── routes/
    ├── services/
    └── index.js

✅ 3. Instalar dependencias de Node.js
✅ 4. Crear archivos .env con credenciales BD
✅ 5. Implementar modelos de datos
✅ 6. Implementar servicios de negocio
✅ 7. Implementar controladores
✅ 8. Definir rutas API
✅ 9. Añadir middleware de autenticación
✅ 10. Testar endpoints con Postman/Thunder Client

ENDPOINTS RECOMENDADOS:

Auth:
  POST   /api/auth/register
  POST   /api/auth/login

Objetivos:
  GET    /api/objectives/:athleteId/active
  GET    /api/objectives/:athleteId
  POST   /api/objectives/:athleteId
  PUT    /api/objectives/:objectiveId/:athleteId/activate

Semanas:
  GET    /api/weeks/:objectiveId/current
  GET    /api/weeks/:objectiveId/next
  GET    /api/weeks/:objectiveId
  POST   /api/weeks/:objectiveId
  GET    /api/weeks/:weekId

Sesiones:
  GET    /api/sessions/:weekId
  POST   /api/sessions/:weekId
  PUT    /api/sessions/:sessionId
  DELETE /api/sessions/:sessionId

Feedback:
  GET    /api/feedback/:weekId
  POST   /api/feedback/:weekId

TESTS RECOMENDADOS:

- Crear usuario e intentar login
- Activar objetivo
- Crear semana sin solapamientos
- Intentar crear semana solapada (debe fallar)
- Crear sesiones
- Registrar feedback incompleto sin motivo (debe fallar)

CONSIDERACIONES FUTURAS:

1. Agregar índices adicionales si hay queries lentos
2. Implementar soft deletes si es necesario historial
3. Considerar cache con Redis para objetivos activos
4. Añadir paginación en listados
5. Implementar validaciones más estrictas
6. Agregar tests unitarios y de integración
*/

