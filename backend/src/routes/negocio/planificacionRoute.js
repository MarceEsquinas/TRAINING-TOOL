import express from 'express';
import {
	getPlanificacionAtleta,
	getPropuestaNuevaSemana,
	createSemanaDesdePlanificacion,
} from '../../controllers/negocio/planificacionController.js';

const router = express.Router();

// Rutas de negocio de planificación.
router.get('/planificacion/:atletaId', getPlanificacionAtleta);
router.get('/planificacion/:atletaId/semanas/propuesta', getPropuestaNuevaSemana);
router.post('/planificacion/:atletaId/semanas', createSemanaDesdePlanificacion);

export default router;