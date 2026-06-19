import express from 'express';
import { getDashboard } from '../../controllers/business/dashboardController.js';

const router = express.Router();

// Rutas de negocio del dashboard.
router.get('/dashboard', getDashboard);

export default router;