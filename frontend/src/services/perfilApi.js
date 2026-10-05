import { API_BASE_URL, fetchWithAuth } from './apiBaseUrl'

async function parse(response, fallback) {
  let payload
  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  if (!response.ok || !payload?.success) {
    throw new Error(payload?.message || fallback)
  }

  return payload.data
}

export async function fetchPerfil() {
  const response = await fetchWithAuth(`${API_BASE_URL}/perfil`)
  return parse(response, 'No se pudo obtener tu perfil')
}

export async function updatePerfil(payload) {
  const response = await fetchWithAuth(`${API_BASE_URL}/perfil`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return parse(response, 'No se pudo guardar tu perfil')
}
