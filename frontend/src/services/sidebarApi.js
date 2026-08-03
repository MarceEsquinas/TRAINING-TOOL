import { API_BASE_URL } from './apiBaseUrl'

async function fetchJson(path, notFoundMessage, fallbackMessage) {
  const response = await fetch(`${API_BASE_URL}${path}`)

  if (!response.ok) {
    if (response.status === 404 && notFoundMessage) {
      throw new Error(notFoundMessage)
    }

    throw new Error(fallbackMessage)
  }

  const payload = await response.json()

  if (!payload.success) {
    throw new Error(payload.message || fallbackMessage)
  }

  return payload
}

export async function fetchSidebarAtletas() {
  const payload = await fetchJson(
    '/atletas',
    '',
    'No se pudo obtener la lista de atletas'
  )

  if (!Array.isArray(payload.data)) {
    throw new Error('La respuesta de atletas no tiene un formato valido')
  }

  return payload.data
}

export async function fetchSidebarHistorialAtleta(atletaId) {
  if (!atletaId) {
    throw new Error('Se requiere atletaId para abrir el historial del sidebar')
  }

  const payload = await fetchJson(
    `/historial/atletas/${atletaId}`,
    'No se encontro el atleta solicitado',
    'No se pudo obtener el historial del atleta'
  )

  if (!payload.data) {
    throw new Error('La respuesta de historial no contiene datos validos')
  }

  const feedbackPorObjetivoSemana = new Map()

  for (const feedback of payload.data.feedback_resumen || []) {
    const key = `${Number(feedback.objetivo_id)}::${Number(feedback.semana_id)}`

    if (!feedbackPorObjetivoSemana.has(key)) {
      feedbackPorObjetivoSemana.set(key, feedback)
    }
  }

  return {
    ...payload.data,
    objetivos: (payload.data.objetivos || []).map((objetivo) => ({
      ...objetivo,
      planificacion: (objetivo.planificacion || []).map((semana) => ({
        ...semana,
        feedback:
          feedbackPorObjetivoSemana.get(
            `${Number(objetivo.id)}::${Number(semana.semana_id)}`
          ) || null,
      })),
    })),
  }
}

export async function fetchSidebarSesionesSemana(semanaId) {
  if (!semanaId) {
    throw new Error('Se requiere semanaId para consultar las sesiones')
  }

  const payload = await fetchJson(
    `/semanasEntrenamiento/${semanaId}/sesiones`,
    'No se encontro la semana solicitada',
    'No se pudieron obtener las sesiones de entrenamiento'
  )

  if (!Array.isArray(payload.data)) {
    throw new Error('La respuesta de sesiones no tiene un formato valido')
  }

  return payload.data
}