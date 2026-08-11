import { API_BASE_URL, fetchWithAuth } from './apiBaseUrl'

export async function fetchHistorialAtleta(atletaId) {
  if (!atletaId) {
    throw new Error('Se requiere atletaId para consultar historial')
  }

  const response = await fetchWithAuth(`${API_BASE_URL}/historial/atletas/${atletaId}`)

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('No se encontro el atleta solicitado')
    }
    throw new Error('No se pudo obtener el historial del atleta')
  }

  const data = await response.json()

  if (!data.success || !data.data) {
    throw new Error('El backend devolvio una respuesta de historial no valida')
  }

  return data.data
}

export async function fetchDetalleFeedback(feedbackId) {
  if (!feedbackId) {
    throw new Error('Se requiere feedbackId para consultar el detalle')
  }

  const response = await fetchWithAuth(`${API_BASE_URL}/historial/feedback/${feedbackId}`)

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('No se encontro el feedback solicitado')
    }
    throw new Error('No se pudo obtener el detalle del feedback')
  }

  const data = await response.json()

  if (!data.success || !data.data) {
    throw new Error('El backend devolvio un detalle de feedback no valido')
  }

  return data.data
}
