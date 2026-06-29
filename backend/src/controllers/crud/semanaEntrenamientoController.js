import {
  listSemanasEntrenamiento,
  findSemanaEntrenamientoById,
  createSemanaEntrenamiento,
  updateSemanaEntrenamiento,
  deleteSemanaEntrenamiento,
} from '../../services/crud/semanaEntrenamientoService.js';
import { ServiceError } from '../../services/serviceError.js';

// Controlador para listar todas las semanas de entrenamiento.
export async function getSemanasEntrenamiento(req, res) {
  try {
    const semanas = await listSemanasEntrenamiento();

    return res.status(200).json({
      success: true,
      data: semanas,
      count: semanas.length,
    });
  } catch (error) {
    console.error('Error al obtener semanas de entrenamiento:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener semanas de entrenamiento de la base de datos',
      error: error.message,
    });
  }
}

// Controlador para obtener una semana de entrenamiento por id.
export async function getSemanaEntrenamientoById(req, res) {
  try {
    const { id } = req.params;
    const semana = await findSemanaEntrenamientoById(id);

    if (!semana) {
      return res.status(404).json({
        success: false,
        message: `No se encontró semana de entrenamiento con id ${id}`,
      });
    }

    return res.status(200).json({
      success: true,
      data: semana,
    });
  } catch (error) {
    console.error('Error al obtener semana de entrenamiento por id:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener semana de entrenamiento de la base de datos',
      error: error.message,
    });
  }
}

// Controlador para crear una nueva semana de entrenamiento.
export async function postSemanaEntrenamiento(req, res) {
  try {
    const semana = await createSemanaEntrenamiento(req.body ?? {});

    return res.status(201).json({
      success: true,
      message: 'Semana de entrenamiento creada exitosamente',
      data: semana,
    });
  } catch (error) {
    if (error instanceof ServiceError) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    console.error('Error al crear semana de entrenamiento:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al crear semana de entrenamiento en la base de datos',
      error: error.message,
    });
  }
}

// Controlador para actualizar una semana de entrenamiento por id.
export async function updateSemanaEntrenamientoById(req, res) {
  try {
    const { id } = req.params;
    const semana = await updateSemanaEntrenamiento(id, req.body ?? {});

    return res.status(200).json({
      success: true,
      message: 'Semana de entrenamiento actualizada exitosamente',
      data: semana,
    });
  } catch (error) {
    if (error instanceof ServiceError) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    console.error('Error al actualizar semana de entrenamiento:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar semana de entrenamiento en la base de datos',
      error: error.message,
    });
  }
}

// Controlador para borrar una semana de entrenamiento por id.
export async function deleteSemanaEntrenamientoById(req, res) {
  try {
    const { id } = req.params;
    const semana = await deleteSemanaEntrenamiento(id);

    return res.status(200).json({
      success: true,
      message: 'Semana de entrenamiento borrada exitosamente',
      data: semana,
    });
  } catch (error) {
    if (error instanceof ServiceError) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    console.error('Error al borrar semana de entrenamiento:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al borrar semana de entrenamiento en la base de datos',
      error: error.message,
    });
  }
}
