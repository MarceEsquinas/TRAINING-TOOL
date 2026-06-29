import {
  listObjetivos,
  findObjetivoById,
  createObjetivo,
  updateObjetivo,
  deleteObjetivo,
} from '../../services/crud/objetivoService.js';
import { ServiceError } from '../../services/serviceError.js';

// Controlador para listar todos los objetivos desde PostgreSQL.
export async function getObjetivos(req, res) {
  try {
    const objetivos = await listObjetivos();

    return res.status(200).json({
      success: true,
      data: objetivos,
      count: objetivos.length,
    });
  } catch (error) {
    console.error('Error al obtener objetivos:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener objetivos de la base de datos',
      error: error.message,
    });
  }
}

// Controlador para obtener un objetivo por su id.
export async function getObjetivoById(req, res) {
  try {
    const { id } = req.params;
    const objetivo = await findObjetivoById(id);

    if (!objetivo) {
      return res.status(404).json({
        success: false,
        message: `No se encontró objetivo con id ${id}`,
      });
    }

    return res.status(200).json({
      success: true,
      data: objetivo,
    });
  } catch (error) {
    console.error('Error al obtener objetivo por id:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener objetivo de la base de datos',
      error: error.message,
    });
  }
}

// Controlador para crear un nuevo objetivo.
export async function postObjetivo(req, res) {
  try {
    const objetivo = await createObjetivo(req.body ?? {});

    return res.status(201).json({
      success: true,
      message: 'Objetivo creado exitosamente',
      data: objetivo,
    });
  } catch (error) {
    if (error instanceof ServiceError) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    console.error('Error al crear objetivo:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al crear objetivo en la base de datos',
      error: error.message,
    });
  }
}

// Controlador para actualizar un objetivo por id.
export async function updateObjetivoById(req, res) {
  try {
    const { id } = req.params;
    const objetivo = await updateObjetivo(id, req.body ?? {});

    return res.status(200).json({
      success: true,
      message: 'Objetivo actualizado exitosamente',
      data: objetivo,
    });
  } catch (error) {
    if (error instanceof ServiceError) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    console.error('Error al actualizar objetivo:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar objetivo en la base de datos',
      error: error.message,
    });
  }
}

// Controlador para borrar un objetivo por id.
export async function deleteObjetivoById(req, res) {
  try {
    const { id } = req.params;
    const objetivo = await deleteObjetivo(id);

    return res.status(200).json({
      success: true,
      message: 'Objetivo borrado exitosamente',
      data: objetivo,
    });
  } catch (error) {
    if (error instanceof ServiceError) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    console.error('Error al borrar objetivo:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al borrar objetivo en la base de datos',
      error: error.message,
    });
  }
}
