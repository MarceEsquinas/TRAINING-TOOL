import { useEffect, useMemo, useState } from 'react'
import {
  fetchPlanificacion,
  fetchPropuestaNuevaSemana,
  createSemanaPlanificacion,
} from '../services/planificacionApi'
import { formatDate } from '../utils/dateFormat'

function addDaysToIsoDate(isoDate, days) {
  if (!isoDate) return ''
  const date = new Date(`${isoDate}T00:00:00.000Z`)
  if (Number.isNaN(date.getTime())) return ''
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function Planificacion({ atletaId, onBack }) {
  // Estado de pantalla: datos, carga en curso y error de red/backend.
  const [planificacionData, setPlanificacionData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [createFlowOpen, setCreateFlowOpen] = useState(false)
  const [creatingWeek, setCreatingWeek] = useState(false)
  const [propuestaLoading, setPropuestaLoading] = useState(false)
  const [propuestaError, setPropuestaError] = useState('')
  const [createError, setCreateError] = useState('')
  const [createSuccess, setCreateSuccess] = useState('')
  const [fechaInicioInput, setFechaInicioInput] = useState('')
  const [fechaFinPreview, setFechaFinPreview] = useState('')
  const [propuestaFuente, setPropuestaFuente] = useState('')

  async function loadPlanificacion() {
    setLoading(true)
    setError('')
    try {
      const data = await fetchPlanificacion(atletaId)
      setPlanificacionData(data)
    } catch (loadError) {
      setError(loadError.message || 'Error al cargar la planificación')
    } finally {
      setLoading(false)
    }
  }

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

  async function handleOpenCreateWeek() {
    try {
      setCreateFlowOpen(true)
      setPropuestaLoading(true)
      setPropuestaError('')
      setCreateError('')
      setCreateSuccess('')

      const propuestaData = await fetchPropuestaNuevaSemana(atletaId)
      const fechaInicio = propuestaData?.propuesta?.fecha_inicio_sugerida || ''
      const fechaFin = propuestaData?.propuesta?.fecha_fin_calculada || addDaysToIsoDate(fechaInicio, 6)

      setFechaInicioInput(fechaInicio)
      setFechaFinPreview(fechaFin)
      setPropuestaFuente(propuestaData?.propuesta?.fuente_sugerencia || '')
    } catch (proposalError) {
      setPropuestaError(proposalError.message || 'No se pudo cargar la propuesta de semana')
    } finally {
      setPropuestaLoading(false)
    }
  }

  function handleFechaInicioChange(event) {
    const newStartDate = event.target.value
    setFechaInicioInput(newStartDate)
    setFechaFinPreview(addDaysToIsoDate(newStartDate, 6))
    setCreateError('')
    setCreateSuccess('')
  }

  function handleCancelCreateWeek() {
    setCreateFlowOpen(false)
    setPropuestaError('')
    setCreateError('')
    setCreateSuccess('')
    setFechaInicioInput('')
    setFechaFinPreview('')
    setPropuestaFuente('')
  }

  async function handleConfirmCreateWeek() {
    if (!fechaInicioInput) {
      setCreateError('Debes seleccionar una fecha de inicio')
      return
    }

    try {
      setCreatingWeek(true)
      setCreateError('')
      setCreateSuccess('')
      await createSemanaPlanificacion(atletaId, fechaInicioInput)
      setCreateSuccess('Semana creada correctamente')
      await loadPlanificacion()
    } catch (createWeekError) {
      setCreateError(createWeekError.message || 'No se pudo crear la semana')
    } finally {
      setCreatingWeek(false)
    }
  }

  const fuenteSugerenciaLabel = useMemo(() => {
    if (propuestaFuente === 'dia_siguiente_ultima_semana') {
      return 'Sugerencia basada en la última semana creada'
    }
    if (propuestaFuente === 'fecha_actual') {
      return 'Sugerencia basada en la fecha actual'
    }
    return ''
  }, [propuestaFuente])

  return (
    <main className="planificacion">
      <header className="planificacion__header">
        <button className="planificacion__back" type="button" onClick={onBack}>
          ← Volver al dashboard
        </button>
        <h2>Planificación del atleta</h2>
        <p>¿Qué necesito saber para planificar el entrenamiento de este atleta?</p>
        {!loading && !error && (
          <div className="planificacion__actions planificacion__actions--top">
            <button
              className="planificacion__back"
              type="button"
              onClick={handleOpenCreateWeek}
              disabled={propuestaLoading || creatingWeek}
            >
              {propuestaLoading ? 'Preparando semana...' : 'Crear semana'}
            </button>
          </div>
        )}
      </header>

      {/* Estados de experiencia: primero carga y luego error si existe. */}
      {loading && <p>Cargando planificación...</p>}
      {error && !loading && <p>{error}</p>}

      {!loading && !error && (
        <section className="planificacion__content" aria-label="Contexto de planificación">
          {createFlowOpen && (
            <article className="planificacion__card">
              <h3>Nueva semana de entrenamiento</h3>

              {propuestaLoading && <p>Cargando propuesta...</p>}

              {!propuestaLoading && propuestaError && <p>{propuestaError}</p>}

              {!propuestaLoading && !propuestaError && (
                <>
                  {fuenteSugerenciaLabel && (
                    <p className="planificacion__hint">{fuenteSugerenciaLabel}</p>
                  )}

                  <div className="planificacion__grid">
                    <label className="planificacion__field" htmlFor="fecha-inicio-semana">
                      <span className="field-label">Fecha inicio</span>
                      <input
                        id="fecha-inicio-semana"
                        type="date"
                        value={fechaInicioInput}
                        onChange={handleFechaInicioChange}
                      />
                    </label>
                    <div>
                      <span className="field-label">Fecha fin calculada</span>
                      <strong>{formatDate(fechaFinPreview)}</strong>
                    </div>
                  </div>

                  {createError && <p>{createError}</p>}
                  {createSuccess && <p className="planificacion__success">{createSuccess}</p>}

                  <div className="planificacion__actions">
                    <button
                      className="planificacion__back"
                      type="button"
                      onClick={handleConfirmCreateWeek}
                      disabled={creatingWeek || propuestaLoading}
                    >
                      {creatingWeek ? 'Creando semana...' : 'Confirmar creación'}
                    </button>
                    <button
                      className="planificacion__back"
                      type="button"
                      onClick={handleCancelCreateWeek}
                      disabled={creatingWeek}
                    >
                      Cancelar
                    </button>
                  </div>
                </>
              )}
            </article>
          )}

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
