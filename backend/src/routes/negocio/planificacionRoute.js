import express from 'express';
import { getPlanificacionAtleta } from '../../controllers/negocio/planificacionController.js';

const router = express.Router();

// Rutas de negocio de planificación.
router.get('/planificacion/:atletaId', getPlanificacionAtleta);

export default router;