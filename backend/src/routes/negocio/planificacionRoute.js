import express from 'express';
import {
	getPlanificacionAtleta,
	getPropuestaNuevaSemana,
	createSemanaDesdePlanificacion,
	createSesionSemanaDesdePlanificacion,
	registrarResultadoSesionDesdePlanificacion,
	registrarMarcaObjetivoDesdePlanificacion,
} from '../../controllers/negocio/planificacionController.js';

const router = express.Router();

// Rutas de negocio de planificación.
router.get('/planificacion/:atletaId', getPlanificacionAtleta);
router.get('/planificacion/:atletaId/semanas/propuesta', getPropuestaNuevaSemana);
router.post('/planificacion/:atletaId/semanas', createSemanaDesdePlanificacion);
router.post('/planificacion/:atletaId/semanas/:semanaId/sesiones', createSesionSemanaDesdePlanificacion);
router.patch('/planificacion/:atletaId/semanas/:semanaId/sesiones/:sesionId/resultado', registrarResultadoSesionDesdePlanificacion);
router.patch('/planificacion/:atletaId/objetivos/:objetivoId/marca', registrarMarcaObjetivoDesdePlanificacion);

export default router;