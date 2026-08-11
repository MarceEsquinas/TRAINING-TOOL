import express from 'express';
import {
  getAdministracionAtletas,
  postAutoasignacionAtletaPendiente,
  postReasignacionAtleta,
  putAtletaAdministracion,
  postResetPasswordTemporalAtleta,
} from '../../controllers/negocio/administracionController.js';
import { verificarToken } from '../../middleware/verificarToken.js';
import { verificarRol } from '../../middleware/verificarRol.js';

const router = express.Router();

// Solo ADMIN puede usar el módulo de administración.
const soloAdmin = [verificarToken, verificarRol('ADMIN')];

router.get('/administracion/atletas', ...soloAdmin, getAdministracionAtletas);
router.post('/administracion/atletas/:atletaId/autoasignacion', ...soloAdmin, postAutoasignacionAtletaPendiente);
router.post('/administracion/atletas/:atletaId/reasignacion', ...soloAdmin, postReasignacionAtleta);
router.put('/administracion/atletas/:atletaId', ...soloAdmin, putAtletaAdministracion);
router.post('/administracion/atletas/:atletaId/reset-password', ...soloAdmin, postResetPasswordTemporalAtleta);

export default router;
