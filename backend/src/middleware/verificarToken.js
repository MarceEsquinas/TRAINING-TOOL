import jwt from 'jsonwebtoken';

// ─── QUÉ HACE ESTE MIDDLEWARE ────────────────────────────────────────────────
//
// Se ejecuta ANTES del controlador en cada ruta protegida.
//
// Flujo:
//   Petición → verificarToken → next() → controlador → respuesta
//                           ↓ (si falla)
//                        401 Unauthorized
//
// El cliente debe enviar el token en la cabecera:
//   Authorization: Bearer <token>
//
// Si el token es válido, añade req.usuario = { id, username, rol }
// para que los controladores y verificarRol puedan usarlo.
// ─────────────────────────────────────────────────────────────────────────────

export function verificarToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Token requerido' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = payload;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Token inválido o expirado' });
  }
}
