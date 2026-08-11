import express from 'express';
import { getSemanasEntrenamiento, getSemanaEntrenamientoById, postSemanaEntrenamiento, updateSemanaEntrenamientoById, deleteSemanaEntrenamientoById } from '../../controllers/crud/semanaEntrenamientoController.js';
import { verificarToken } from '../../middleware/verificarToken.js';
import { verificarRol } from '../../middleware/verificarRol.js';

const router = express.Router();

const adminEntrenador = [verificarToken, verificarRol('ADMIN', 'ENTRENADOR')];

router.get('/semanasEntrenamiento', ...adminEntrenador, getSemanasEntrenamiento);
router.get('/semanasEntrenamiento/:id', ...adminEntrenador, getSemanaEntrenamientoById);
router.post('/semanasEntrenamiento', ...adminEntrenador, postSemanaEntrenamiento);
router.put('/semanasEntrenamiento/:id', ...adminEntrenador, updateSemanaEntrenamientoById);
router.delete('/semanasEntrenamiento/:id', ...adminEntrenador, deleteSemanaEntrenamientoById);

export default router;