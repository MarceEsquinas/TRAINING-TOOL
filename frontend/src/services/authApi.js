import { API_BASE_URL } from './apiBaseUrl'

async function parseJsonResponse(response, defaultError) {
  let payload

  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  if (!response.ok) {
    const error = new Error(payload?.message || defaultError)
    error.status = response.status
    throw error
  }

  if (!payload?.success) {
    const error = new Error(payload?.message || defaultError)
    error.status = response.status
    throw error
  }

  return payload
}

export async function loginUser({ username, password }) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })

  const payload = await parseJsonResponse(response, 'No se pudo iniciar sesión')
  return { ...payload.data?.usuario, token: payload.data?.token }
}
