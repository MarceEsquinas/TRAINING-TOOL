import { getDashboardData } from '../../services/negocio/dashboardService.js';

// Controlador para GET /dashboard
export async function getDashboard(req, res) {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const offset = parseInt(req.query.offset, 10) || 0;
    const dashboardData = await getDashboardData({ limit, offset });

    return res.status(200).json({
      success: true,
      summary: dashboardData.summary,
      notifications: dashboardData.notifications,
      atletas: dashboardData.atletas,
    });
  } catch (error) {
    console.error('Error en getDashboard:', error);
    return res.status(500).json({ success: false, message: 'Error al obtener dashboard', error: error.message });
  }
}
