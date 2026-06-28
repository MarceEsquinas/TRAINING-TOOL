import { useEffect, useMemo, useState } from 'react'
import { fetchPlanificacion } from '../services/planificacionApi'
import { formatDate } from '../utils/dateFormat'

function Planificacion({ atletaId, onBack }) {
  // Estado de pantalla: datos, carga en curso y error de red/backend.
  const [planificacionData, setPlanificacionData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Carga inicial de la planificación para el atleta seleccionado.
  useEffect(() => {
    let isMounted = true

    async function loadData() {
      try {
        setLoading(true)
        setError('')
        const data = await fetchPlanificacion(atletaId)
        if (isMounted) {
          setPlanificacionData(data)
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message || 'Error al cargar la planificación')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadData()

    return () => {
      isMounted = false
    }
  }, [atletaId])

  // Extrae nodos del caso de uso para simplificar el JSX y mantenerlo legible.
  const atleta = useMemo(() => planificacionData?.atleta || null, [planificacionData])
  const objetivo = useMemo(() => planificacionData?.objetivo || null, [planificacionData])
  const semana = useMemo(() => planificacionData?.semana || null, [planificacionData])
  const sesiones = useMemo(() => planificacionData?.sesiones || [], [planificacionData])

  return (
    <main className="planificacion">
      <header className="planificacion__header">
        <button className="planificacion__back" type="button" onClick={onBack}>
          ← Volver al dashboard
        </button>
        <h2>Planificación del atleta</h2>
        <p>¿Qué necesito saber para planificar el entrenamiento de este atleta?</p>
      </header>

      {/* Estados de experiencia: primero carga y luego error si existe. */}
      {loading && <p>Cargando planificación...</p>}
      {error && !loading && <p>{error}</p>}

      {!loading && !error && (
        <section className="planificacion__content" aria-label="Contexto de planificación">
          <article className="planificacion__card">
            <h3>Contexto actual</h3>
            <div className="planificacion__grid">
              <div>
                <span className="field-label">Atleta</span>
                <strong>{atleta?.nombre || '-'}</strong>
              </div>
              <div>
                <span className="field-label">Objetivo</span>
                <strong>{objetivo?.nombre || 'Sin objetivo activo'}</strong>
              </div>
              <div>
                <span className="field-label">Fecha objetivo</span>
                <strong>{formatDate(objetivo?.fecha_objetivo)}</strong>
              </div>
              <div>
                <span className="field-label">Días restantes</span>
                <strong>{objetivo?.dias_hasta_objetivo ?? '-'}</strong>
              </div>
            </div>
          </article>

          <article className="planificacion__card">
            <h3>Semana seleccionada</h3>
            {!semana && <p>No hay semana actual ni próxima para este atleta.</p>}
            {semana && (
              <div className="planificacion__grid">
                <div>
                  <span className="field-label">Inicio</span>
                  <strong>{formatDate(semana.fecha_inicio)}</strong>
                </div>
                <div>
                  <span className="field-label">Fin</span>
                  <strong>{formatDate(semana.fecha_fin)}</strong>
                </div>
                <div>
                  <span className="field-label">Kilómetros semanales</span>
                  <strong>
                    {semana.km_realizados_semana} / {semana.km_planificados_semana} km
                  </strong>
                </div>
                <div>
                  <span className="field-label">Total sesiones</span>
                  <strong>{semana.total_sesiones}</strong>
                </div>
              </div>
            )}
          </article>

          <article className="planificacion__card">
            <div className="planificacion__sessions-head">
              <h3>Sesiones de la semana</h3>
            </div>

            {sesiones.length === 0 && <p>Esta semana todavía no tiene sesiones planificadas.</p>}

            {sesiones.length > 0 && (
              <ul className="planificacion__sessions-list">
                {sesiones.map((sesion) => (
                  <li key={sesion.id} className="planificacion__session-item">
                    <div>
                      <span className="field-label">Orden</span>
                      <strong>{sesion.orden || '-'}</strong>
                    </div>
                    <div>
                      <span className="field-label">Descripción</span>
                      <strong>{sesion.descripcion || '-'}</strong>
                    </div>
                    <div>
                      <span className="field-label">Km planificados</span>
                      <strong>{sesion.kilometros_planificados ?? '-'}</strong>
                    </div>
                    <div>
                      <span className="field-label">Km realizados</span>
                      <strong>{sesion.kilometros_realizados ?? '-'}</strong>
                    </div>
                    <div>
                      <span className="field-label">Estado</span>
                      <strong>{sesion.realizada ? 'Realizada' : 'Pendiente'}</strong>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </section>
      )}
    </main>
  )
}

export default Planificacion
