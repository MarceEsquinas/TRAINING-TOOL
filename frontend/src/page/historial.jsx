import { useEffect, useMemo, useState } from 'react'
import { fetchDetalleFeedback, fetchHistorialAtleta } from '../services/historialApi'
import { formatDate } from '../utils/dateFormat'

function formatKilometros(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '-'
  }

  return `${Number(value)} km`
}

function Historial({ atletaId, onBack }) {
  const [historialData, setHistorialData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [feedbackDetalle, setFeedbackDetalle] = useState(null)
  const [feedbackDetalleLoading, setFeedbackDetalleLoading] = useState(false)
  const [feedbackDetalleError, setFeedbackDetalleError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadHistorial() {
      try {
        setLoading(true)
        setError('')
        const data = await fetchHistorialAtleta(atletaId)
        if (isMounted) {
          setFeedbackDetalle(null)
          setFeedbackDetalleError('')
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

  const feedbackPorSemana = useMemo(() => {
    const resumenPorSemana = new Map()

    feedbackResumen.forEach((feedback) => {
      if (!resumenPorSemana.has(feedback.semana_id)) {
        resumenPorSemana.set(feedback.semana_id, feedback)
      }
    })

    return resumenPorSemana
  }, [feedbackResumen])

  const objetivosVisuales = useMemo(() => {
    return objetivos.map((objetivo) => {
      const semanas = [...(objetivo.planificacion || [])].map((semana, index) => ({
        ...semana,
        numero: index + 1,
        feedback: feedbackPorSemana.get(semana.semana_id) || null,
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
  }, [objetivos, feedbackPorSemana])

  async function handleOpenDetalleFeedback(feedbackId) {
    try {
      setFeedbackDetalleLoading(true)
      setFeedbackDetalleError('')
      const data = await fetchDetalleFeedback(feedbackId)
      setFeedbackDetalle(data)
    } catch (detailError) {
      setFeedbackDetalleError(detailError.message || 'Error al cargar el detalle del feedback')
    } finally {
      setFeedbackDetalleLoading(false)
    }
  }

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

                    <div className="historial__feedback-row">
                      <span className="historial__feedback-label">Feedback</span>
                      <button
                        className="historial__feedback-button"
                        type="button"
                        onClick={() => handleOpenDetalleFeedback(semana.feedback?.feedback_id)}
                        disabled={!semana.feedback?.feedback_id}
                      >
                        Ver detalle
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))}

          {feedbackDetalle && (
            <aside className="historial__detail-card" aria-label="Detalle del feedback">
              <div className="historial__detail-head">
                <div>
                  <p className="historial__eyebrow">Feedback seleccionado</p>
                  <h2 className="historial__detail-title">
                    {feedbackDetalle.objetivo_nombre || 'Detalle del feedback'}
                  </h2>
                </div>

                <button
                  className="historial__detail-close"
                  type="button"
                  onClick={() => setFeedbackDetalle(null)}
                >
                  Cerrar
                </button>
              </div>

              {feedbackDetalleLoading && <p>Cargando detalle...</p>}
              {feedbackDetalleError && !feedbackDetalleLoading && <p>{feedbackDetalleError}</p>}
              {!feedbackDetalleLoading && !feedbackDetalleError && (
                <div className="historial__detail-body">
                  <div className="historial__detail-summary">
                    <span className={`historial__status historial__status--${feedbackDetalle.completada ? 'activo' : 'finalizado'}`}>
                      {feedbackDetalle.completada ? 'Completada' : 'No completada'}
                    </span>
                    <p className="historial__detail-week">
                      Semana {feedbackDetalle.semana_id} · {formatDate(feedbackDetalle.semana_fecha_inicio)} - {formatDate(feedbackDetalle.semana_fecha_fin)}
                    </p>
                    <p className="historial__detail-meta">
                      {feedbackDetalle.objetivo_nombre || '-'} · {feedbackDetalle.atleta_nombre || atleta?.nombre || '-'}
                    </p>
                    {!feedbackDetalle.completada && feedbackDetalle.motivo_no_completada && (
                      <p className="historial__detail-reason">
                        Por qué no se completó: {feedbackDetalle.motivo_no_completada}
                      </p>
                    )}
                  </div>

                  <dl className="historial__detail-grid">
                    <div>
                      <dt>Fecha</dt>
                      <dd>{formatDate(feedbackDetalle.fecha_feedback || feedbackDetalle.created_at)}</dd>
                    </div>
                    <div>
                      <dt>Sensaciones</dt>
                      <dd>{feedbackDetalle.sensaciones || '-'}</dd>
                    </div>
                    <div>
                      <dt>Molestias</dt>
                      <dd>{feedbackDetalle.molestias || '-'}</dd>
                    </div>
                    <div>
                      <dt>Ritmo medio</dt>
                      <dd>{feedbackDetalle.ritmo_rodaje || '-'}</dd>
                    </div>
                    <div className="historial__detail-fullwidth">
                      <dt>Comentario</dt>
                      <dd>{feedbackDetalle.comentario || '-'}</dd>
                    </div>
                  </dl>
                </div>
              )}
            </aside>
          )}
        </section>
      )}
    </main>
  )
}

export default Historial
