import express from 'express';
import {
	getSesionesEntrenamiento,
	getSesionesEntrenamientoBySemanaId,
	getSesionEntrenamientoById,
	postSesionEntrenamiento,
	updateSesionEntrenamientoById,
	deleteSesionEntrenamientoById,
} from '../../controllers/crud/sesionEntrenamientoController.js';
import { verificarToken } from '../../middleware/verificarToken.js';
import { verificarRol } from '../../middleware/verificarRol.js';

const router = express.Router();
const GESTION = [verificarToken, verificarRol('ADMIN', 'ENTRENADOR')];

// Sesiones de una semana: el atleta solo las de su semana (pertenencia en el servicio).
router.get('/semanasEntrenamiento/:semanaId/sesiones', verificarToken, verificarRol('ADMIN', 'ENTRENADOR', 'ATLETA'), getSesionesEntrenamientoBySemanaId);

// Resto del CRUD de sesiones: gestión.
router.get('/sesionesEntrenamiento', ...GESTION, getSesionesEntrenamiento);
router.get('/sesionesEntrenamiento/:id', ...GESTION, getSesionEntrenamientoById);
router.put('/sesionesEntrenamiento/:id', ...GESTION, updateSesionEntrenamientoById);
router.delete('/sesionesEntrenamiento/:id', ...GESTION, deleteSesionEntrenamientoById);
router.post('/sesionesEntrenamiento', ...GESTION, postSesionEntrenamiento);

export default router;