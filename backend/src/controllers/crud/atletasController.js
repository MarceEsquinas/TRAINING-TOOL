import {
  listAtletas,
  findAtletaById,
  createAtleta,
  updateAtleta,
  deleteAtleta,
} from '../../services/crud/atletasService.js';
import { ServiceError } from '../../services/serviceError.js';

// Controlador para listar todos los atletas desde PostgreSQL.
export async function getAtletas(req, res) {
  try {
    const atletas = await listAtletas();
    
    return res.status(200).json({
      success: true,
      data: atletas,
      count: atletas.length,
    });
  } catch (error) {
    console.error('Error al obtener atletas:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener atletas de la base de datos',
      error: error.message,
    });
  }
}

// Controlador para crear un nuevo atleta
export async function postAtletas(req, res) {
  try {
    const atleta = await createAtleta(req.body ?? {});

    return res.status(201).json({
      success: true,
      message: 'Atleta creado exitosamente',
      data: atleta,
    });
  } catch (error) {
    if (error instanceof ServiceError) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    console.error('Error al crear atleta:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al crear atleta en la base de datos',
      error: error.message,
    });
  }
}

// Controlador para obtener un atleta por su id.
export async function getAtletaById(req, res) {
  try {
    const { id } = req.params;
    const atleta = await findAtletaById(id);

    if (!atleta) {
      return res.status(404).json({
        success: false,
        message: `No se encontró atleta con id ${id}`,
      });
    }

    return res.status(200).json({
      success: true,
      data: atleta,
    });
  } catch (error) {
    console.error('Error al obtener atleta por id:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener atleta de la base de datos',
      error: error.message,
    });
  }
}

// Controlador para actualizar un atleta por id.
// Permite actualizar uno o varios campos del atleta.
// - Lee el id desde `req.params.id`.
// - Lee los campos desde `req.body`.
// - Valida parcialmente los campos recibidos (nombre, sexo, peso).
// - Construye una sentencia UPDATE dinámica para actualizar solo los campos enviados.
// - Devuelve 200 con el atleta actualizado, 404 si no existe, 400 para peticiones inválidas.
export async function updateAtletaById(req, res) {
  try {
    const { id } = req.params;
    const atleta = await updateAtleta(id, req.body ?? {});

    return res.status(200).json({ success: true, message: 'Atleta actualizado exitosamente', data: atleta });
  } catch (error) {
    if (error instanceof ServiceError) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    console.error('Error al actualizar atleta:', error);
    return res.status(500).json({ success: false, message: 'Error al actualizar atleta en la base de datos', error: error.message });
  }
}

// Controlador para borrar un atleta por id.
export async function deleteAtletaById(req, res) {
  try {
    const { id } = req.params;
    const atleta = await deleteAtleta(id);

    return res.status(200).json({ success: true, message: 'Atleta borrado exitosamente', data: atleta });
  } catch (error) {
    if (error instanceof ServiceError) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    console.error('Error al borrar atleta:', error);
    return res.status(500).json({ success: false, message: 'Error al borrar atleta en la base de datos', error: error.message });
  }
}
