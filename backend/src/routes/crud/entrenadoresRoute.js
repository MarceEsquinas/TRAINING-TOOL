import express from 'express';
import {
  getEntrenadores,
  getEntrenadorById,
  postEntrenadores,
  updateEntrenadorById,
} from '../../controllers/crud/entrenadoresController.js';

const router = express.Router();

// Rutas CRUD de entrenadores.
router.get('/entrenadores', getEntrenadores);
router.get('/entrenadores/:id', getEntrenadorById);
router.post('/entrenadores', postEntrenadores);
router.put('/entrenadores/:id', updateEntrenadorById);

export default router;
