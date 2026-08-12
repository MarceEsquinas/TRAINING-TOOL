import dotenv from 'dotenv';
import crypto from 'crypto';
import pool, { query } from '../config/db.js';

dotenv.config({ path: '.env.seed' });

function hashPassword(password) {
  return crypto.createHash('sha256').update(String(password)).digest('hex');
}

async function ensureAdminUser() {
  const username = process.env.ADMIN_USERNAME?.trim();
  const password = process.env.ADMIN_PASSWORD;

  if (!username) {
    throw new Error('ADMIN_USERNAME no está definido. Añádelo en backend/.env.seed');
  }

  if (!password || String(password).trim().length < 6) {
    throw new Error('ADMIN_PASSWORD no está definido o es demasiado corto. Debe tener al menos 6 caracteres');
  }

  const existingAdmin = await query("SELECT id, username FROM usuario WHERE rol = 'ADMIN' LIMIT 1");

  if (existingAdmin.rows.length > 0) {
    console.log(`El usuario ADMIN ya existe: ${existingAdmin.rows[0].username}`);
    return;
  }

  const passwordHash = hashPassword(password);
  const result = await query(
    'INSERT INTO usuario (username, password_hash, rol) VALUES ($1, $2, $3) RETURNING id, username, rol',
    [username, passwordHash, 'ADMIN']
  );

  console.log(`Usuario ADMIN creado: ${result.rows[0].username} (id=${result.rows[0].id})`);
}

try {
  await ensureAdminUser();
} catch (error) {
  console.error('Error al generar el usuario ADMIN:', error.message);
  process.exitCode = 1;
} finally {
  await pool.end().catch(() => {});
}
