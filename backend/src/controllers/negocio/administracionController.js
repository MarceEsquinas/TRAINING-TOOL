import {
  getAdministracionAtletasData,
  autoasignarAtletaPendienteData,
  reasignarAtletaData,
  updateAtletaAdministracionData,
  resetearPasswordTemporalAtletaData,
  getAdministracionUsuariosData,
  resetearPasswordTemporalUsuarioData,
  crearEntrenadorConUsuarioData,
  actualizarEntrenadorConUsuarioData,
  actualizarPasswordEntrenadorData,
} from '../../services/negocio/administracionService.js';
import { ServiceError } from '../../services/serviceError.js';

// Capa HTTP: traduce request/response sin mover reglas de negocio al controlador.
export async function postCrearEntrenador(req, res) {
  try {
    const data = await crearEntrenadorConUsuarioData(req.body ?? {});

    return res.status(201).json({
      success: true,
      message: 'Entrenador creado correctamente',
      data,
    });
  } catch (error) {
    if (error instanceof ServiceError) {
      return res.status(error.status).json({ success: false, message: error.message });
    }

    console.error('Error al crear entrenador desde administración:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al crear entrenador desde administración',
      error: error.message,
    });
  }
}

export async function putActualizarEntrenador(req, res) {
  try {
    const { entrenadorId } = req.params;
    const data = await actualizarEntrenadorConUsuarioData({
      entrenadorId,
      payload: req.body ?? {},
    });

    return res.status(200).json({
      success: true,
      message: 'Entrenador actualizado correctamente',
      data,
    });
  } catch (error) {
    if (error instanceof ServiceError) {
      return res.status(error.status).json({ success: false, message: error.message });
    }

    console.error('Error al actualizar entrenador desde administración:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar entrenador desde administración',
      error: error.message,
    });
  }
}

export async function putActualizarPasswordEntrenador(req, res) {
  try {
    const { entrenadorId } = req.params;
    const data = await actualizarPasswordEntrenadorData({
      entrenadorId,
      nuevaPassword: req.body?.nueva_password,
    });

    return res.status(200).json({
      success: true,
      message: 'Contraseña del entrenador actualizada correctamente',
      data,
    });
  } catch (error) {
    if (error instanceof ServiceError) {
      return res.status(error.status).json({ success: false, message: error.message });
    }

    console.error('Error al actualizar contraseña del entrenador:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar contraseña del entrenador',
      error: error.message,
    });
  }
}

export async function getAdministracionAtletas(req, res) {
  try {
    const result = await getAdministracionAtletasData({ estado: req.query.estado });

    return res.status(200).json({
      success: true,
      data: result.data,
      count: result.count,
    });
  } catch (error) {
    if (error instanceof ServiceError) {
      return res.status(error.status).json({ success: false, message: error.message });
    }

    console.error('Error al consultar atletas de administración:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al consultar atletas de administración',
      error: error.message,
    });
  }
}

export async function postAutoasignacionAtletaPendiente(req, res) {
  try {
    const { atletaId } = req.params;
    const data = await autoasignarAtletaPendienteData({
      atletaId,
      entrenadorId: req.body?.entrenador_id,
    });

    return res.status(200).json({
      success: true,
      message: 'Atleta pendiente asignado correctamente',
      data,
    });
  } catch (error) {
    if (error instanceof ServiceError) {
      return res.status(error.status).json({ success: false, message: error.message });
    }

    console.error('Error al autoasignar atleta pendiente:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al autoasignar atleta pendiente',
      error: error.message,
    });
  }
}

export async function postReasignacionAtleta(req, res) {
  try {
    const { atletaId } = req.params;
    const data = await reasignarAtletaData({
      atletaId,
      entrenadorId: req.body?.entrenador_id,
    });

    return res.status(200).json({
      success: true,
      message: 'Atleta reasignado correctamente',
      data,
    });
  } catch (error) {
    if (error instanceof ServiceError) {
      return res.status(error.status).json({ success: false, message: error.message });
    }

    console.error('Error al reasignar atleta:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al reasignar atleta',
      error: error.message,
    });
  }
}

export async function putAtletaAdministracion(req, res) {
  try {
    const { atletaId } = req.params;
    const data = await updateAtletaAdministracionData({
      atletaId,
      payload: req.body ?? {},
    });

    return res.status(200).json({
      success: true,
      message: 'Atleta actualizado correctamente',
      data,
    });
  } catch (error) {
    if (error instanceof ServiceError) {
      return res.status(error.status).json({ success: false, message: error.message });
    }

    console.error('Error al actualizar atleta desde administración:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar atleta desde administración',
      error: error.message,
    });
  }
}

export async function postResetPasswordTemporalAtleta(req, res) {
  try {
    const { atletaId } = req.params;
    const data = await resetearPasswordTemporalAtletaData({
      atletaId,
      nuevaPassword: req.body?.nueva_password,
    });

    return res.status(200).json({
      success: true,
      message: 'Contraseña temporal del atleta actualizada correctamente',
      data,
    });
  } catch (error) {
    if (error instanceof ServiceError) {
      return res.status(error.status).json({ success: false, message: error.message });
    }

    console.error('Error al resetear contraseña temporal del atleta:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al resetear contraseña temporal del atleta',
      error: error.message,
    });
  }
}

export async function getAdministracionUsuarios(req, res) {
  try {
    const result = await getAdministracionUsuariosData();

    return res.status(200).json({
      success: true,
      data: result.data,
      count: result.count,
    });
  } catch (error) {
    if (error instanceof ServiceError) {
      return res.status(error.status).json({ success: false, message: error.message });
    }

    console.error('Error al consultar usuarios de administración:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al consultar usuarios de administración',
      error: error.message,
    });
  }
}

export async function postResetPasswordTemporalUsuario(req, res) {
  try {
    const { usuarioId } = req.params;
    const data = await resetearPasswordTemporalUsuarioData({
      usuarioId,
      nuevaPassword: req.body?.nueva_password,
    });

    return res.status(200).json({
      success: true,
      message: 'Contraseña temporal actualizada correctamente',
      data,
    });
  } catch (error) {
    if (error instanceof ServiceError) {
      return res.status(error.status).json({ success: false, message: error.message });
    }

    console.error('Error al resetear contraseña temporal:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al resetear contraseña temporal',
      error: error.message,
    });
  }
}
