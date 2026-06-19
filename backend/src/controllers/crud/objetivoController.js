import { query } from '../../config/db.js';

// Controlador para listar todos los objetivos desde PostgreSQL.
export async function getObjetivos(req, res) {
  try {
    const result = await query('SELECT * FROM objetivo ORDER BY id');

    return res.status(200).json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error('Error al obtener objetivos:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener objetivos de la base de datos',
      error: error.message,
    });
  }
}

// Controlador para obtener un objetivo por su id.
export async function getObjetivoById(req, res) {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM objetivo WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No se encontró objetivo con id ${id}`,
      });
    }

    return res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error al obtener objetivo por id:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener objetivo de la base de datos',
      error: error.message,
    });
  }
}

// Controlador para crear un nuevo objetivo.
export async function postObjetivo(req, res) {
  try {
    const { nombre, atleta_id, fecha_objetivo, activo } = req.body;

    if (!nombre || String(nombre).trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'El nombre del objetivo es requerido',
      });
    }

    if (!atleta_id) {
      return res.status(400).json({
        success: false,
        message: 'El atleta_id es requerido para el objetivo',
      });
    }

    if (!fecha_objetivo) {
      return res.status(400).json({
        success: false,
        message: 'La fecha_objetivo es requerida',
      });
    }

    const sql = `
      INSERT INTO objetivo
      (nombre, atleta_id, fecha_objetivo, activo)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;

    const params = [
      String(nombre).trim(),
      atleta_id,
      fecha_objetivo,
      activo === undefined ? false : activo,
    ];

    const result = await query(sql, params);

    return res.status(201).json({
      success: true,
      message: 'Objetivo creado exitosamente',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error al crear objetivo:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al crear objetivo en la base de datos',
      error: error.message,
    });
  }
}

// Controlador para actualizar un objetivo por id.
export async function updateObjetivoById(req, res) {
  try {
    const { id } = req.params;
    const { nombre, atleta_id, fecha_objetivo, activo } = req.body;

    if (nombre !== undefined && String(nombre).trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'El nombre del objetivo no puede estar vacío',
      });
    }

    const fields = [];
    const params = [];
    let idx = 1;

    if (nombre !== undefined) {
      fields.push(`nombre = $${idx++}`);
      params.push(String(nombre).trim());
    }
    if (atleta_id !== undefined) {
      fields.push(`atleta_id = $${idx++}`);
      params.push(atleta_id);
    }
    if (fecha_objetivo !== undefined) {
      fields.push(`fecha_objetivo = $${idx++}`);
      params.push(fecha_objetivo);
    }
    if (activo !== undefined) {
      fields.push(`activo = $${idx++}`);
      params.push(activo);
    }

    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No hay campos para actualizar',
      });
    }

    params.push(id);
    const sql = `UPDATE objetivo SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${idx} RETURNING *;`;
    const result = await query(sql, params);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No se encontró objetivo con id ${id}`,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Objetivo actualizado exitosamente',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error al actualizar objetivo:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar objetivo en la base de datos',
      error: error.message,
    });
  }
}

// Controlador para borrar un objetivo por id.
export async function deleteObjetivoById(req, res) {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM objetivo WHERE id = $1 RETURNING *;', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No se encontró objetivo con id ${id}`,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Objetivo borrado exitosamente',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error al borrar objetivo:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al borrar objetivo en la base de datos',
      error: error.message,
    });
  }
}
