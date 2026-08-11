import express from 'express';
import { getObjetivos, getObjetivoById, postObjetivo, updateObjetivoById, deleteObjetivoById } from '../../controllers/crud/objetivoController.js';
import { verificarToken } from '../../middleware/verificarToken.js';
import { verificarRol } from '../../middleware/verificarRol.js';

const router = express.Router();

const adminEntrenador = [verificarToken, verificarRol('ADMIN', 'ENTRENADOR')];

router.get('/objetivos', ...adminEntrenador, getObjetivos);
router.get('/objetivos/:id', ...adminEntrenador, getObjetivoById);
router.post('/objetivos', ...adminEntrenador, postObjetivo);
router.put('/objetivos/:id', ...adminEntrenador, updateObjetivoById);
router.delete('/objetivos/:id', ...adminEntrenador, deleteObjetivoById);

export default router;