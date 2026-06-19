import express from 'express';
import { markNotificationRead } from '../../controllers/negocio/notificacionController.js';

const router = express.Router();

// Rutas de negocio de notificaciones.
router.patch('/notifications/:id/read', markNotificationRead);

export default router;