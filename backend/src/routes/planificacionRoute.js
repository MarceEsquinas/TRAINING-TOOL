import express from 'express';
import { getPlanificacionAtleta } from '../controllers/planificacionController.js';

const router = express.Router();

router.get('/planificacion/:atletaId', getPlanificacionAtleta);

export default router;