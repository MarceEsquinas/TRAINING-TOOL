import {
  getPlanificacionAtletaData,
  getPropuestaNuevaSemanaData,
  createSemanaDesdePlanificacionData,
  createSesionSemanaDesdePlanificacionData,
} from '../../services/negocio/planificacionService.js';
import { ServiceError } from '../../services/serviceError.js';

// Controlador para GET /planificacion/:atletaId
export async function getPlanificacionAtleta(req, res) {
  try {
    const { atletaId } = req.params;
    const data = await getPlanificacionAtletaData(atletaId);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    if (error instanceof ServiceError) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    console.error('Error al obtener la planificación del atleta:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener la planificación del atleta',
      error: error.message,
    });
  }
}

// Controlador para GET /planificacion/:atletaId/semanas/propuesta
export async function getPropuestaNuevaSemana(req, res) {
  try {
    const { atletaId } = req.params;
    const data = await getPropuestaNuevaSemanaData(atletaId);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    if (error instanceof ServiceError) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    console.error('Error al obtener propuesta de nueva semana:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener propuesta de nueva semana',
      error: error.message,
    });
  }
}

// Controlador para POST /planificacion/:atletaId/semanas
export async function createSemanaDesdePlanificacion(req, res) {
  try {
    const { atletaId } = req.params;
    const data = await createSemanaDesdePlanificacionData({
      atletaId,
      ...(req.body ?? {}),
    });

    return res.status(201).json({
      success: true,
      message: 'Semana creada exitosamente',
      data,
    });
  } catch (error) {
    if (error instanceof ServiceError) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    console.error('Error al crear semana desde planificación:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al crear semana desde planificación',
      error: error.message,
    });
  }
}

// Controlador para POST /planificacion/:atletaId/semanas/:semanaId/sesiones
export async function createSesionSemanaDesdePlanificacion(req, res) {
  try {
    const { atletaId, semanaId } = req.params;
    const data = await createSesionSemanaDesdePlanificacionData({
      atletaId,
      semanaId,
      ...(req.body ?? {}),
    });

    return res.status(201).json({
      success: true,
      message: 'Sesión creada exitosamente',
      data,
    });
  } catch (error) {
    if (error instanceof ServiceError) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    console.error('Error al crear sesión desde planificación:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al crear sesión desde planificación',
      error: error.message,
    });
  }
}