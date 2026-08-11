import express from 'express';
import { getUsuarios, getUsuarioById, postUsuarios, updateUsuarioById, deleteUsuarioById } from '../../controllers/crud/usuarioController.js';
import { verificarToken } from '../../middleware/verificarToken.js';
import { verificarRol } from '../../middleware/verificarRol.js';

const router = express.Router();

// Solo ADMIN gestiona usuarios directamente.
const soloAdmin = [verificarToken, verificarRol('ADMIN')];

router.get('/usuarios', ...soloAdmin, getUsuarios);
router.get('/usuarios/:id', ...soloAdmin, getUsuarioById);
router.post('/usuarios', ...soloAdmin, postUsuarios);
router.put('/usuarios/:id', ...soloAdmin, updateUsuarioById);
router.delete('/usuarios/:id', ...soloAdmin, deleteUsuarioById);

export default router;