import { query } from '../../config/db.js';

// Controlador para listar todas las semanas de entrenamiento.
export async function getSemanasEntrenamiento(req, res) {
  try {
    const result = await query('SELECT * FROM semana_entrenamiento ORDER BY id');

    return res.status(200).json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error('Error al obtener semanas de entrenamiento:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener semanas de entrenamiento de la base de datos',
      error: error.message,
    });
  }
}

// Controlador para obtener una semana de entrenamiento por id.
export async function getSemanaEntrenamientoById(req, res) {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM semana_entrenamiento WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No se encontró semana de entrenamiento con id ${id}`,
      });
    }

    return res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error al obtener semana de entrenamiento por id:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener semana de entrenamiento de la base de datos',
      error: error.message,
    });
  }
}

// Controlador para crear una nueva semana de entrenamiento.
export async function postSemanaEntrenamiento(req, res) {
  try {
    const { objetivo_id, fecha_inicio, fecha_fin } = req.body;

    if (!objetivo_id) {
      return res.status(400).json({
        success: false,
        message: 'El objetivo_id es requerido',
      });
    }

    if (!fecha_inicio) {
      return res.status(400).json({
        success: false,
        message: 'La fecha_inicio es requerida',
      });
    }

    if (!fecha_fin) {
      return res.status(400).json({
        success: false,
        message: 'La fecha_fin es requerida',
      });
    }

    const sql = `
      INSERT INTO semana_entrenamiento
      (objetivo_id, fecha_inicio, fecha_fin)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;

    const params = [objetivo_id, fecha_inicio, fecha_fin];
    const result = await query(sql, params);

    return res.status(201).json({
      success: true,
      message: 'Semana de entrenamiento creada exitosamente',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error al crear semana de entrenamiento:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al crear semana de entrenamiento en la base de datos',
      error: error.message,
    });
  }
}

// Controlador para actualizar una semana de entrenamiento por id.
export async function updateSemanaEntrenamientoById(req, res) {
  try {
    const { id } = req.params;
    const { objetivo_id, fecha_inicio, fecha_fin } = req.body;

    const fields = [];
    const params = [];
    let idx = 1;

    if (objetivo_id !== undefined) {
      fields.push(`objetivo_id = $${idx++}`);
      params.push(objetivo_id);
    }
    if (fecha_inicio !== undefined) {
      fields.push(`fecha_inicio = $${idx++}`);
      params.push(fecha_inicio);
    }
    if (fecha_fin !== undefined) {
      fields.push(`fecha_fin = $${idx++}`);
      params.push(fecha_fin);
    }

    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No hay campos para actualizar',
      });
    }

    params.push(id);
    const sql = `UPDATE semana_entrenamiento SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *;`;
    const result = await query(sql, params);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No se encontró semana de entrenamiento con id ${id}`,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Semana de entrenamiento actualizada exitosamente',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error al actualizar semana de entrenamiento:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar semana de entrenamiento en la base de datos',
      error: error.message,
    });
  }
}

// Controlador para borrar una semana de entrenamiento por id.
export async function deleteSemanaEntrenamientoById(req, res) {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM semana_entrenamiento WHERE id = $1 RETURNING *;', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No se encontró semana de entrenamiento con id ${id}`,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Semana de entrenamiento borrada exitosamente',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error al borrar semana de entrenamiento:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al borrar semana de entrenamiento en la base de datos',
      error: error.message,
    });
  }
}
