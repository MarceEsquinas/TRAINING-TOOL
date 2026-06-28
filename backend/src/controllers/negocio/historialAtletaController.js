import {
  getAtletaById,
  getObjetivoById,
  getHistorialObjetivosByAtletaId,
  getHistorialPlanificacionByObjetivoId,
  getHistorialFeedbackResumenByAtletaId,
  getDetalleFeedbackById,
} from '../../services/negocio/historialAtletaService.js';

function esNumeroValido(valor) {
  return valor && !Number.isNaN(Number(valor));
}

// Controlador para GET /historial/atletas/:atletaId
export async function getHistorialCompletoAtleta(req, res) {
  try {
    const { atletaId } = req.params;

    if (!esNumeroValido(atletaId)) {
      return res.status(400).json({
        success: false,
        message: 'El atletaId debe ser un número válido',
      });
    }

    const atletaResult = await getAtletaById(atletaId);
    if (atletaResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No se encontró atleta con id ${atletaId}`,
      });
    }

    const objetivosResult = await getHistorialObjetivosByAtletaId(atletaId);
    const feedbackResult = await getHistorialFeedbackResumenByAtletaId(atletaId);

    const objetivosConPlanificacion = await Promise.all(
      objetivosResult.rows.map(async (objetivo) => {
        const planificacionResult = await getHistorialPlanificacionByObjetivoId(objetivo.objetivo_id);

        return {
          id: objetivo.objetivo_id,
          nombre: objetivo.nombre_objetivo,
          distancia: objetivo.distancia !== null ? Number(objetivo.distancia) : null,
          fecha_objetivo: objetivo.fecha_objetivo,
          estado: objetivo.estado,
          planificacion: planificacionResult.rows.map((semana) => ({
            semana_id: semana.semana_id,
            fecha_inicio: semana.fecha_inicio,
            fecha_fin: semana.fecha_fin,
            kilometros_realizados: Number(semana.kilometros_realizados),
            kilometros_planificados: Number(semana.kilometros_planificados),
          })),
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: {
        atleta: atletaResult.rows[0],
        objetivos: objetivosConPlanificacion,
        feedback_resumen: feedbackResult.rows.map((feedback) => ({
          feedback_id: feedback.feedback_id,
          fecha_feedback: feedback.fecha_feedback,
          completada: feedback.completada,
          resumen_corto: feedback.resumen_corto,
          semana_id: feedback.semana_id,
          semana_fecha_inicio: feedback.semana_fecha_inicio,
          semana_fecha_fin: feedback.semana_fecha_fin,
          objetivo_id: feedback.objetivo_id,
          objetivo_nombre: feedback.objetivo_nombre,
        })),
      },
    });
  } catch (error) {
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

    if (!esNumeroValido(atletaId)) {
      return res.status(400).json({
        success: false,
        message: 'El atletaId debe ser un número válido',
      });
    }

    const atletaResult = await getAtletaById(atletaId);
    if (atletaResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No se encontró atleta con id ${atletaId}`,
      });
    }

    const result = await getHistorialObjetivosByAtletaId(atletaId);

    return res.status(200).json({
      success: true,
      atleta: atletaResult.rows[0],
      data: result.rows.map((objetivo) => ({
        id: objetivo.objetivo_id,
        nombre: objetivo.nombre_objetivo,
        distancia: objetivo.distancia !== null ? Number(objetivo.distancia) : null,
        fecha_objetivo: objetivo.fecha_objetivo,
        estado: objetivo.estado,
      })),
      count: result.rows.length,
    });
  } catch (error) {
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

    if (!esNumeroValido(objetivoId)) {
      return res.status(400).json({
        success: false,
        message: 'El objetivoId debe ser un número válido',
      });
    }

    const objetivoResult = await getObjetivoById(objetivoId);
    if (objetivoResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No se encontró objetivo con id ${objetivoId}`,
      });
    }

    const result = await getHistorialPlanificacionByObjetivoId(objetivoId);

    return res.status(200).json({
      success: true,
      objetivo: objetivoResult.rows[0],
      data: result.rows.map((semana) => ({
        semana_id: semana.semana_id,
        fecha_inicio: semana.fecha_inicio,
        fecha_fin: semana.fecha_fin,
        kilometros_realizados: Number(semana.kilometros_realizados),
          kilometros_planificados: Number(semana.kilometros_planificados),
      })),
      count: result.rows.length,
    });
  } catch (error) {
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

    if (!esNumeroValido(atletaId)) {
      return res.status(400).json({
        success: false,
        message: 'El atletaId debe ser un número válido',
      });
    }

    const atletaResult = await getAtletaById(atletaId);
    if (atletaResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No se encontró atleta con id ${atletaId}`,
      });
    }

    const result = await getHistorialFeedbackResumenByAtletaId(atletaId);

    return res.status(200).json({
      success: true,
      atleta: atletaResult.rows[0],
      data: result.rows.map((feedback) => ({
        feedback_id: feedback.feedback_id,
        fecha_feedback: feedback.fecha_feedback,
        completada: feedback.completada,
        resumen_corto: feedback.resumen_corto,
        semana_id: feedback.semana_id,
        semana_fecha_inicio: feedback.semana_fecha_inicio,
        semana_fecha_fin: feedback.semana_fecha_fin,
        objetivo_id: feedback.objetivo_id,
        objetivo_nombre: feedback.objetivo_nombre,
      })),
      count: result.rows.length,
    });
  } catch (error) {
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

    if (!esNumeroValido(feedbackId)) {
      return res.status(400).json({
        success: false,
        message: 'El feedbackId debe ser un número válido',
      });
    }

    const result = await getDetalleFeedbackById(feedbackId);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No se encontró feedback con id ${feedbackId}`,
      });
    }

    return res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error al obtener detalle de feedback:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener detalle de feedback',
      error: error.message,
    });
  }
}
