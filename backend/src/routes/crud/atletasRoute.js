import express from 'express';
import { getAtletas, getAtletaById, updateAtletaById, postAtletas, deleteAtletaById } from '../../controllers/crud/atletasController.js';
import { verificarToken } from '../../middleware/verificarToken.js';
import { verificarRol } from '../../middleware/verificarRol.js';

const router = express.Router();

const adminEntrenador = [verificarToken, verificarRol('ADMIN', 'ENTRENADOR')];

router.get('/atletas', ...adminEntrenador, getAtletas);
router.get('/atletas/:id', ...adminEntrenador, getAtletaById);
router.post('/atletas', ...adminEntrenador, postAtletas);
router.put('/atletas/:id', ...adminEntrenador, updateAtletaById);
router.delete('/atletas/:id', verificarToken, verificarRol('ADMIN'), deleteAtletaById);

export default router;