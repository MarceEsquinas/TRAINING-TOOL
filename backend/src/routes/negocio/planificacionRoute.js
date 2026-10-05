import express from 'express';
import {
	getPlanificacionAtleta,
	getSemanasObjetivoActivo,
	getPropuestaNuevaSemana,
	createSemanaDesdePlanificacion,
	createSesionSemanaDesdePlanificacion,
	registrarResultadoSesionDesdePlanificacion,
	registrarMarcaObjetivoDesdePlanificacion,
	enviarFeedbackSemanaDesdePlanificacion,
} from '../../controllers/negocio/planificacionController.js';
import { verificarToken } from '../../middleware/verificarToken.js';
import { verificarRol } from '../../middleware/verificarRol.js';
import { verificarAtletaPropio } from '../../middleware/verificarAtletaPropio.js';

const router = express.Router();

const TODOS = verificarRol('ADMIN', 'ENTRENADOR', 'ATLETA');
const GESTION = verificarRol('ADMIN', 'ENTRENADOR');

// Rutas de negocio de planificación.
// Lectura: el atleta solo la suya. Gestión del plan: solo entrenador/admin.
router.get('/planificacion/:atletaId', verificarToken, TODOS, verificarAtletaPropio, getPlanificacionAtleta);
router.get('/planificacion/:atletaId/semanas/propuesta', verificarToken, GESTION, getPropuestaNuevaSemana);
router.get('/planificacion/:atletaId/semanas', verificarToken, TODOS, verificarAtletaPropio, getSemanasObjetivoActivo);
router.post('/planificacion/:atletaId/semanas', verificarToken, GESTION, createSemanaDesdePlanificacion);
router.post('/planificacion/:atletaId/semanas/:semanaId/sesiones', verificarToken, GESTION, createSesionSemanaDesdePlanificacion);
// El atleta registra sus km realizados; la regla de "solo semana actual" vive en el servicio.
router.patch('/planificacion/:atletaId/semanas/:semanaId/sesiones/:sesionId/resultado', verificarToken, TODOS, verificarAtletaPropio, registrarResultadoSesionDesdePlanificacion);
// El feedback semanal lo envía solo el atleta, y solo el suyo.
router.post('/planificacion/:atletaId/semanas/:semanaId/feedback', verificarToken, verificarRol('ATLETA'), verificarAtletaPropio, enviarFeedbackSemanaDesdePlanificacion);
router.patch('/planificacion/:atletaId/objetivos/:objetivoId/marca', verificarToken, GESTION, registrarMarcaObjetivoDesdePlanificacion);

export default router;