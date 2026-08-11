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

const adminEntrenador = [verificarToken, verificarRol('ADMIN', 'ENTRENADOR')];

router.get('/sesionesEntrenamiento', ...adminEntrenador, getSesionesEntrenamiento);
router.get('/semanasEntrenamiento/:semanaId/sesiones', ...adminEntrenador, getSesionesEntrenamientoBySemanaId);
router.get('/sesionesEntrenamiento/:id', ...adminEntrenador, getSesionEntrenamientoById);
router.post('/sesionesEntrenamiento', ...adminEntrenador, postSesionEntrenamiento);
router.put('/sesionesEntrenamiento/:id', ...adminEntrenador, updateSesionEntrenamientoById);
router.delete('/sesionesEntrenamiento/:id', ...adminEntrenador, deleteSesionEntrenamientoById);

export default router;