import {
  getHistorialCompletoAtletaData,
  getHistorialObjetivosAtletaData,
  getHistorialPlanificacionObjetivoData,
  getHistorialFeedbackAtletaData,
  getDetalleFeedbackData,
} from '../../services/negocio/historialAtletaService.js';
import { ServiceError } from '../../services/serviceError.js';

// Controlador para GET /historial/atletas/:atletaId
export async function getHistorialCompletoAtleta(req, res) {
  try {
    const { atletaId } = req.params;
    const data = await getHistorialCompletoAtletaData(atletaId);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    if (error instanceof ServiceError) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    console.error('Error al obtener historial completo del atleta:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener historial completo del atleta',
      error: error.message,
    });
  }
}

// Controlador para GET /historial/atletas/:atletaId/objetivos
export async function getHistorialObjetivosAtleta(req, res) {
  try {
    const { atletaId } = req.params;
    const result = await getHistorialObjetivosAtletaData(atletaId);

    return res.status(200).json({
      success: true,
      atleta: result.atleta,
      data: result.data,
      count: result.count,
    });
  } catch (error) {
    if (error instanceof ServiceError) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    console.error('Error al obtener historial de objetivos del atleta:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener historial de objetivos del atleta',
      error: error.message,
    });
  }
}

// Controlador para GET /historial/objetivos/:objetivoId/planificacion
export async function getHistorialPlanificacionObjetivo(req, res) {
  try {
    const { objetivoId } = req.params;
    const result = await getHistorialPlanificacionObjetivoData(objetivoId);

    return res.status(200).json({
      success: true,
      objetivo: result.objetivo,
      data: result.data,
      count: result.count,
    });
  } catch (error) {
    if (error instanceof ServiceError) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    console.error('Error al obtener historial de planificación del objetivo:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener historial de planificación del objetivo',
      error: error.message,
    });
  }
}

// Controlador para GET /historial/atletas/:atletaId/feedback
export async function getHistorialFeedbackAtleta(req, res) {
  try {
    const { atletaId } = req.params;
    const result = await getHistorialFeedbackAtletaData(atletaId);

    return res.status(200).json({
      success: true,
      atleta: result.atleta,
      data: result.data,
      count: result.count,
    });
  } catch (error) {
    if (error instanceof ServiceError) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    console.error('Error al obtener historial resumido de feedback del atleta:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener historial resumido de feedback del atleta',
      error: error.message,
    });
  }
}

// Controlador para GET /historial/feedback/:feedbackId
export async function getDetalleFeedback(req, res) {
  try {
    const { feedbackId } = req.params;
    const data = await getDetalleFeedbackData(feedbackId);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    if (error instanceof ServiceError) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    console.error('Error al obtener detalle de feedback:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener detalle de feedback',
      error: error.message,
    });
  }
}
