import express from 'express';
import { getObjetivos, getObjetivoById, postObjetivo, updateObjetivoById, deleteObjetivoById } from '../../controllers/crud/objetivoController.js';

const router = express.Router();

// Rutas CRUD de objetivos.
router.get('/objetivos', getObjetivos);
router.get('/objetivos/:id', getObjetivoById);
router.put('/objetivos/:id', updateObjetivoById);
router.delete('/objetivos/:id', deleteObjetivoById);
router.post('/objetivos', postObjetivo);

export default router;