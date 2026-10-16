import { API_BASE_URL, fetchWithAuth } from './apiBaseUrl'

// Debe coincidir con DISTANCIAS_OBJETIVO_PREDEFINIDAS del backend.
export const DISTANCIAS_OBJETIVO = ['5K', '10K', 'Media Maratón', 'Maratón', 'Trail', 'Ultra Trail', 'Otro']

export async function crearObjetivo(payload) {
  let response
  try {
    response = await fetchWithAuth(`${API_BASE_URL}/objetivos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch {
    throw new Error('No se pudo conectar con el servidor')
  }

  const data = await response.json().catch(() => null)

  if (!response.ok || !data?.success) {
    throw new Error(data?.message || 'No se pudo crear el objetivo')
  }

  return data.data
}
