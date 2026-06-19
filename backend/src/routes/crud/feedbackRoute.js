import express from 'express';
import { getFeedback, getFeedbackById, postFeedback, updateFeedbackById, deleteFeedbackById } from '../../controllers/crud/feedbackController.js';

const router = express.Router();

// Rutas CRUD de feedback semanal.
router.get('/feedback', getFeedback);
router.get('/feedback/:id', getFeedbackById);
router.post('/feedback', postFeedback);
router.put('/feedback/:id', updateFeedbackById);
router.delete('/feedback/:id', deleteFeedbackById);

export default router;