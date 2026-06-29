import { query } from '../../config/db.js';
import { ServiceError } from '../serviceError.js';

export async function markNotificationReadById(id) {
  const result = await query(
    'UPDATE notificacion_feedback SET leido = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
    [id]
  );

  if (result.rows.length === 0) {
    throw new ServiceError(404, `Notificación ${id} no encontrada`);
  }

  return result.rows[0];
}
