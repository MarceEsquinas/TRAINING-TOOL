import crypto from 'crypto';
import pool from '../../config/db.js';
import { query } from '../../config/db.js';
import { createAtleta } from '../crud/atletasService.js';
import { createUsuario } from '../crud/usuarioService.js';
import { ServiceError } from '../serviceError.js';

function hashPassword(password) {
  return crypto.createHash('sha256').update(String(password)).digest('hex');
}

const DIAS_VALIDOS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function registerAtletaData(payload = {}) {
  const {
    nombre,
    username,
    email,
    password,
    peso,
    dias_disponibles: diasDisponibles,
    km_medios_ultimos_2_meses: kmMedios,
    lesiones_ultimo_anio: lesiones,
  } = payload;

  if (!String(nombre ?? '').trim()) {
    throw new ServiceError(400, 'El nombre es requerido');
  }

  if (String(nombre).trim().length > 100) {
    throw new ServiceError(400, 'El nombre no puede superar los 100 caracteres');
  }

  if (!EMAIL_REGEX.test(String(email ?? '').trim())) {
    throw new ServiceError(400, 'El email no tiene un formato válido');
  }

  if (String(username ?? '').trim().length > 50) {
    throw new ServiceError(400, 'El username no puede superar los 50 caracteres');
  }

  if (String(email).trim().length > 150) {
    throw new ServiceError(400, 'El email no puede superar los 150 caracteres');
  }

  if (!Number.isFinite(Number(peso)) || Number(peso) <= 0 || Number(peso) > 999.99) {
    throw new ServiceError(400, 'El peso debe ser un número entre 0 y 999,99 kg');
  }

  if (!Array.isArray(diasDisponibles) || diasDisponibles.length === 0
    || diasDisponibles.some((dia) => !DIAS_VALIDOS.includes(dia))
    || new Set(diasDisponibles).size !== diasDisponibles.length) {
    throw new ServiceError(400, 'Selecciona días disponibles válidos');
  }

  if (kmMedios === undefined || kmMedios === null || kmMedios === ''
    || !Number.isFinite(Number(kmMedios)) || Number(kmMedios) < 0 || Number(kmMedios) > 999.99) {
    throw new ServiceError(400, 'Los kilómetros medios deben ser un número entre 0 y 999,99');
  }

  if (!Array.isArray(lesiones) || lesiones.some((lesion) => (
    !lesion || typeof lesion !== 'object' || !String(lesion.tipo ?? '').trim()
  ))) {
    throw new ServiceError(400, 'Indica las lesiones del último año correctamente');
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const usuario = await createUsuario({
      username,
      email,
      password,
      rol: 'ATLETA',
    }, client);

    const atleta = await createAtleta({
      nombre,
      usuario_id: usuario.id,
      peso,
      dias_disponibles: diasDisponibles,
      km_medios_ultimos_2_meses: kmMedios,
      lesiones_ultimo_anio: lesiones,
    }, client);

    await client.query('COMMIT');
    return { usuario, atleta };
  } catch (error) {
    await client.query('ROLLBACK');

    if (error instanceof ServiceError) {
      throw error;
    }

    if (error.code === '23505') {
      throw new ServiceError(409, 'Ya existe un usuario con ese username o email');
    }

    throw error;
  } finally {
    client.release();
  }
}

export async function loginData({ username, password }) {
  const usernameValue = String(username ?? '').trim();
  const passwordValue = String(password ?? '');

  if (!usernameValue || !passwordValue) {
    throw new ServiceError(400, 'Username y contraseña son obligatorios');
  }

  const result = await query(
    `SELECT id, username, password_hash, rol
     FROM usuario
     WHERE username = $1
     LIMIT 1`,
    [usernameValue]
  );

  const usuario = result.rows[0] ?? null;
  const passwordHash = hashPassword(passwordValue);

  if (!usuario || usuario.password_hash !== passwordHash) {
    // Mensaje genérico para no revelar si el username existe.
    throw new ServiceError(401, 'Credenciales inválidas');
  }

  // ─── CONCEPTO: GENERACIÓN DE TOKEN ───────────────────────────────────────
  //
  // Una vez verificadas las credenciales, el backend genera un TOKEN.
  // Un token es una cadena firmada que contiene datos del usuario (payload).
  //
  // Ejemplo con la librería jsonwebtoken (JWT):
  //
  //   import jwt from 'jsonwebtoken';
  //
  //   const token = jwt.sign(
  //     { id: usuario.id, username: usuario.username, rol: usuario.rol },  // payload: qué guarda
  //     process.env.JWT_SECRET,                                            // firma secreta del servidor
  //     { expiresIn: '8h' }                                                // cuánto tiempo es válido
  //   );
  //
  // El cliente guarda ese token y lo envía en cada petición futura:
  //   Authorization: Bearer <token>
  //
  // El servidor puede verificar que el token es auténtico (fue firmado por él)
  // sin necesidad de consultar la base de datos en cada petición.
  //
  // POR QUÉ NO LO IMPLEMENTAMOS AÚN:
  //   Este bloque solo necesita verificar credenciales.
  //   El token protegería las rutas del panel, que viene en el siguiente bloque.
  // ────────────────────────────────────────────────────────────────────────────

  return {
    id: usuario.id,
    username: usuario.username,
    rol: usuario.rol,
  };
}
