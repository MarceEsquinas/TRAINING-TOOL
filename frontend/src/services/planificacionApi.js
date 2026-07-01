import { API_BASE_URL } from './apiBaseUrl'

function mapNetworkError(error, fallbackMessage) {
  if (error instanceof TypeError) {
    return new Error('No se pudo conectar con el backend. Verifica que el servidor API esté levantado en http://localhost:3000')
  }
  return new Error(error?.message || fallbackMessage)
}

async function getErrorMessageFromResponse(response, fallbackMessage) {
  try {
    const errorData = await response.json()
    if (errorData?.message) {
      return errorData.message
    }
  } catch {
    // Si la respuesta no es JSON, se usa el fallback.
  }
  return fallbackMessage
}

// Obtiene el contexto de planificación de un atleta concreto.
// Responde con atleta, objetivo, semana y sesiones en una sola llamada.
export async function fetchPlanificacion(atletaId) {
  if (!atletaId) {
    throw new Error('Se requiere atletaId para consultar la planificación')
  }

  let response
  try {
    response = await fetch(`${API_BASE_URL}/planificacion/${atletaId}`)
  } catch (error) {
    throw mapNetworkError(error, 'No se pudo obtener la planificación del atleta')
  }

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('No se encontró el atleta solicitado')
    }
    throw new Error('No se pudo obtener la planificación del atleta')
  }

  const data = await response.json()

  if (!data.success || !data.data) {
    throw new Error('El backend devolvió una respuesta de planificación no válida')
  }

  return data.data
}

// Obtiene la propuesta de nueva semana para la planificación de un atleta.
// El backend devuelve fecha de inicio sugerida y fecha de fin calculada.
export async function fetchPropuestaNuevaSemana(atletaId) {
  if (!atletaId) {
    throw new Error('Se requiere atletaId para obtener la propuesta de semana')
  }

  let response
  try {
    response = await fetch(`${API_BASE_URL}/planificacion/${atletaId}/semanas/propuesta`)
  } catch (error) {
    throw mapNetworkError(error, 'No se pudo obtener la propuesta de nueva semana')
  }

  if (!response.ok) {
    const backendMessage = await getErrorMessageFromResponse(response, 'No se pudo obtener la propuesta de nueva semana')
    if (response.status === 404) {
      throw new Error(backendMessage || 'No se encontró el atleta solicitado')
    }
    if (response.status === 409) {
      throw new Error(backendMessage || 'El atleta no tiene objetivo activo para planificar')
    }
    throw new Error(backendMessage)
  }

  const data = await response.json()

  if (!data.success || !data.data?.propuesta) {
    throw new Error('El backend devolvió una propuesta de semana no válida')
  }

  return data.data
}

// Crea una semana para la planificación del atleta a partir de una fecha de inicio.
// La fecha de fin siempre se calcula en backend (inicio + 6 días).
export async function createSemanaPlanificacion(atletaId, fechaInicio) {
  if (!atletaId) {
    throw new Error('Se requiere atletaId para crear una semana')
  }

  if (!fechaInicio) {
    throw new Error('Se requiere fecha de inicio para crear una semana')
  }

  let response
  try {
    response = await fetch(`${API_BASE_URL}/planificacion/${atletaId}/semanas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fecha_inicio: fechaInicio }),
    })
  } catch (error) {
    throw mapNetworkError(error, 'No se pudo crear la semana')
  }

  if (!response.ok) {
    const backendMessage = await getErrorMessageFromResponse(response, 'No se pudo crear la semana')
    if (response.status === 400) {
      throw new Error(backendMessage || 'La fecha de inicio no es válida')
    }
    if (response.status === 404) {
      throw new Error(backendMessage || 'No se encontró el atleta solicitado')
    }
    if (response.status === 409) {
      throw new Error(backendMessage)
    }
    throw new Error(backendMessage)
  }

  const data = await response.json()

  if (!data.success || !data.data?.semana) {
    throw new Error('El backend devolvió una respuesta de creación de semana no válida')
  }

  return data.data
}

export async function createSesionPlanificacion(atletaId, semanaId, payload) {
  if (!atletaId) {
    throw new Error('Se requiere atletaId para crear una sesión')
  }

  if (!semanaId) {
    throw new Error('Se requiere semanaId para crear una sesión')
  }

  let response
  try {
    response = await fetch(`${API_BASE_URL}/planificacion/${atletaId}/semanas/${semanaId}/sesiones`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload || {}),
    })
  } catch (error) {
    throw mapNetworkError(error, 'No se pudo crear la sesión de entrenamiento')
  }

  if (!response.ok) {
    const backendMessage = await getErrorMessageFromResponse(response, 'No se pudo crear la sesión de entrenamiento')
    if (response.status === 400) {
      throw new Error(backendMessage || 'Los datos de la sesión no son válidos')
    }
    if (response.status === 404) {
      throw new Error(backendMessage || 'No se encontró la semana seleccionada')
    }
    if (response.status === 409) {
      throw new Error(backendMessage)
    }
    throw new Error(backendMessage)
  }

  const data = await response.json()

  if (!data.success || !data.data?.sesion) {
    throw new Error('El backend devolvió una respuesta de creación de sesión no válida')
  }

  return data.data
}

export async function registrarResultadoSesionPlanificacion(atletaId, semanaId, sesionId, payload) {
  if (!atletaId) {
    throw new Error('Se requiere atletaId para registrar el resultado de una sesión')
  }

  if (!semanaId) {
    throw new Error('Se requiere semanaId para registrar el resultado de una sesión')
  }

  if (!sesionId) {
    throw new Error('Se requiere sesionId para registrar el resultado de una sesión')
  }

  let response
  try {
    response = await fetch(`${API_BASE_URL}/planificacion/${atletaId}/semanas/${semanaId}/sesiones/${sesionId}/resultado`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload || {}),
    })
  } catch (error) {
    throw mapNetworkError(error, 'No se pudo registrar el resultado de la sesión')
  }

  if (!response.ok) {
    const backendMessage = await getErrorMessageFromResponse(response, 'No se pudo registrar el resultado de la sesión')
    if (response.status === 400) {
      throw new Error(backendMessage || 'Los datos de resultado de sesión no son válidos')
    }
    if (response.status === 404) {
      throw new Error(backendMessage || 'No se encontró la sesión seleccionada')
    }
    if (response.status === 409) {
      throw new Error(backendMessage)
    }
    throw new Error(backendMessage)
  }

  const data = await response.json()

  if (!data.success || !data.data?.sesion) {
    throw new Error('El backend devolvió una respuesta de registro de resultado no válida')
  }

  return data.data
}
