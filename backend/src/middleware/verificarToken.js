import jwt from 'jsonwebtoken';

// Identifica al usuario a partir del token firmado; req.user solo se rellena si la firma es válida.
export function verificarToken(req, res, next) {
  const header = req.headers.authorization ?? '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ success: false, message: 'Token de autenticación requerido' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.id, username: payload.username, rol: payload.rol, atletaId: payload.atletaId };
    return next();
  } catch {
    return res.status(401).json({ success: false, message: 'Token inválido o caducado' });
  }
}
