import { loginData } from '../../services/negocio/authService.js';
import { ServiceError } from '../../services/serviceError.js';

export async function postLogin(req, res) {
  try {
    const usuario = await loginData({
      username: req.body?.username,
      password: req.body?.password,
    });

    return res.status(200).json({
      success: true,
      message: 'Login correcto',
      data: {
        usuario,
      },
    });
  } catch (error) {
    if (error instanceof ServiceError) {
      return res.status(error.status).json({ success: false, message: error.message });
    }

    console.error('Error en postLogin:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al iniciar sesión',
      error: error.message,
    });
  }
}
