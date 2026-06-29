import { getPlanificacionAtletaData } from '../../services/negocio/planificacionService.js';
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