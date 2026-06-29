import { markNotificationReadById } from '../../services/negocio/notificacionService.js';
import { ServiceError } from '../../services/serviceError.js';

export async function markNotificationRead(req, res) {
  try {
    const { id } = req.params;
    const notification = await markNotificationReadById(id);
    return res.status(200).json({ success: true, data: notification });
  } catch (error) {
    if (error instanceof ServiceError) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    console.error('Error markNotificationRead:', error);
    return res.status(500).json({ success: false, message: 'Error al marcar notificación', error: error.message });
  }
}
