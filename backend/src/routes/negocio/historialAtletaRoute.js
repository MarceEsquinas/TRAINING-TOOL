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
import { verificarAtletaPropio } from '../../middleware/verificarAtletaPropio.js';

const router = express.Router();

// Historial: solo lectura. El atleta consulta únicamente el suyo.
router.use('/historial', verificarToken, verificarRol('ADMIN', 'ENTRENADOR', 'ATLETA'));

// Ruta para obtener el historial completo de un atleta.
router.get('/historial/atletas/:atletaId', verificarAtletaPropio, getHistorialCompletoAtleta);

// Ruta para obtener el historial de objetivos de un atleta.
router.get('/historial/atletas/:atletaId/objetivos', verificarAtletaPropio, getHistorialObjetivosAtleta);

// Ruta para obtener el historial de planificación de un objetivo (pertenencia en el servicio).
router.get('/historial/objetivos/:objetivoId/planificacion', getHistorialPlanificacionObjetivo);

// Ruta para obtener el historial resumido de feedback de un atleta.
router.get('/historial/atletas/:atletaId/feedback', verificarAtletaPropio, getHistorialFeedbackAtleta);

// Ruta para obtener el detalle de un feedback concreto (pertenencia en el servicio).
router.get('/historial/feedback/:feedbackId', getDetalleFeedback);

export default router;
