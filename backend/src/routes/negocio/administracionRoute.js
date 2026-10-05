import express from 'express';
import {
  getAdministracionAtletas,
  postAutoasignacionAtletaPendiente,
  postReasignacionAtleta,
  putAtletaAdministracion,
  postResetPasswordTemporalAtleta,
  postCrearEntrenador,
  putActualizarEntrenador,
  putActualizarPasswordEntrenador,
} from '../../controllers/negocio/administracionController.js';
import { verificarToken } from '../../middleware/verificarToken.js';
import { verificarRol } from '../../middleware/verificarRol.js';

const router = express.Router();

// Toda la administración es solo para ADMIN.
router.use('/administracion', verificarToken, verificarRol('ADMIN'));

// Administración - Entrenadores
router.post('/administracion/entrenadores', postCrearEntrenador);
router.put('/administracion/entrenadores/:entrenadorId', putActualizarEntrenador);
router.put('/administracion/entrenadores/:entrenadorId/password', putActualizarPasswordEntrenador);

// Administración - Atletas
router.get('/administracion/atletas', getAdministracionAtletas);
router.post('/administracion/atletas/:atletaId/autoasignacion', postAutoasignacionAtletaPendiente);
router.post('/administracion/atletas/:atletaId/reasignacion', postReasignacionAtleta);
router.put('/administracion/atletas/:atletaId', putAtletaAdministracion);
router.post('/administracion/atletas/:atletaId/reset-password', postResetPasswordTemporalAtleta);

export default router;
