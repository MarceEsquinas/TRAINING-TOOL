const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:3000'

export async function fetchDashboard({ limit = 50, offset = 0 } = {}) {
  const response = await fetch(
    `${API_BASE_URL}/dashboard?limit=${limit}&offset=${offset}`
  )

  if (!response.ok) {
    throw new Error('No se pudo obtener el dashboard')
  }

  const data = await response.json()

  if (!data.success) {
    throw new Error('El backend devolvio una respuesta no valida')
  }

  return data
}
