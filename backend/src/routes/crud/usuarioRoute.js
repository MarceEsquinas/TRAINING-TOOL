import express from 'express';
import { getUsuarios, getUsuarioById, postUsuarios, updateUsuarioById, deleteUsuarioById } from '../../controllers/crud/usuarioController.js';
import { verificarToken } from '../../middleware/verificarToken.js';
import { verificarRol } from '../../middleware/verificarRol.js';

const router = express.Router();

// Cuentas y contraseñas: solo ADMIN.
router.use('/usuarios', verificarToken, verificarRol('ADMIN'));

// Rutas CRUD de usuarios.
router.get('/usuarios', getUsuarios);
router.get('/usuarios/:id', getUsuarioById);
router.put('/usuarios/:id', updateUsuarioById);
router.delete('/usuarios/:id', deleteUsuarioById);
router.post('/usuarios', postUsuarios);

export default router;