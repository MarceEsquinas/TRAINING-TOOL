import {
  listFeedback,
  findFeedbackById,
  createFeedback,
  updateFeedback,
  deleteFeedback,
} from '../../services/crud/feedbackService.js';
import { ServiceError } from '../../services/serviceError.js';

// Controlador para listar todos los registros de feedback.
export async function getFeedback(req, res) {
  try {
    const feedback = await listFeedback();

    return res.status(200).json({
      success: true,
      data: feedback,
      count: feedback.length,
    });
  } catch (error) {
    console.error('Error al obtener feedback:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener feedback de la base de datos',
      error: error.message,
    });
  }
}

// Controlador para obtener un feedback por su id.
export async function getFeedbackById(req, res) {
  try {
    const { id } = req.params;
    const feedback = await findFeedbackById(id);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: `No se encontró feedback con id ${id}`,
      });
    }

    return res.status(200).json({
      success: true,
      data: feedback,
    });
  } catch (error) {
    console.error('Error al obtener feedback por id:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener feedback de la base de datos',
      error: error.message,
    });
  }
}

// Controlador para crear un nuevo registro de feedback.
export async function postFeedback(req, res) {
  try {
    const feedback = await createFeedback(req.body ?? {});

    return res.status(201).json({
      success: true,
      message: 'Feedback creado exitosamente',
      data: feedback,
    });
  } catch (error) {
    if (error instanceof ServiceError) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    console.error('Error al crear feedback:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al crear feedback en la base de datos',
      error: error.message,
    });
  }
}

// Controlador para actualizar un feedback por id.
export async function updateFeedbackById(req, res) {
  try {
    const { id } = req.params;
    const feedback = await updateFeedback(id, req.body ?? {});

    return res.status(200).json({
      success: true,
      message: 'Feedback actualizado exitosamente',
      data: feedback,
    });
  } catch (error) {
    if (error instanceof ServiceError) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    console.error('Error al actualizar feedback:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar feedback en la base de datos',
      error: error.message,
    });
  }
}

// Controlador para borrar un feedback por id.
export async function deleteFeedbackById(req, res) {
  try {
    const { id } = req.params;
    const feedback = await deleteFeedback(id);

    return res.status(200).json({
      success: true,
      message: 'Feedback borrado exitosamente',
      data: feedback,
    });
  } catch (error) {
    if (error instanceof ServiceError) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    console.error('Error al borrar feedback:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al borrar feedback en la base de datos',
      error: error.message,
    });
  }
}
