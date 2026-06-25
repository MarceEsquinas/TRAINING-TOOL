// URL base compartida para todas las llamadas HTTP del frontend.
// Prioriza variables de entorno de Vite y usa localhost en desarrollo.
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:3000'
