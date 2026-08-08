import {
  listEntrenadores,
  findEntrenadorById,
  createEntrenador,
  updateEntrenador,
} from '../../services/crud/entrenadoresService.js';
import { ServiceError } from '../../services/serviceError.js';

export async function getEntrenadores(req, res) {
  try {
    const entrenadores = await listEntrenadores();

    return res.status(200).json({
      success: true,
      data: entrenadores,
      count: entrenadores.length,
    });
  } catch (error) {
    console.error('Error al obtener entrenadores:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener entrenadores de la base de datos',
      error: error.message,
    });
  }
}

export async function getEntrenadorById(req, res) {
  try {
    const { id } = req.params;
    const entrenador = await findEntrenadorById(id);

    if (!entrenador) {
      return res.status(404).json({
        success: false,
        message: `No se encontró entrenador con id ${id}`,
      });
    }

    return res.status(200).json({
      success: true,
      data: entrenador,
    });
  } catch (error) {
    console.error('Error al obtener entrenador por id:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener entrenador de la base de datos',
      error: error.message,
    });
  }
}

export async function postEntrenadores(req, res) {
  try {
    const entrenador = await createEntrenador(req.body ?? {});

    return res.status(201).json({
      success: true,
      message: 'Entrenador creado exitosamente',
      data: entrenador,
    });
  } catch (error) {
    if (error instanceof ServiceError) {
      return res.status(error.status).json({ success: false, message: error.message });
    }

    console.error('Error al crear entrenador:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al crear entrenador en la base de datos',
      error: error.message,
    });
  }
}

export async function updateEntrenadorById(req, res) {
  try {
    const { id } = req.params;
    const entrenador = await updateEntrenador(id, req.body ?? {});

    return res.status(200).json({
      success: true,
      message: 'Entrenador actualizado exitosamente',
      data: entrenador,
    });
  } catch (error) {
    if (error instanceof ServiceError) {
      return res.status(error.status).json({ success: false, message: error.message });
    }

    console.error('Error al actualizar entrenador:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar entrenador en la base de datos',
      error: error.message,
    });
  }
}
