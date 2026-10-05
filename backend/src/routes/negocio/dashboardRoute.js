import express from 'express';
import { getDashboard } from '../../controllers/negocio/dashboardController.js';
import { verificarToken } from '../../middleware/verificarToken.js';

const router = express.Router();

// Rutas de negocio del dashboard.
router.get('/dashboard', verificarToken, getDashboard);

export default router;