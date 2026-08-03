import {
  listSesionesEntrenamiento,
  listSesionesEntrenamientoBySemanaId,
  findSesionEntrenamientoById,
  createSesionEntrenamiento,
  updateSesionEntrenamiento,
  deleteSesionEntrenamiento,
} from '../../services/crud/sesionEntrenamientoService.js';
import { ServiceError } from '../../services/serviceError.js';

// Controlador para listar todas las sesiones de entrenamiento.
export async function getSesionesEntrenamiento(req, res) {
  try {
    const sesiones = await listSesionesEntrenamiento();

    return res.status(200).json({
      success: true,
      data: sesiones,
      count: sesiones.length,
    });
  } catch (error) {
    console.error('Error al obtener sesiones de entrenamiento:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener sesiones de entrenamiento de la base de datos',
      error: error.message,
    });
  }
}

// Controlador para listar las sesiones de una semana concreta.
export async function getSesionesEntrenamientoBySemanaId(req, res) {
  try {
    const { semanaId } = req.params;
    const sesiones = await listSesionesEntrenamientoBySemanaId(semanaId);

    return res.status(200).json({
      success: true,
      data: sesiones,
      count: sesiones.length,
    });
  } catch (error) {
    if (error instanceof ServiceError) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    console.error('Error al obtener sesiones de entrenamiento por semana:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener las sesiones de la semana desde la base de datos',
      error: error.message,
    });
  }
}

// Controlador para obtener una sesión de entrenamiento por id.
export async function getSesionEntrenamientoById(req, res) {
  try {
    const { id } = req.params;
    const sesion = await findSesionEntrenamientoById(id);

    if (!sesion) {
      return res.status(404).json({
        success: false,
        message: `No se encontró sesión de entrenamiento con id ${id}`,
      });
    }

    return res.status(200).json({
      success: true,
      data: sesion,
    });
  } catch (error) {
    console.error('Error al obtener sesión de entrenamiento por id:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener sesión de entrenamiento de la base de datos',
      error: error.message,
    });
  }
}

// Controlador para crear una nueva sesión de entrenamiento.
export async function postSesionEntrenamiento(req, res) {
  try {
    const sesion = await createSesionEntrenamiento(req.body ?? {});

    return res.status(201).json({
      success: true,
      message: 'Sesión de entrenamiento creada exitosamente',
      data: sesion,
    });
  } catch (error) {
    if (error instanceof ServiceError) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    console.error('Error al crear sesión de entrenamiento:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al crear sesión de entrenamiento en la base de datos',
      error: error.message,
    });
  }
}

// Controlador para actualizar una sesión de entrenamiento por id.
export async function updateSesionEntrenamientoById(req, res) {
  try {
    const { id } = req.params;
    const sesion = await updateSesionEntrenamiento(id, req.body ?? {});

    return res.status(200).json({
      success: true,
      message: 'Sesión de entrenamiento actualizada exitosamente',
      data: sesion,
    });
  } catch (error) {
    if (error instanceof ServiceError) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    console.error('Error al actualizar sesión de entrenamiento:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar sesión de entrenamiento en la base de datos',
      error: error.message,
    });
  }
}

// Controlador para borrar una sesión de entrenamiento por id.
export async function deleteSesionEntrenamientoById(req, res) {
  try {
    const { id } = req.params;
    const sesion = await deleteSesionEntrenamiento(id);

    return res.status(200).json({
      success: true,
      message: 'Sesión de entrenamiento borrada exitosamente',
      data: sesion,
    });
  } catch (error) {
    if (error instanceof ServiceError) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    console.error('Error al borrar sesión de entrenamiento:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al borrar sesión de entrenamiento en la base de datos',
      error: error.message,
    });
  }
}
