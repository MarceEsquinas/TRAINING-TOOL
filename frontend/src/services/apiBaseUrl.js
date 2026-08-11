// URL base compartida para todas las llamadas HTTP del frontend.
// Prioriza variables de entorno de Vite y usa localhost en desarrollo.
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:3000'

// Lee el token guardado en localStorage tras el login y lo añade a cada petición.
// Usar fetchWithAuth en lugar de fetch en todos los servicios API protegidos.
export function fetchWithAuth(url, options = {}) {
  const raw = localStorage.getItem('tt_auth_user')
  let token = null

  try {
    token = raw ? JSON.parse(raw)?.token : null
  } catch {
    token = null
  }

  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  })
}
