import express from 'express';
import {
	getPlanificacionAtleta,
	getPropuestaNuevaSemana,
	createSemanaDesdePlanificacion,
	createSesionSemanaDesdePlanificacion,
	registrarResultadoSesionDesdePlanificacion,
	registrarMarcaObjetivoDesdePlanificacion,
} from '../../controllers/negocio/planificacionController.js';
import { verificarToken } from '../../middleware/verificarToken.js';
import { verificarRol } from '../../middleware/verificarRol.js';

const router = express.Router();

// Solo ADMIN y ENTRENADOR gestionan planificación.
const soloPlanificadores = [verificarToken, verificarRol('ADMIN', 'ENTRENADOR')];

router.get('/planificacion/:atletaId', ...soloPlanificadores, getPlanificacionAtleta);
router.get('/planificacion/:atletaId/semanas/propuesta', ...soloPlanificadores, getPropuestaNuevaSemana);
router.post('/planificacion/:atletaId/semanas', ...soloPlanificadores, createSemanaDesdePlanificacion);
router.post('/planificacion/:atletaId/semanas/:semanaId/sesiones', ...soloPlanificadores, createSesionSemanaDesdePlanificacion);
router.patch('/planificacion/:atletaId/semanas/:semanaId/sesiones/:sesionId/resultado', ...soloPlanificadores, registrarResultadoSesionDesdePlanificacion);
router.patch('/planificacion/:atletaId/objetivos/:objetivoId/marca', ...soloPlanificadores, registrarMarcaObjetivoDesdePlanificacion);

export default router;