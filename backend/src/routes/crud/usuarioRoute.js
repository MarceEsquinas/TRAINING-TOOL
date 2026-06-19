import express from 'express';
import { getUsuarios, getUsuarioById, postUsuarios, updateUsuarioById, deleteUsuarioById } from '../../controllers/crud/usuarioController.js';

const router = express.Router();

// Rutas CRUD de usuarios.
router.get('/usuarios', getUsuarios);
router.get('/usuarios/:id', getUsuarioById);
router.put('/usuarios/:id', updateUsuarioById);
router.delete('/usuarios/:id', deleteUsuarioById);
router.post('/usuarios', postUsuarios);

export default router;