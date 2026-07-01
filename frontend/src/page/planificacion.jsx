import { useEffect, useMemo, useState } from 'react'
import {
  fetchPlanificacion,
  fetchPropuestaNuevaSemana,
  createSemanaPlanificacion,
  createSesionPlanificacion,
  registrarResultadoSesionPlanificacion,
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
  const [createSesionOpen, setCreateSesionOpen] = useState(false)
  const [creatingSesion, setCreatingSesion] = useState(false)
  const [sesionDescripcion, setSesionDescripcion] = useState('')
  const [sesionObservaciones, setSesionObservaciones] = useState('')
  const [sesionKmPlanificados, setSesionKmPlanificados] = useState('')
  const [sesionError, setSesionError] = useState('')
  const [sesionSuccess, setSesionSuccess] = useState('')
  const [resultadosEdicion, setResultadosEdicion] = useState({})
  const [savingResultadoId, setSavingResultadoId] = useState(null)
  const [resultadoError, setResultadoError] = useState('')
  const [resultadoSuccess, setResultadoSuccess] = useState('')

  async function loadPlanificacion() {
    setLoading(true)
    setError('')
    try {
      const data = await fetchPlanificacion(atletaId)
      setPlanificacionData(data)
      setResultadosEdicion({})
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
          setResultadosEdicion({})
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

  function resetSesionForm() {
    setSesionDescripcion('')
    setSesionObservaciones('')
    setSesionKmPlanificados('')
  }

  function handleOpenCreateSesion() {
    setCreateSesionOpen(true)
    setSesionError('')
    setSesionSuccess('')
  }

  function handleCancelCreateSesion() {
    setCreateSesionOpen(false)
    setSesionError('')
    setSesionSuccess('')
    resetSesionForm()
  }

  async function handleCreateSesion() {
    if (!semana?.id) {
      setSesionError('Debes seleccionar una semana antes de crear una sesión')
      return
    }

    if (!sesionDescripcion.trim()) {
      setSesionError('La descripción es obligatoria')
      return
    }

    if (sesionKmPlanificados === '' || Number.isNaN(Number(sesionKmPlanificados)) || Number(sesionKmPlanificados) < 0) {
      setSesionError('Los kilómetros planificados deben ser un número mayor o igual a 0')
      return
    }

    try {
      setCreatingSesion(true)
      setSesionError('')
      setSesionSuccess('')

      const data = await createSesionPlanificacion(atletaId, semana.id, {
        descripcion: sesionDescripcion.trim(),
        observaciones: sesionObservaciones.trim(),
        kilometros_planificados: Number(sesionKmPlanificados),
      })

      setSesionSuccess(`Sesión ${data?.sesion?.orden || ''} creada correctamente`)
      resetSesionForm()
      await loadPlanificacion()
    } catch (createSesionError) {
      setSesionError(createSesionError.message || 'No se pudo crear la sesión')
    } finally {
      setCreatingSesion(false)
    }
  }

  function getResultadoStateForSesion(sesion) {
    const stored = resultadosEdicion[sesion.id]
    if (stored) {
      return stored
    }

    const kmPlan = sesion.kilometros_planificados
    const kmReal = sesion.kilometros_realizados
    const marcadoSegunPlan = kmReal !== null && kmPlan !== null && Number(kmReal) === Number(kmPlan)

    return {
      realizadoSegunPlan: marcadoSegunPlan,
      kmRealizadosInput: kmReal !== null ? String(kmReal) : '',
    }
  }

  function handleResultadoCheckboxChange(sesionId, checked) {
    setResultadoError('')
    setResultadoSuccess('')
    setResultadosEdicion((prev) => {
      const current = prev[sesionId] || { realizadoSegunPlan: false, kmRealizadosInput: '' }
      return {
        ...prev,
        [sesionId]: {
          ...current,
          realizadoSegunPlan: checked,
        },
      }
    })
  }

  function handleKmRealizadosChange(sesionId, value) {
    setResultadoError('')
    setResultadoSuccess('')
    setResultadosEdicion((prev) => {
      const current = prev[sesionId] || { realizadoSegunPlan: false, kmRealizadosInput: '' }
      return {
        ...prev,
        [sesionId]: {
          ...current,
          kmRealizadosInput: value,
        },
      }
    })
  }

  async function handleGuardarResultadoSesion(sesion) {
    if (!semana?.id) {
      setResultadoError('Debes seleccionar una semana válida')
      return
    }

    const state = getResultadoStateForSesion(sesion)
    const { realizadoSegunPlan, kmRealizadosInput } = state

    if (!realizadoSegunPlan && kmRealizadosInput !== '' && (Number.isNaN(Number(kmRealizadosInput)) || Number(kmRealizadosInput) < 0)) {
      setResultadoError('Los kilómetros realizados deben ser un número mayor o igual a 0')
      return
    }

    const payload = {
      realizado_segun_planificacion: realizadoSegunPlan,
    }

    if (!realizadoSegunPlan && kmRealizadosInput !== '') {
      payload.kilometros_realizados = Number(kmRealizadosInput)
    }

    try {
      setSavingResultadoId(sesion.id)
      setResultadoError('')
      setResultadoSuccess('')
      await registrarResultadoSesionPlanificacion(atletaId, semana.id, sesion.id, payload)
      setResultadoSuccess(`Resultado de sesión ${sesion.orden || sesion.id} guardado`)
      await loadPlanificacion()
    } catch (saveError) {
      setResultadoError(saveError.message || 'No se pudo guardar el resultado de la sesión')
    } finally {
      setSavingResultadoId(null)
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
              <button
                className="planificacion__back"
                type="button"
                onClick={handleOpenCreateSesion}
                disabled={!semana || creatingSesion}
              >
                Crear sesión
              </button>
            </div>

            {createSesionOpen && (
              <div className="planificacion__session-create">
                <div className="planificacion__session-form-grid">
                  <label className="planificacion__field" htmlFor="sesion-descripcion">
                    <span className="field-label">Descripción</span>
                    <input
                      id="sesion-descripcion"
                      type="text"
                      value={sesionDescripcion}
                      onChange={(event) => setSesionDescripcion(event.target.value)}
                      placeholder="Rodaje suave"
                    />
                  </label>

                  <label className="planificacion__field" htmlFor="sesion-observaciones">
                    <span className="field-label">Observaciones</span>
                    <textarea
                      id="sesion-observaciones"
                      value={sesionObservaciones}
                      onChange={(event) => setSesionObservaciones(event.target.value)}
                      placeholder="No superar zona 2"
                      rows={3}
                    />
                  </label>

                  <label className="planificacion__field" htmlFor="sesion-km-planificados">
                    <span className="field-label">Km planificados</span>
                    <input
                      id="sesion-km-planificados"
                      type="number"
                      min="0"
                      step="0.1"
                      value={sesionKmPlanificados}
                      onChange={(event) => setSesionKmPlanificados(event.target.value)}
                    />
                  </label>
                </div>

                {sesionError && <p>{sesionError}</p>}
                {sesionSuccess && <p className="planificacion__success">{sesionSuccess}</p>}

                <div className="planificacion__actions">
                  <button
                    className="planificacion__back"
                    type="button"
                    onClick={handleCreateSesion}
                    disabled={creatingSesion || !semana}
                  >
                    {creatingSesion ? 'Creando sesión...' : 'Guardar sesión'}
                  </button>
                  <button
                    className="planificacion__back"
                    type="button"
                    onClick={handleCancelCreateSesion}
                    disabled={creatingSesion}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {sesiones.length === 0 && <p>Esta semana todavía no tiene sesiones planificadas.</p>}

            {sesiones.length > 0 && (
              <ul className="planificacion__sessions-list" role="list">
                <li className="planificacion__session-item planificacion__session-item--header" aria-hidden="true">
                  <span>Orden</span>
                  <span>Descripción</span>
                  <span>Observaciones</span>
                  <span>Km planificados</span>
                  <span>Realizado según planificación</span>
                  <span>Km realizados</span>
                  <span>Acción</span>
                </li>
                {sesiones.map((sesion) => (
                  <li key={sesion.id} className="planificacion__session-item">
                    <strong>{sesion.orden || '-'}</strong>
                    <span>{sesion.descripcion || '-'}</span>
                    <span>{sesion.observaciones || '-'}</span>
                    <span>{sesion.kilometros_planificados ?? '-'} km</span>
                    <label className="planificacion__row-checkbox" htmlFor={`sesion-check-${sesion.id}`}>
                      <input
                        id={`sesion-check-${sesion.id}`}
                        type="checkbox"
                        checked={getResultadoStateForSesion(sesion).realizadoSegunPlan}
                        onChange={(event) => handleResultadoCheckboxChange(sesion.id, event.target.checked)}
                        disabled={savingResultadoId === sesion.id}
                      />
                      <span>☑</span>
                    </label>
                    <input
                      className="planificacion__row-input"
                      type="number"
                      min="0"
                      step="0.1"
                      value={getResultadoStateForSesion(sesion).kmRealizadosInput}
                      onChange={(event) => handleKmRealizadosChange(sesion.id, event.target.value)}
                      disabled={getResultadoStateForSesion(sesion).realizadoSegunPlan || savingResultadoId === sesion.id}
                      placeholder={getResultadoStateForSesion(sesion).realizadoSegunPlan ? 'Automático' : 'Manual'}
                    />
                    <button
                      className="planificacion__back"
                      type="button"
                      onClick={() => handleGuardarResultadoSesion(sesion)}
                      disabled={savingResultadoId === sesion.id}
                    >
                      {savingResultadoId === sesion.id ? 'Guardando...' : 'Guardar'}
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {resultadoError && <p>{resultadoError}</p>}
            {resultadoSuccess && <p className="planificacion__success">{resultadoSuccess}</p>}
          </article>
        </section>
      )}
    </main>
  )
}

export default Planificacion
