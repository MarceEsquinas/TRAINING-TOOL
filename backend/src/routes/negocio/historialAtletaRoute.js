import express from 'express';
import {
  getHistorialCompletoAtleta,
  getHistorialObjetivosAtleta,
  getHistorialPlanificacionObjetivo,
  getHistorialFeedbackAtleta,
  getDetalleFeedback,
} from '../../controllers/negocio/historialAtletaController.js';
import { verificarToken } from '../../middleware/verificarToken.js';
import { verificarRol } from '../../middleware/verificarRol.js';

const router = express.Router();

const soloAdminEntrenador = [verificarToken, verificarRol('ADMIN', 'ENTRENADOR')];

router.get('/historial/atletas/:atletaId', ...soloAdminEntrenador, getHistorialCompletoAtleta);
router.get('/historial/atletas/:atletaId/objetivos', ...soloAdminEntrenador, getHistorialObjetivosAtleta);
router.get('/historial/objetivos/:objetivoId/planificacion', ...soloAdminEntrenador, getHistorialPlanificacionObjetivo);
router.get('/historial/atletas/:atletaId/feedback', ...soloAdminEntrenador, getHistorialFeedbackAtleta);
router.get('/historial/feedback/:feedbackId', ...soloAdminEntrenador, getDetalleFeedback);

export default router;
