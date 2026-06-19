import crypto from 'crypto';
import { query } from '../../config/db.js';

function hashPassword(password) {
  return crypto.createHash('sha256').update(String(password)).digest('hex');
}

function sanitizeUsuario(row) {
  if (!row) return null;
  const { password_hash, ...usuario } = row;
  return usuario;
}

export async function getUsuarios(req, res) {
  try {
    const result = await query(
      'SELECT id, username, rol, created_at, updated_at FROM usuario ORDER BY id'
    );

    return res.status(200).json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener usuarios de la base de datos',
      error: error.message,
    });
  }
}

export async function getUsuarioById(req, res) {
  try {
    const { id } = req.params;
    const result = await query(
      'SELECT id, username, rol, created_at, updated_at FROM usuario WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No se encontró usuario con id ${id}`,
      });
    }

    return res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error al obtener usuario por id:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener usuario de la base de datos',
      error: error.message,
    });
  }
}

export async function postUsuarios(req, res) {
  try {
    const { username, password, rol = 'ATLETA' } = req.body;
    const rolUpper = rol ? String(rol).toUpperCase() : 'ATLETA';

    if (!username || String(username).trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'El username es requerido',
      });
    }

    if (!password || String(password).trim().length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña es requerida y debe tener al menos 6 caracteres',
      });
    }

    const rolesValidos = ['ADMIN', 'ATLETA'];
    if (!rolesValidos.includes(rolUpper)) {
      return res.status(400).json({
        success: false,
        message: 'El rol debe ser ADMIN o ATLETA',
      });
    }

    const passwordHash = hashPassword(password);
    const result = await query(
      'INSERT INTO usuario (username, password_hash, rol) VALUES ($1, $2, $3) RETURNING id, username, rol, created_at, updated_at',
      [String(username).trim(), passwordHash, rolUpper]
    );

    return res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'El username ya existe',
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Error al crear usuario en la base de datos',
      error: error.message,
    });
  }
}

export async function updateUsuarioById(req, res) {
  try {
    const { id } = req.params;
    const { username, password, rol } = req.body;
    const fields = [];
    const params = [];
    let idx = 1;

    if (username !== undefined) {
      if (username === null || String(username).trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'El username no puede estar vacío',
        });
      }
      fields.push(`username = $${idx++}`);
      params.push(String(username).trim());
    }

    if (password !== undefined) {
      if (password === null || String(password).trim().length < 6) {
        return res.status(400).json({
          success: false,
          message: 'La contraseña debe tener al menos 6 caracteres',
        });
      }
      fields.push(`password_hash = $${idx++}`);
      params.push(hashPassword(password));
    }

    if (rol !== undefined) {
      const rolUpper = String(rol).toUpperCase();
      const rolesValidos = ['ADMIN', 'ATLETA'];
      if (!rolesValidos.includes(rolUpper)) {
        return res.status(400).json({
          success: false,
          message: 'El rol debe ser ADMIN o ATLETA',
        });
      }
      fields.push(`rol = $${idx++}`);
      params.push(rolUpper);
    }

    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No hay campos para actualizar',
      });
    }

    params.push(id);
    const sql = `UPDATE usuario SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${idx} RETURNING id, username, rol, created_at, updated_at`;
    const result = await query(sql, params);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No se encontró usuario con id ${id}`,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'El username ya existe',
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar usuario en la base de datos',
      error: error.message,
    });
  }
}

export async function deleteUsuarioById(req, res) {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM usuario WHERE id = $1 RETURNING id, username, rol, created_at, updated_at', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No se encontró usuario con id ${id}`,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Usuario eliminado exitosamente',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al eliminar usuario de la base de datos',
      error: error.message,
    });
  }
}
