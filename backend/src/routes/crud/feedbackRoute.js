import express from 'express';
import { getFeedback, getFeedbackById, postFeedback, updateFeedbackById, deleteFeedbackById } from '../../controllers/crud/feedbackController.js';
import { verificarToken } from '../../middleware/verificarToken.js';
import { verificarRol } from '../../middleware/verificarRol.js';

const router = express.Router();

const adminEntrenador = [verificarToken, verificarRol('ADMIN', 'ENTRENADOR')];

router.get('/feedback', ...adminEntrenador, getFeedback);
router.get('/feedback/:id', ...adminEntrenador, getFeedbackById);
router.post('/feedback', verificarToken, verificarRol('ADMIN', 'ENTRENADOR', 'ATLETA'), postFeedback);
router.put('/feedback/:id', ...adminEntrenador, updateFeedbackById);
router.delete('/feedback/:id', ...adminEntrenador, deleteFeedbackById);

export default router;