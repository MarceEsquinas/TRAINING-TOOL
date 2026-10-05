import express from 'express';
import { getObjetivos, getObjetivoById, postObjetivo, updateObjetivoById, deleteObjetivoById } from '../../controllers/crud/objetivoController.js';
import { verificarToken } from '../../middleware/verificarToken.js';
import { verificarRol } from '../../middleware/verificarRol.js';

const router = express.Router();

// Rutas CRUD de objetivos: el atleta solo lee los suyos; el resto es del entrenador/admin.
router.get('/objetivos', verificarToken, verificarRol('ADMIN', 'ENTRENADOR', 'ATLETA'), getObjetivos);
router.get('/objetivos/:id', verificarToken, verificarRol('ADMIN', 'ENTRENADOR', 'ATLETA'), getObjetivoById);
router.put('/objetivos/:id', verificarToken, verificarRol('ADMIN', 'ENTRENADOR'), updateObjetivoById);
router.delete('/objetivos/:id', verificarToken, verificarRol('ADMIN', 'ENTRENADOR'), deleteObjetivoById);
router.post('/objetivos', verificarToken, verificarRol('ADMIN', 'ENTRENADOR'), postObjetivo);

export default router;