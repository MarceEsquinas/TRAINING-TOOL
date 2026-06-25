import { API_BASE_URL } from './apiBaseUrl'

// Obtiene el contexto de planificación de un atleta concreto.
// Responde con atleta, objetivo, semana y sesiones en una sola llamada.
export async function fetchPlanificacion(atletaId) {
  if (!atletaId) {
    throw new Error('Se requiere atletaId para consultar la planificación')
  }

  const response = await fetch(`${API_BASE_URL}/planificacion/${atletaId}`)

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
