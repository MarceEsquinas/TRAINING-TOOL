import express from 'express';
import { getAtletas, getAtletaById, updateAtletaById, postAtletas, deleteAtletaById } from '../../controllers/crud/atletasController.js';

const router = express.Router();

// Rutas CRUD de atletas.
router.get('/atletas', getAtletas);
router.get('/atletas/:id', getAtletaById);
router.put('/atletas/:id', updateAtletaById);
router.delete('/atletas/:id', deleteAtletaById);
router.post('/atletas', postAtletas);

export default router;