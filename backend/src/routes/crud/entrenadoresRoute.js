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

// Solo ADMIN gestiona entrenadores.
const soloAdmin = [verificarToken, verificarRol('ADMIN')];

router.get('/entrenadores', ...soloAdmin, getEntrenadores);
router.get('/entrenadores/:id', ...soloAdmin, getEntrenadorById);
router.post('/entrenadores', ...soloAdmin, postEntrenadores);
router.put('/entrenadores/:id', ...soloAdmin, updateEntrenadorById);

export default router;
