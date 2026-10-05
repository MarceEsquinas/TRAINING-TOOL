// URL base compartida para todas las llamadas HTTP del frontend.
// Prioriza variables de entorno de Vite y usa localhost en desarrollo.
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:3000'

// Igual que fetch, pero añade el token guardado en el login.
export function fetchWithAuth(url, options = {}) {
  let token
  try {
    token = JSON.parse(localStorage.getItem('tt_auth_user'))?.token
  } catch {
    token = null
  }

  return fetch(url, {
    ...options,
    headers: { ...options.headers, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  })
}
