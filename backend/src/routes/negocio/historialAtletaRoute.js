import express from 'express';
import {
  getHistorialCompletoAtleta,
  getHistorialObjetivosAtleta,
  getHistorialPlanificacionObjetivo,
  getHistorialFeedbackAtleta,
  getDetalleFeedback,
} from '../../controllers/negocio/historialAtletaController.js';

const router = express.Router();

// Ruta para obtener el historial completo de un atleta.
router.get('/historial/atletas/:atletaId', getHistorialCompletoAtleta);

// Ruta para obtener el historial de objetivos de un atleta.
router.get('/historial/atletas/:atletaId/objetivos', getHistorialObjetivosAtleta);

// Ruta para obtener el historial de planificación de un objetivo.
router.get('/historial/objetivos/:objetivoId/planificacion', getHistorialPlanificacionObjetivo);

// Ruta para obtener el historial resumido de feedback de un atleta.
router.get('/historial/atletas/:atletaId/feedback', getHistorialFeedbackAtleta);

// Ruta para obtener el detalle de un feedback concreto.
router.get('/historial/feedback/:feedbackId', getDetalleFeedback);

export default router;
