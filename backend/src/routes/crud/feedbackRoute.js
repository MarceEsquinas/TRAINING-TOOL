import express from 'express';
import { getFeedback, getFeedbackById, postFeedback, updateFeedbackById, deleteFeedbackById } from '../../controllers/crud/feedbackController.js';
import { verificarToken } from '../../middleware/verificarToken.js';
import { verificarRol } from '../../middleware/verificarRol.js';

const router = express.Router();

// El atleta envía feedback por /planificacion y lo consulta en /historial; este CRUD es de gestión.
router.use('/feedback', verificarToken, verificarRol('ADMIN', 'ENTRENADOR'));

// Rutas CRUD de feedback semanal.
router.get('/feedback', getFeedback);
router.get('/feedback/:id', getFeedbackById);
router.post('/feedback', postFeedback);
router.put('/feedback/:id', updateFeedbackById);
router.delete('/feedback/:id', deleteFeedbackById);

export default router;