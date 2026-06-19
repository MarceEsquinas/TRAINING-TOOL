import express from 'express';
import { getSesionesEntrenamiento, getSesionEntrenamientoById, postSesionEntrenamiento, updateSesionEntrenamientoById, deleteSesionEntrenamientoById } from '../../controllers/crud/sesionEntrenamientoController.js';

const router = express.Router();

// Rutas CRUD de sesiones de entrenamiento.
router.get('/sesionesEntrenamiento', getSesionesEntrenamiento);
router.get('/sesionesEntrenamiento/:id', getSesionEntrenamientoById);
router.put('/sesionesEntrenamiento/:id', updateSesionEntrenamientoById);
router.delete('/sesionesEntrenamiento/:id', deleteSesionEntrenamientoById);
router.post('/sesionesEntrenamiento', postSesionEntrenamiento);

export default router;