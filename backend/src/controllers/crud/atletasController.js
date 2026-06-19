import { query } from '../../config/db.js';

// Controlador para listar todos los atletas desde PostgreSQL.
export async function getAtletas(req, res) {
  try {
    // Consulta todos los atletas de la tabla
    const result = await query('SELECT * FROM atleta ORDER BY id');
    
    // Devuelve los atletas con status 200
    return res.status(200).json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error('Error al obtener atletas:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener atletas de la base de datos',
      error: error.message,
    });
  }
}

// Controlador para crear un nuevo atleta
export async function postAtletas(req, res) {
  try {
    const { nombre, usuario_id, sexo, peso, dias_disponibles, km_medios_ultimos_2_meses, lesiones_ultimo_anio } = req.body;

    // Validación: nombre es requerido
    if (!nombre || nombre.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'El nombre del atleta es requerido',
      });
    }

    // Validación: peso debe ser positivo si se proporciona
    if (peso !== undefined && peso !== null && peso <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El peso debe ser mayor a 0',
      });
    }

    // Validación: sexo debe ser M, F o OTRO si se proporciona
    const sexosValidos = ['M', 'F', 'OTRO'];
    if (sexo && !sexosValidos.includes(sexo)) {
      return res.status(400).json({
        success: false,
        message: 'El sexo debe ser M, F u OTRO',
      });
    }

    // Construcción de la consulta SQL con parámetros
    const sql = `
      INSERT INTO atleta 
      (nombre, usuario_id, sexo, peso, dias_disponibles, km_medios_ultimos_2_meses, lesiones_ultimo_anio)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;

    const params = [
      nombre.trim(),
      usuario_id || null,
      sexo || null,
      peso || null,
      dias_disponibles ? JSON.stringify(dias_disponibles) : '[]',
      km_medios_ultimos_2_meses || null,
      lesiones_ultimo_anio ? JSON.stringify(lesiones_ultimo_anio) : '[]',
    ];

    const result = await query(sql, params);

    // Devuelve el atleta creado con status 201
    return res.status(201).json({
      success: true,
      message: 'Atleta creado exitosamente',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error al crear atleta:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al crear atleta en la base de datos',
      error: error.message,
    });
  }
}

// Controlador para obtener un atleta por su id.
export async function getAtletaById(req, res) {
  try {
    // req.params.id viene de la ruta /atletas/:id
    const { id } = req.params;

    // Consulta el atleta que tenga el id indicado
    const result = await query('SELECT * FROM atleta WHERE id = $1', [id]);

    // Si no existe atleta con ese id, devolvemos 404
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No se encontró atleta con id ${id}`,
      });
    }

    // Si existe, devolvemos el atleta encontrado
    return res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error al obtener atleta por id:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener atleta de la base de datos',
      error: error.message,
    });
  }
}

// Controlador para actualizar un atleta por id.
// Permite actualizar uno o varios campos del atleta.
// - Lee el id desde `req.params.id`.
// - Lee los campos desde `req.body`.
// - Valida parcialmente los campos recibidos (nombre, sexo, peso).
// - Construye una sentencia UPDATE dinámica para actualizar solo los campos enviados.
// - Devuelve 200 con el atleta actualizado, 404 si no existe, 400 para peticiones inválidas.
export async function updateAtletaById(req, res) {
  try {
    const { id } = req.params;
    const {
      nombre,
      usuario_id,
      sexo,
      peso,
      dias_disponibles,
      km_medios_ultimos_2_meses,
      lesiones_ultimo_anio,
    } = req.body;

    // Validaciones simples de los campos que se envían
    if (nombre !== undefined && (nombre === null || String(nombre).trim() === '')) {
      return res.status(400).json({ success: false, message: 'El nombre del atleta no puede estar vacío' });
    }

    const sexosValidos = ['M', 'F', 'OTRO'];
    if (sexo !== undefined && sexo !== null && !sexosValidos.includes(sexo)) {
      return res.status(400).json({ success: false, message: 'El sexo debe ser M, F u OTRO' });
    }

    if (peso !== undefined && peso !== null && Number(peso) <= 0) {
      return res.status(400).json({ success: false, message: 'El peso debe ser mayor a 0' });
    }

    // Construcción dinámica de la cláusula SET y parámetros para prevenir SQL injection
    const fields = [];
    const params = [];
    let idx = 1;

    if (nombre !== undefined) { fields.push(`nombre = $${idx++}`); params.push(String(nombre).trim()); }
    if (usuario_id !== undefined) { fields.push(`usuario_id = $${idx++}`); params.push(usuario_id); }
    if (sexo !== undefined) { fields.push(`sexo = $${idx++}`); params.push(sexo); }
    if (peso !== undefined) { fields.push(`peso = $${idx++}`); params.push(peso); }
    if (dias_disponibles !== undefined) { fields.push(`dias_disponibles = $${idx++}`); params.push(JSON.stringify(dias_disponibles)); }
    if (km_medios_ultimos_2_meses !== undefined) { fields.push(`km_medios_ultimos_2_meses = $${idx++}`); params.push(km_medios_ultimos_2_meses); }
    if (lesiones_ultimo_anio !== undefined) { fields.push(`lesiones_ultimo_anio = $${idx++}`); params.push(JSON.stringify(lesiones_ultimo_anio)); }

    if (fields.length === 0) {
      return res.status(400).json({ success: false, message: 'No hay campos para actualizar' });
    }

    // Añadimos el updated_at y el parámetro id
    params.push(id);
    const sql = `UPDATE atleta SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${idx} RETURNING *;`;

    const result = await query(sql, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: `No se encontró atleta con id ${id}` });
    }

    return res.status(200).json({ success: true, message: 'Atleta actualizado exitosamente', data: result.rows[0] });
  } catch (error) {
    console.error('Error al actualizar atleta:', error);
    return res.status(500).json({ success: false, message: 'Error al actualizar atleta en la base de datos', error: error.message });
  }
}

// Controlador para borrar un atleta por id.
export async function deleteAtletaById(req, res) {
  try {
    const { id } = req.params;

    // Intentamos borrar el atleta
    const result = await query('DELETE FROM atleta WHERE id = $1 RETURNING *;', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: `No se encontró atleta con id ${id}` });
    }

    return res.status(200).json({ success: true, message: 'Atleta borrado exitosamente', data: result.rows[0] });
  } catch (error) {
    console.error('Error al borrar atleta:', error);
    return res.status(500).json({ success: false, message: 'Error al borrar atleta en la base de datos', error: error.message });
  }
}
