// Debe ir después de verificarToken: 401 = no sé quién eres, 403 = sé quién eres pero no tienes permiso.
export function verificarRol(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.user || !rolesPermitidos.includes(req.user.rol)) {
      return res.status(403).json({ success: false, message: 'No tienes permisos para esta acción' });
    }
    return next();
  };
}
