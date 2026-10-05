import express from 'express';
import { getSemanasEntrenamiento, getSemanaEntrenamientoById, postSemanaEntrenamiento, updateSemanaEntrenamientoById, deleteSemanaEntrenamientoById } from '../../controllers/crud/semanaEntrenamientoController.js';
import { verificarToken } from '../../middleware/verificarToken.js';
import { verificarRol } from '../../middleware/verificarRol.js';

const router = express.Router();
const GESTION = [verificarToken, verificarRol('ADMIN', 'ENTRENADOR')];

// Por ruta y no por prefijo: /semanasEntrenamiento/:id/sesiones (otro router) debe admitir al atleta.
router.get('/semanasEntrenamiento', ...GESTION, getSemanasEntrenamiento);
router.get('/semanasEntrenamiento/:id', ...GESTION, getSemanaEntrenamientoById);
router.put('/semanasEntrenamiento/:id', ...GESTION, updateSemanaEntrenamientoById);
router.delete('/semanasEntrenamiento/:id', ...GESTION, deleteSemanaEntrenamientoById);
router.post('/semanasEntrenamiento', ...GESTION, postSemanaEntrenamiento);

export default router;