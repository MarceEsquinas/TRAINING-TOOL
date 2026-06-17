import express from 'express';
import { markNotificationRead } from '../controllers/notificacionController.js';

const router = express.Router();

router.patch('/notifications/:id/read', markNotificationRead);

export default router;
