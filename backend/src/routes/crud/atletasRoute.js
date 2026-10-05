import express from 'express';
import { getAtletas, getAtletaById, updateAtletaById, postAtletas, deleteAtletaById } from '../../controllers/crud/atletasController.js';
import { verificarToken } from '../../middleware/verificarToken.js';
import { verificarRol } from '../../middleware/verificarRol.js';

const router = express.Router();

// El atleta usa /perfil para sus datos; este CRUD es de gestión.
router.use('/atletas', verificarToken, verificarRol('ADMIN', 'ENTRENADOR'));

// Rutas CRUD de atletas.
router.get('/atletas', getAtletas);
router.get('/atletas/:id', getAtletaById);
router.put('/atletas/:id', updateAtletaById);
router.delete('/atletas/:id', deleteAtletaById);
router.post('/atletas', postAtletas);

export default router;