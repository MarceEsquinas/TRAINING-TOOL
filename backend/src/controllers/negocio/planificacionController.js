import {
  getPlanificacionAtletaData,
  getPropuestaNuevaSemanaData,
  createSemanaDesdePlanificacionData,
  createSesionSemanaDesdePlanificacionData,
  registrarResultadoSesionDesdePlanificacionData,
  registrarMarcaObjetivoDesdePlanificacionData,
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

// Controlador para PATCH /planificacion/:atletaId/semanas/:semanaId/sesiones/:sesionId/resultado
export async function registrarResultadoSesionDesdePlanificacion(req, res) {
  try {
    const { atletaId, semanaId, sesionId } = req.params;
    const data = await registrarResultadoSesionDesdePlanificacionData({
      atletaId,
      semanaId,
      sesionId,
      ...(req.body ?? {}),
    });

    return res.status(200).json({
      success: true,
      message: 'Resultado de sesión registrado exitosamente',
      data,
    });
  } catch (error) {
    if (error instanceof ServiceError) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    console.error('Error al registrar resultado de sesión:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al registrar resultado de sesión',
      error: error.message,
    });
  }
}

// Controlador para PATCH /planificacion/:atletaId/objetivos/:objetivoId/marca
export async function registrarMarcaObjetivoDesdePlanificacion(req, res) {
  try {
    const { atletaId, objetivoId } = req.params;
    const data = await registrarMarcaObjetivoDesdePlanificacionData({
      atletaId,
      objetivoId,
      ...(req.body ?? {}),
    });

    return res.status(200).json({
      success: true,
      message: 'Marca registrada exitosamente',
      data,
    });
  } catch (error) {
    if (error instanceof ServiceError) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    console.error('Error al registrar marca de objetivo:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al registrar marca de objetivo',
      error: error.message,
    });
  }
}