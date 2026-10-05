import express from 'express';
import { getPerfil, putPerfil } from '../../controllers/negocio/perfilController.js';
import { verificarToken } from '../../middleware/verificarToken.js';
import { verificarRol } from '../../middleware/verificarRol.js';

const router = express.Router();

// Perfil propio del atleta: sin id en la URL.
router.get('/perfil', verificarToken, verificarRol('ATLETA'), getPerfil);
router.put('/perfil', verificarToken, verificarRol('ATLETA'), putPerfil);

export default router;
