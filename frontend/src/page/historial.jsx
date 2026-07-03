import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { fetchDetalleFeedback, fetchHistorialAtleta } from '../services/historialApi'
import { formatDate } from '../utils/dateFormat'

function formatKilometros(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '-'
  }

  return `${Number(value)} km`
}

function Historial({ atletaId, onBack, initialFeedbackTarget, onConsumeInitialFeedbackTarget }) {
  const [historialData, setHistorialData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [feedbackExpandidoPorSemana, setFeedbackExpandidoPorSemana] = useState({})
  const [feedbackDetallePorSemana, setFeedbackDetallePorSemana] = useState({})
  const [feedbackLoadingPorSemana, setFeedbackLoadingPorSemana] = useState({})
  const [feedbackErrorPorSemana, setFeedbackErrorPorSemana] = useState({})
  const feedbackRequestSeqPorSemana = useRef({})
  const initialTargetConsumidoRef = useRef('')

  useEffect(() => {
    let isMounted = true

    async function loadHistorial() {
      try {
        setLoading(true)
        setError('')
        const data = await fetchHistorialAtleta(atletaId)
        if (isMounted) {
          setFeedbackExpandidoPorSemana({})
          setFeedbackDetallePorSemana({})
          setFeedbackLoadingPorSemana({})
          setFeedbackErrorPorSemana({})
          setHistorialData(data)
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message || 'Error al cargar historial')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadHistorial()

    return () => {
      isMounted = false
    }
  }, [atletaId])

  const atleta = useMemo(() => historialData?.atleta || null, [historialData])
  const objetivos = useMemo(() => historialData?.objetivos || [], [historialData])
  const feedbackResumen = useMemo(() => historialData?.feedback_resumen || [], [historialData])

  const feedbackPorObjetivoSemana = useMemo(() => {
    const resumenPorSemana = new Map()

    feedbackResumen.forEach((feedback) => {
      const key = `${Number(feedback.objetivo_id)}::${Number(feedback.semana_id)}`
      if (!resumenPorSemana.has(key)) {
        resumenPorSemana.set(key, feedback)
      }
    })

    return resumenPorSemana
  }, [feedbackResumen])

  const objetivosVisuales = useMemo(() => {
    return objetivos.map((objetivo) => {
      const semanas = [...(objetivo.planificacion || [])].map((semana, index) => ({
        ...semana,
        numero: index + 1,
        feedback:
          feedbackPorObjetivoSemana.get(`${Number(objetivo.id)}::${Number(semana.semana_id)}`) || null,
      }))

      const primeraSemana = semanas[0] || null
      const ultimaSemana = semanas[semanas.length - 1] || null
      const kmTotalesRealizados = semanas.reduce(
        (total, semana) => total + Number(semana.kilometros_realizados || 0),
        0
      )
      const kmTotalesPlanificados = semanas.reduce(
        (total, semana) => total + Number(semana.kilometros_planificados || 0),
        0
      )

      return {
        ...objetivo,
        estadoVisual: objetivo.estado === 'finalizado' ? 'Finalizado' : 'Activo',
        fechaInicioVisual: primeraSemana?.fecha_inicio || '-',
        fechaFinVisual: ultimaSemana?.fecha_fin || '-',
        kmTotalesRealizados,
        kmTotalesPlanificados,
        semanas,
      }
    })
  }, [objetivos, feedbackPorObjetivoSemana])

  const openFeedbackDetalle = useCallback(async (semanaId, feedbackId) => {
    const semanaIdNumerico = Number(semanaId)
    const feedbackIdNumerico = Number(feedbackId)

    if (!semanaIdNumerico || Number.isNaN(semanaIdNumerico)) {
      return
    }

    if (!feedbackIdNumerico || Number.isNaN(feedbackIdNumerico)) {
      setFeedbackErrorPorSemana((prev) => ({
        ...prev,
        [semanaIdNumerico]: 'No se encontró el identificador del feedback seleccionado',
      }))
      return
    }

    setFeedbackExpandidoPorSemana((prev) => ({
      ...prev,
      [semanaIdNumerico]: true,
    }))

    if (feedbackDetallePorSemana[semanaIdNumerico]) {
      return
    }

    const requestId = (feedbackRequestSeqPorSemana.current[semanaIdNumerico] || 0) + 1
    feedbackRequestSeqPorSemana.current[semanaIdNumerico] = requestId

    try {
      setFeedbackLoadingPorSemana((prev) => ({
        ...prev,
        [semanaIdNumerico]: true,
      }))
      setFeedbackErrorPorSemana((prev) => ({
        ...prev,
        [semanaIdNumerico]: '',
      }))

      const data = await fetchDetalleFeedback(feedbackIdNumerico)

      if (feedbackRequestSeqPorSemana.current[semanaIdNumerico] !== requestId) {
        return
      }

      if (Number(data?.id) !== feedbackIdNumerico) {
        throw new Error('El detalle recibido no coincide con el feedback solicitado')
      }

      setFeedbackDetallePorSemana((prev) => ({
        ...prev,
        [semanaIdNumerico]: data,
      }))
    } catch (detailError) {
      if (feedbackRequestSeqPorSemana.current[semanaIdNumerico] === requestId) {
        setFeedbackErrorPorSemana((prev) => ({
          ...prev,
          [semanaIdNumerico]: detailError.message || 'Error al cargar el detalle del feedback',
        }))
      }
    } finally {
      if (feedbackRequestSeqPorSemana.current[semanaIdNumerico] === requestId) {
        setFeedbackLoadingPorSemana((prev) => ({
          ...prev,
          [semanaIdNumerico]: false,
        }))
      }
    }
  }, [feedbackDetallePorSemana])

  const openFeedbackDetalleById = useCallback(async (feedbackId) => {
    const feedbackIdNumerico = Number(feedbackId)
    if (!feedbackIdNumerico || Number.isNaN(feedbackIdNumerico)) {
      return
    }

    try {
      const data = await fetchDetalleFeedback(feedbackIdNumerico)
      const semanaIdNumerico = Number(data?.semana_id)

      if (!semanaIdNumerico || Number.isNaN(semanaIdNumerico)) {
        throw new Error('El feedback no incluye una semana válida')
      }

      setFeedbackErrorPorSemana((prev) => ({
        ...prev,
        [semanaIdNumerico]: '',
      }))

      setFeedbackDetallePorSemana((prev) => ({
        ...prev,
        [semanaIdNumerico]: data,
      }))

      setFeedbackExpandidoPorSemana((prev) => ({
        ...prev,
        [semanaIdNumerico]: true,
      }))
    } catch (detailError) {
      setError(detailError.message || 'No se pudo abrir el feedback solicitado')
    }
  }, [])

  async function handleToggleDetalleFeedback(semanaId, feedbackId) {
    const semanaIdNumerico = Number(semanaId)
    if (!semanaIdNumerico || Number.isNaN(semanaIdNumerico)) {
      return
    }

    const estaExpandido = Boolean(feedbackExpandidoPorSemana[semanaIdNumerico])
    if (estaExpandido) {
      setFeedbackExpandidoPorSemana((prev) => ({
        ...prev,
        [semanaIdNumerico]: false,
      }))
      return
    }

    await openFeedbackDetalle(semanaId, feedbackId)
  }

  useEffect(() => {
    const feedbackId = Number(initialFeedbackTarget?.feedbackId)

    if (!feedbackId) {
      return
    }

    const targetKey = `feedback-${feedbackId}`
    if (initialTargetConsumidoRef.current === targetKey) {
      return
    }

    initialTargetConsumidoRef.current = targetKey

    // Flujo directo desde campana: abre por id de feedback y expande su semana automáticamente.
    openFeedbackDetalleById(feedbackId)
      .finally(() => {
        onConsumeInitialFeedbackTarget?.()
      })
  }, [
    initialFeedbackTarget?.feedbackId,
    openFeedbackDetalleById,
    onConsumeInitialFeedbackTarget,
  ])

  return (
    <main className="historial">
      <header className="historial__header">
        <button className="historial__back" type="button" onClick={onBack}>
          Volver al dashboard
        </button>

        <div className="historial__header-copy">
          <p className="historial__eyebrow">Historial del atleta</p>
          <h1 className="historial__title">{atleta?.nombre || 'Atleta'}</h1>
          <p className="historial__subtitle">
            Evolucion deportiva a lo largo de sus objetivos
          </p>
        </div>
      </header>

      {loading && <p>Cargando historial...</p>}
      {error && !loading && <p>{error}</p>}

      {!loading && !error && (
        <section className="historial__content" aria-label="Historial del atleta">
          {objetivosVisuales.length === 0 && <p>Sin objetivos historicos.</p>}

          {objetivosVisuales.map((objetivo) => (
            <article className="historial__objective-card" key={objetivo.id}>
              <header className="historial__objective-header">
                <div>
                  <p className="historial__objective-name">{objetivo.nombre || '-'}</p>
                  <p className="historial__objective-dates">
                    {formatDate(objetivo.fechaInicioVisual)} - {formatDate(objetivo.fechaFinVisual)}
                  </p>
                  {objetivo.marca_conseguida && (
                    <p className="historial__objective-dates">Marca conseguida: {objetivo.marca_conseguida}</p>
                  )}
                </div>

                <div className="historial__objective-meta">
                  <span className={`historial__status historial__status--${objetivo.estadoVisual.toLowerCase()}`}>
                    {objetivo.estadoVisual}
                  </span>
                  <span className="historial__km-total">
                    {formatKilometros(objetivo.kmTotalesRealizados)} / {formatKilometros(objetivo.kmTotalesPlanificados)}
                  </span>
                </div>
              </header>

              <div className="historial__weeks">
                {objetivo.semanas.length === 0 && <p>Sin semanas registradas para este objetivo.</p>}

                {objetivo.semanas.map((semana) => (
                  <div className="historial__week" key={semana.semana_id}>
                    <p className="historial__week-line">
                      Semana {semana.numero} · {formatDate(semana.fecha_inicio)} - {formatDate(semana.fecha_fin)} · {formatKilometros(semana.kilometros_realizados)} / {formatKilometros(semana.kilometros_planificados)}
                    </p>

                    {(() => {
                      const semanaId = Number(semana.semana_id)
                      const estaExpandido = Boolean(feedbackExpandidoPorSemana[semanaId])
                      const detalle = feedbackDetallePorSemana[semanaId]
                      const cargando = Boolean(feedbackLoadingPorSemana[semanaId])
                      const errorDetalle = feedbackErrorPorSemana[semanaId]

                      return (
                        <>
                          <div className="historial__feedback-row">
                            <span className="historial__feedback-label">Feedback</span>
                            {semana.feedback?.feedback_id ? (
                              <button
                                className="historial__feedback-button"
                                type="button"
                                onClick={() => handleToggleDetalleFeedback(semana.semana_id, semana.feedback?.feedback_id)}
                              >
                                {cargando ? 'Cargando...' : estaExpandido ? 'Ocultar detalle' : 'Ver detalle'}
                              </button>
                            ) : (
                              <span className="historial__feedback-empty">Sin feedback</span>
                            )}
                          </div>

                          {estaExpandido && (
                            <div className="historial__week-detail" aria-label={`Detalle feedback semana ${semana.numero}`}>
                              {cargando && <p>Cargando detalle...</p>}
                              {!cargando && errorDetalle && <p>{errorDetalle}</p>}

                              {!cargando && !errorDetalle && detalle && (
                                <div className="historial__detail-body">
                                  <div className="historial__detail-summary">
                                    <span className={`historial__status historial__status--${detalle.completada ? 'activo' : 'finalizado'}`}>
                                      {detalle.completada ? 'Completada' : 'No completada'}
                                    </span>
                                    <p className="historial__detail-week">
                                      Semana {detalle.semana_id} · {formatDate(detalle.semana_fecha_inicio)} - {formatDate(detalle.semana_fecha_fin)}
                                    </p>
                                    {!detalle.completada && detalle.motivo_no_completada && (
                                      <p className="historial__detail-reason">
                                        Por qué no se completó: {detalle.motivo_no_completada}
                                      </p>
                                    )}
                                  </div>

                                  <dl className="historial__detail-grid">
                                    <div>
                                      <dt>Fecha</dt>
                                      <dd>{formatDate(detalle.fecha_feedback || detalle.created_at)}</dd>
                                    </div>
                                    <div>
                                      <dt>Completada</dt>
                                      <dd>{detalle.completada ? 'Sí' : 'No'}</dd>
                                    </div>
                                    {!detalle.completada && (
                                      <div className="historial__detail-fullwidth">
                                        <dt>Motivo de no completada</dt>
                                        <dd>{detalle.motivo_no_completada || '-'}</dd>
                                      </div>
                                    )}
                                    <div>
                                      <dt>Sensaciones</dt>
                                      <dd>{detalle.sensaciones || '-'}</dd>
                                    </div>
                                    <div>
                                      <dt>Ritmo medio</dt>
                                      <dd>{detalle.ritmo_medio || detalle.ritmo_rodaje || '-'}</dd>
                                    </div>
                                    <div>
                                      <dt>Molestias</dt>
                                      <dd>{detalle.molestias || '-'}</dd>
                                    </div>
                                  </dl>
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )
                    })()}
                  </div>
                ))}
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  )
}

export default Historial
