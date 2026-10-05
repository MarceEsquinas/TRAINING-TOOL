import { getPerfilAtletaData, updatePerfilAtletaData } from '../../services/negocio/perfilService.js';
import { ServiceError } from '../../services/serviceError.js';

function responderError(res, error, mensaje) {
  if (error instanceof ServiceError) {
    return res.status(error.status).json({ success: false, message: error.message });
  }
  console.error(mensaje, error);
  return res.status(500).json({ success: false, message: mensaje });
}

// El atleta sale siempre del token, nunca de la URL ni del cuerpo.
export async function getPerfil(req, res) {
  try {
    const data = await getPerfilAtletaData(req.user.atletaId);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return responderError(res, error, 'Error al obtener el perfil');
  }
}

export async function putPerfil(req, res) {
  try {
    const data = await updatePerfilAtletaData(req.user.atletaId, req.body ?? {});
    return res.status(200).json({ success: true, message: 'Perfil actualizado', data });
  } catch (error) {
    return responderError(res, error, 'Error al actualizar el perfil');
  }
}
