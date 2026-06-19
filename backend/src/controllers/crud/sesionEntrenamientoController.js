import { query } from '../../config/db.js';

// Controlador para listar todas las sesiones de entrenamiento.
export async function getSesionesEntrenamiento(req, res) {
  try {
    const result = await query('SELECT * FROM sesion_entrenamiento ORDER BY id');

    return res.status(200).json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error('Error al obtener sesiones de entrenamiento:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener sesiones de entrenamiento de la base de datos',
      error: error.message,
    });
  }
}

// Controlador para obtener una sesión de entrenamiento por id.
export async function getSesionEntrenamientoById(req, res) {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM sesion_entrenamiento WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No se encontró sesión de entrenamiento con id ${id}`,
      });
    }

    return res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error al obtener sesión de entrenamiento por id:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener sesión de entrenamiento de la base de datos',
      error: error.message,
    });
  }
}

// Controlador para crear una nueva sesión de entrenamiento.
export async function postSesionEntrenamiento(req, res) {
  try {
    const { semana_id, orden, descripcion, kilometros_planificados } = req.body ?? {};

    if (!semana_id) {
      return res.status(400).json({
        success: false,
        message: 'El semana_id es requerido',
      });
    }

    if (!orden || String(orden).trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'El orden es requerido',
      });
    }

    if (!descripcion || String(descripcion).trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'La descripción es requerida',
      });
    }

    const sql = `
      INSERT INTO sesion_entrenamiento
      (semana_id, orden, descripcion, kilometros_planificados)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;

    const params = [semana_id, String(orden).trim(), String(descripcion).trim(), kilometros_planificados || null];
    const result = await query(sql, params);

    return res.status(201).json({
      success: true,
      message: 'Sesión de entrenamiento creada exitosamente',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error al crear sesión de entrenamiento:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al crear sesión de entrenamiento en la base de datos',
      error: error.message,
    });
  }
}

// Controlador para actualizar una sesión de entrenamiento por id.
export async function updateSesionEntrenamientoById(req, res) {
  try {
    const { id } = req.params;
    const { semana_id, orden, descripcion, kilometros_planificados } = req.body ?? {};

    const fields = [];
    const params = [];
    let idx = 1;

    if (semana_id !== undefined) {
      fields.push(`semana_id = $${idx++}`);
      params.push(semana_id);
    }
    if (orden !== undefined) {
      fields.push(`orden = $${idx++}`);
      params.push(String(orden).trim());
    }
    if (descripcion !== undefined) {
      fields.push(`descripcion = $${idx++}`);
      params.push(String(descripcion).trim());
    }
    if (kilometros_planificados !== undefined) {
      fields.push(`kilometros_planificados = $${idx++}`);
      params.push(kilometros_planificados);
    }

    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No hay campos para actualizar',
      });
    }

    params.push(id);
    const sql = `UPDATE sesion_entrenamiento SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *;`;
    const result = await query(sql, params);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No se encontró sesión de entrenamiento con id ${id}`,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Sesión de entrenamiento actualizada exitosamente',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error al actualizar sesión de entrenamiento:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar sesión de entrenamiento en la base de datos',
      error: error.message,
    });
  }
}

// Controlador para borrar una sesión de entrenamiento por id.
export async function deleteSesionEntrenamientoById(req, res) {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM sesion_entrenamiento WHERE id = $1 RETURNING *;', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No se encontró sesión de entrenamiento con id ${id}`,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Sesión de entrenamiento borrada exitosamente',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error al borrar sesión de entrenamiento:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al borrar sesión de entrenamiento en la base de datos',
      error: error.message,
    });
  }
}
