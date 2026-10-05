// Un ATLETA solo puede operar sobre su propio atletaId; ENTRENADOR y ADMIN no se limitan aquí.
export function verificarAtletaPropio(req, res, next) {
  if (req.user?.rol === 'ATLETA' && Number(req.params.atletaId) !== Number(req.user.atletaId)) {
    return res.status(403).json({ success: false, message: 'No puedes acceder a datos de otro atleta' });
  }
  return next();
}
