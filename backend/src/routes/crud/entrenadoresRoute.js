import express from 'express';
import {
  getEntrenadores,
  getEntrenadorById,
  postEntrenadores,
  updateEntrenadorById,
} from '../../controllers/crud/entrenadoresController.js';
import { verificarToken } from '../../middleware/verificarToken.js';
import { verificarRol } from '../../middleware/verificarRol.js';

const router = express.Router();

// Gestión de entrenadores: solo ADMIN.
router.use('/entrenadores', verificarToken, verificarRol('ADMIN'));

// Rutas CRUD de entrenadores.
router.get('/entrenadores', getEntrenadores);
router.get('/entrenadores/:id', getEntrenadorById);
router.post('/entrenadores', postEntrenadores);
router.put('/entrenadores/:id', updateEntrenadorById);

export default router;
