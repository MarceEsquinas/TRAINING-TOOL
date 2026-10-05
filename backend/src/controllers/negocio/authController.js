import { loginData, registerAtletaData } from '../../services/negocio/authService.js';
import { ServiceError } from '../../services/serviceError.js';

export async function postRegister(req, res) {
  try {
    const data = await registerAtletaData(req.body ?? {});

    return res.status(201).json({
      success: true,
      message: 'Cuenta de atleta creada correctamente',
      data,
    });
  } catch (error) {
    if (error instanceof ServiceError) {
      return res.status(error.status).json({ success: false, message: error.message });
    }

    console.error('Error al registrar atleta:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al crear la cuenta de atleta',
    });
  }
}

export async function postLogin(req, res) {
  try {
    const { usuario, token } = await loginData({
      username: req.body?.username,
      password: req.body?.password,
    });

    return res.status(200).json({
      success: true,
      message: 'Login correcto',
      data: {
        usuario,
        token,
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
