import express from 'express';
import { postLogin } from '../../controllers/negocio/authController.js';

const router = express.Router();

// ─── CONCEPTO: MIDDLEWARE ────────────────────────────────────────────────────
//
// Un middleware es una función que se ejecuta ENTRE que llega la petición
// y que llega al controlador. Tiene acceso a (req, res, next).
//
// Diagrama de flujo con middleware:
//
//   Petición HTTP
//       ↓
//   [middleware verificarToken]   ← intercepta ANTES del controlador
//       ↓ (llama a next() si el token es válido)
//   [controlador: getDashboard]
//       ↓
//   Respuesta HTTP
//
// Ejemplo de cómo se usaría aquí:
//
//   import { verificarToken } from '../../middleware/auth.js';
//
//   router.get('/dashboard', verificarToken, getDashboard);  // ruta protegida
//   router.post('/auth/login', postLogin);                   // ruta pública (sin middleware)
//
// El middleware de auth leería el token del header Authorization,
// lo verificaría con jwt.verify() y si es válido llamaría a next().
// Si no es válido, respondería 401 sin llegar al controlador.
// ─────────────────────────────────────────────────────────────────────────────

// Ruta pública: no necesita middleware de autenticación.
router.post('/auth/login', postLogin);

export default router;
