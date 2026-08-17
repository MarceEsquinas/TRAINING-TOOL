import { API_BASE_URL } from './apiBaseUrl'

// Normaliza errores de red/negocio para que la UI no repita parsing en cada llamada.
async function parseJsonResponse(response, defaultError) {
  let payload

  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  if (!response.ok) {
    throw new Error(payload?.message || defaultError)
  }

  if (!payload?.success) {
    throw new Error(payload?.message || defaultError)
  }

  return payload
}

// --- Entrenadores (entidad) ---
export async function fetchEntrenadoresAdmin() {
  const response = await fetch(`${API_BASE_URL}/entrenadores`)
  const payload = await parseJsonResponse(response, 'No se pudo obtener entrenadores')
  return payload.data || []
}

export async function createEntrenadorAdmin(data) {
  const payloadRequest = {
    username: data?.username ?? data?.usuario ?? '',
    email: data?.email ?? data?.correo ?? '',
    password: data?.password ?? data?.contrasena ?? '',
    nombre: data?.nombre ?? '',
  }

  const response = await fetch(`${API_BASE_URL}/administracion/entrenadores`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payloadRequest),
  })

  const payload = await parseJsonResponse(response, 'No se pudo crear el entrenador')
  return payload.data
}

export async function updateEntrenadorAdmin(entrenadorId, data) {
  const response = await fetch(`${API_BASE_URL}/administracion/entrenadores/${entrenadorId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data || {}),
  })

  const payload = await parseJsonResponse(response, 'No se pudo actualizar el entrenador')
  return payload.data
}

export async function resetPasswordTemporalEntrenadorAdmin(entrenadorId, nuevaPassword) {
  const response = await fetch(`${API_BASE_URL}/administracion/entrenadores/${entrenadorId}/password`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nueva_password: nuevaPassword }),
  })

  const payload = await parseJsonResponse(response, 'No se pudo actualizar la contraseña del entrenador')
  return payload.data
}

// --- Atletas (entidad + acciones de asignación) ---
export async function fetchAtletasAdmin({ estado } = {}) {
  const query = estado ? `?estado=${encodeURIComponent(estado)}` : ''
  const response = await fetch(`${API_BASE_URL}/administracion/atletas${query}`)
  const payload = await parseJsonResponse(response, 'No se pudo obtener atletas de administración')
  return payload.data || []
}

export async function autoasignarAtletaAdmin(atletaId, entrenadorId) {
  const response = await fetch(`${API_BASE_URL}/administracion/atletas/${atletaId}/autoasignacion`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ entrenador_id: entrenadorId }),
  })

  const payload = await parseJsonResponse(response, 'No se pudo autoasignar el atleta pendiente')
  return payload.data
}

export async function reasignarAtletaAdmin(atletaId, entrenadorId) {
  const response = await fetch(`${API_BASE_URL}/administracion/atletas/${atletaId}/reasignacion`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ entrenador_id: entrenadorId }),
  })

  const payload = await parseJsonResponse(response, 'No se pudo reasignar el atleta')
  return payload.data
}

export async function updateAtletaAdmin(atletaId, data) {
  const response = await fetch(`${API_BASE_URL}/administracion/atletas/${atletaId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data || {}),
  })

  const payload = await parseJsonResponse(response, 'No se pudo actualizar el atleta')
  return payload.data
}

export async function resetPasswordTemporalAtletaAdmin(atletaId, nuevaPassword) {
  const response = await fetch(`${API_BASE_URL}/administracion/atletas/${atletaId}/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nueva_password: nuevaPassword }),
  })

  const payload = await parseJsonResponse(response, 'No se pudo resetear la contraseña del atleta')
  return payload.data
}
