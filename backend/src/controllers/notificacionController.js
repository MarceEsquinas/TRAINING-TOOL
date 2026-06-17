import { query } from '../config/db.js';

export async function markNotificationRead(req, res) {
  try {
    const { id } = req.params;
    const result = await query('UPDATE notificacion_feedback SET leido = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: `Notificación ${id} no encontrada` });
    }
    return res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error markNotificationRead:', error);
    return res.status(500).json({ success: false, message: 'Error al marcar notificación', error: error.message });
  }
}
