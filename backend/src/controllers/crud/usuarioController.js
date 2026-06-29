import {
  listUsuarios,
  findUsuarioById,
  createUsuario,
  updateUsuario,
  deleteUsuario,
} from '../../services/crud/usuarioService.js';
import { ServiceError } from '../../services/serviceError.js';

export async function getUsuarios(req, res) {
  try {
    const usuarios = await listUsuarios();

    return res.status(200).json({
      success: true,
      data: usuarios,
      count: usuarios.length,
    });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener usuarios de la base de datos',
      error: error.message,
    });
  }
}

export async function getUsuarioById(req, res) {
  try {
    const { id } = req.params;
    const usuario = await findUsuarioById(id);

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: `No se encontró usuario con id ${id}`,
      });
    }

    return res.status(200).json({
      success: true,
      data: usuario,
    });
  } catch (error) {
    console.error('Error al obtener usuario por id:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener usuario de la base de datos',
      error: error.message,
    });
  }
}

export async function postUsuarios(req, res) {
  try {
    const usuario = await createUsuario(req.body ?? {});

    return res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      data: usuario,
    });
  } catch (error) {
    if (error instanceof ServiceError) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    console.error('Error al crear usuario:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al crear usuario en la base de datos',
      error: error.message,
    });
  }
}

export async function updateUsuarioById(req, res) {
  try {
    const { id } = req.params;
    const usuario = await updateUsuario(id, req.body ?? {});

    return res.status(200).json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      data: usuario,
    });
  } catch (error) {
    if (error instanceof ServiceError) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    console.error('Error al actualizar usuario:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar usuario en la base de datos',
      error: error.message,
    });
  }
}

export async function deleteUsuarioById(req, res) {
  try {
    const { id } = req.params;
    const usuario = await deleteUsuario(id);

    return res.status(200).json({
      success: true,
      message: 'Usuario eliminado exitosamente',
      data: usuario,
    });
  } catch (error) {
    if (error instanceof ServiceError) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    console.error('Error al eliminar usuario:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al eliminar usuario de la base de datos',
      error: error.message,
    });
  }
}
