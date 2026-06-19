import express from 'express';
import { getSemanasEntrenamiento, getSemanaEntrenamientoById, postSemanaEntrenamiento, updateSemanaEntrenamientoById, deleteSemanaEntrenamientoById } from '../../controllers/crud/semanaEntrenamientoController.js';

const router = express.Router();

// Rutas CRUD de semanas de entrenamiento.
router.get('/semanasEntrenamiento', getSemanasEntrenamiento);
router.get('/semanasEntrenamiento/:id', getSemanaEntrenamientoById);
router.put('/semanasEntrenamiento/:id', updateSemanaEntrenamientoById);
router.delete('/semanasEntrenamiento/:id', deleteSemanaEntrenamientoById);
router.post('/semanasEntrenamiento', postSemanaEntrenamiento);

export default router;