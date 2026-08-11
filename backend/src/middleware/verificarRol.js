// ─── QUÉ HACE ESTE MIDDLEWARE ────────────────────────────────────────────────
//
// Se ejecuta DESPUÉS de verificarToken (que ya puso req.usuario).
// Comprueba que el rol del usuario esté entre los roles permitidos.
//
// Flujo:
//   verificarToken → verificarRol('ADMIN') → next() → controlador
//                                        ↓ (si no tiene permiso)
//                                     403 Forbidden
//
// Uso en una ruta:
//   router.get('/ruta', verificarToken, verificarRol('ADMIN'), controlador)
//   router.get('/ruta', verificarToken, verificarRol('ADMIN','ENTRENADOR'), controlador)
//
// Diferencia entre 401 y 403:
//   401 Unauthorized → no estás identificado (no hay token válido)
//   403 Forbidden    → estás identificado pero no tienes permiso
// ─────────────────────────────────────────────────────────────────────────────

export function verificarRol(...rolesPermitidos) {
  return function (req, res, next) {
    const rol = req.usuario?.rol;

    if (!rolesPermitidos.includes(rol)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para realizar esta acción',
      });
    }

    next();
  };
}
