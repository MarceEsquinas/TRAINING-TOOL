import { useEffect, useMemo, useState } from 'react'
import { fetchDetalleFeedback } from '../services/historialApi'
import { formatDate } from '../utils/dateFormat'

function FeedbackDetalle({ feedbackId, onBack, onOpenHistorial }) {
  const [detalle, setDetalle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadDetalle() {
      try {
        setLoading(true)
        setError('')
        const data = await fetchDetalleFeedback(feedbackId)
        if (isMounted) {
          setDetalle(data)
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message || 'No se pudo cargar el detalle del feedback')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    // Al entrar desde campana, abrimos el feedback exacto por id.
    loadDetalle()

    return () => {
      isMounted = false
    }
  }, [feedbackId])

  const estadoFeedback = useMemo(() => {
    if (!detalle) {
      return 'finalizado'
    }

    return detalle.completada ? 'activo' : 'finalizado'
  }, [detalle])

  return (
    <main className="historial">
      <header className="historial__header">
        <button className="historial__back" type="button" onClick={onBack}>
          Volver al dashboard
        </button>

        <div className="historial__header-copy">
          <p className="historial__eyebrow">Detalle de feedback</p>
          <h1 className="historial__title">Feedback #{feedbackId}</h1>
          <p className="historial__subtitle">Vista directa desde notificaciones</p>
        </div>
      </header>

      {loading && <p>Cargando detalle...</p>}
      {error && !loading && <p>{error}</p>}

      {!loading && !error && detalle && (
        <section className="historial__content" aria-label="Detalle completo del feedback">
          <article className="historial__objective-card">
            <header className="historial__objective-header">
              <div>
                <p className="historial__objective-name">{detalle.atleta_nombre || 'Atleta'}</p>
                <p className="historial__objective-dates">{detalle.objetivo_nombre || '-'}</p>
              </div>

              <div className="historial__objective-meta">
                <span className={`historial__status historial__status--${estadoFeedback}`}>
                  {detalle.completada ? 'Completada' : 'No completada'}
                </span>
                <span className="historial__km-total">
                  Semana {detalle.semana_id} · {formatDate(detalle.semana_fecha_inicio)} - {formatDate(detalle.semana_fecha_fin)}
                </span>
              </div>
            </header>

            <div className="historial__detail-body">
              {!detalle.completada && detalle.motivo_no_completada && (
                <div className="historial__detail-summary">
                  <p className="historial__detail-reason">
                    Por qué no se completó: {detalle.motivo_no_completada}
                  </p>
                </div>
              )}

              <dl className="historial__detail-grid">
                <div>
                  <dt>Fecha</dt>
                  <dd>{formatDate(detalle.fecha_feedback || detalle.created_at)}</dd>
                </div>
                <div>
                  <dt>Completada</dt>
                  <dd>{detalle.completada ? 'Sí' : 'No'}</dd>
                </div>
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

            <div className="planificacion__actions planificacion__actions--top">
              <button className="plan-button" type="button" onClick={onOpenHistorial}>
                Ver historial del atleta
              </button>
            </div>
          </article>
        </section>
      )}
    </main>
  )
}

export default FeedbackDetalle