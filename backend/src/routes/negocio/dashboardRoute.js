import express from 'express';
import { getDashboard } from '../../controllers/negocio/dashboardController.js';
import { verificarToken } from '../../middleware/verificarToken.js';
import { verificarRol } from '../../middleware/verificarRol.js';

const router = express.Router();

router.get('/dashboard', verificarToken, verificarRol('ADMIN', 'ENTRENADOR', 'ATLETA'), getDashboard);

export default router;