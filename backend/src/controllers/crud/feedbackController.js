import { query } from '../../config/db.js';

// Controlador para listar todos los registros de feedback.
export async function getFeedback(req, res) {
  try {
    const result = await query('SELECT * FROM feedback_semanal ORDER BY id');

    return res.status(200).json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error('Error al obtener feedback:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener feedback de la base de datos',
      error: error.message,
    });
  }
}

// Controlador para obtener un feedback por su id.
export async function getFeedbackById(req, res) {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM feedback_semanal WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No se encontró feedback con id ${id}`,
      });
    }

    return res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error al obtener feedback por id:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener feedback de la base de datos',
      error: error.message,
    });
  }
}

// Controlador para crear un nuevo registro de feedback.
export async function postFeedback(req, res) {
  try {
    const { semana_id, completada = true, motivo_no_completada, sensaciones, molestias, ritmo_rodaje } = req.body;

    if (!semana_id) {
      return res.status(400).json({
        success: false,
        message: 'El campo semana_id es requerido',
      });
    }

    if (completada === false && (!motivo_no_completada || String(motivo_no_completada).trim() === '')) {
      return res.status(400).json({
        success: false,
        message: 'motivo_no_completada es requerido cuando completada es false',
      });
    }

    const sql = `
      INSERT INTO feedback_semanal
      (semana_id, completada, motivo_no_completada, sensaciones, molestias, ritmo_rodaje)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;

    const params = [
      semana_id,
      completada,
      motivo_no_completada || null,
      sensaciones || null,
      molestias || null,
      ritmo_rodaje || null,
    ];

    const result = await query(sql, params);

    return res.status(201).json({
      success: true,
      message: 'Feedback creado exitosamente',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error al crear feedback:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al crear feedback en la base de datos',
      error: error.message,
    });
  }
}

// Controlador para actualizar un feedback por id.
export async function updateFeedbackById(req, res) {
  try {
    const { id } = req.params;
    const { semana_id, completada, motivo_no_completada, sensaciones, molestias, ritmo_rodaje } = req.body;

    if (completada === false && (!motivo_no_completada || String(motivo_no_completada).trim() === '')) {
      return res.status(400).json({
        success: false,
        message: 'motivo_no_completada es requerido cuando completada es false',
      });
    }

    const fields = [];
    const params = [];
    let idx = 1;

    if (semana_id !== undefined) {
      fields.push(`semana_id = $${idx++}`);
      params.push(semana_id);
    }
    if (completada !== undefined) {
      fields.push(`completada = $${idx++}`);
      params.push(completada);
    }
    if (motivo_no_completada !== undefined) {
      fields.push(`motivo_no_completada = $${idx++}`);
      params.push(motivo_no_completada || null);
    }
    if (sensaciones !== undefined) {
      fields.push(`sensaciones = $${idx++}`);
      params.push(sensaciones || null);
    }
    if (molestias !== undefined) {
      fields.push(`molestias = $${idx++}`);
      params.push(molestias || null);
    }
    if (ritmo_rodaje !== undefined) {
      fields.push(`ritmo_rodaje = $${idx++}`);
      params.push(ritmo_rodaje || null);
    }

    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No hay campos para actualizar',
      });
    }

    params.push(id);
    const sql = `UPDATE feedback_semanal SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *;`;
    const result = await query(sql, params);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No se encontró feedback con id ${id}`,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Feedback actualizado exitosamente',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error al actualizar feedback:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar feedback en la base de datos',
      error: error.message,
    });
  }
}

// Controlador para borrar un feedback por id.
export async function deleteFeedbackById(req, res) {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM feedback_semanal WHERE id = $1 RETURNING *;', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No se encontró feedback con id ${id}`,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Feedback borrado exitosamente',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error al borrar feedback:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al borrar feedback en la base de datos',
      error: error.message,
    });
  }
}
