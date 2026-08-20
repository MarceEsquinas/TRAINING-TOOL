import { useEffect, useMemo, useState } from 'react'
import {
  fetchPlanificacion,
  fetchSemanasObjetivo,
  fetchSesionesDeSemana,
  fetchPropuestaNuevaSemana,
  createSemanaPlanificacion,
  createSesionPlanificacion,
  registrarResultadoSesionPlanificacion,
  registrarMarcaObjetivoPlanificacion,
} from '../services/planificacionApi'
import { formatDate } from '../utils/dateFormat'

function addDaysToIsoDate(isoDate, days) {
  if (!isoDate) return ''
  const date = new Date(`${isoDate}T00:00:00.000Z`)
  if (Number.isNaN(date.getTime())) return ''
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

// Etiquetas legibles para los días de la semana guardados en atleta.dias_disponibles.
const ETIQUETA_DIA_SEMANA = {
  lunes: 'Lunes',
  martes: 'Martes',
  miercoles: 'Miércoles',
  jueves: 'Jueves',
  viernes: 'Viernes',
  sabado: 'Sábado',
  domingo: 'Domingo',
}

function formatDiasDisponibles(diasDisponibles) {
  if (!Array.isArray(diasDisponibles) || diasDisponibles.length === 0) {
    return 'Sin días configurados'
  }

  return diasDisponibles
    .map((dia) => ETIQUETA_DIA_SEMANA[String(dia).toLowerCase()] || dia)
    .join(', ')
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
  const [marcaConseguidaInput, setMarcaConseguidaInput] = useState('')
  const [marcaError, setMarcaError] = useState('')
  const [marcaSuccess, setMarcaSuccess] = useState('')
  const [registrandoMarca, setRegistrandoMarca] = useState(false)
  const [marcaRegistradaPendienteConfirmacion, setMarcaRegistradaPendienteConfirmacion] = useState(false)
  const [marcaFinalizadaInfo, setMarcaFinalizadaInfo] = useState('')

  // Listado de semanas del objetivo activo (actual, próxima y anteriores) para la sección
  // 'Semanas de entrenamiento'. Es independiente del estado de carga principal porque
  // se refresca de forma puntual tras crear semanas/sesiones o registrar resultados.
  const [semanasObjetivo, setSemanasObjetivo] = useState([])
  const [semanasError, setSemanasError] = useState('')

  // null = se está viendo la semana de contexto (actual o próxima) resuelta por el backend.
  // Con un id distinto, se está consultando el historial de otra semana del objetivo.
  const [semanaSeleccionadaId, setSemanaSeleccionadaId] = useState(null)
  const [sesionesSemanaSeleccionada, setSesionesSemanaSeleccionada] = useState([])
  const [cargandoSesionesSemana, setCargandoSesionesSemana] = useState(false)
  const [errorSesionesSemana, setErrorSesionesSemana] = useState('')

  async function loadSemanasObjetivo() {
    try {
      setSemanasError('')
      const data = await fetchSemanasObjetivo(atletaId)
      setSemanasObjetivo(data?.semanas || [])
    } catch (loadSemanasError) {
      setSemanasError(loadSemanasError.message || 'No se pudieron cargar las semanas del objetivo')
    }
  }

  async function loadPlanificacion() {
    setLoading(true)
    setError('')
    try {
      const data = await fetchPlanificacion(atletaId)
      setPlanificacionData(data)
      setResultadosEdicion({})
      setMarcaConseguidaInput(data?.objetivo?.marca_conseguida || '')
      setSemanaSeleccionadaId(null)
      setSesionesSemanaSeleccionada([])
      await loadSemanasObjetivo()
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
          setMarcaConseguidaInput(data?.objetivo?.marca_conseguida || '')
          setMarcaRegistradaPendienteConfirmacion(false)
          setMarcaError('')
          setMarcaSuccess('')
          setMarcaFinalizadaInfo('')
          setSemanaSeleccionadaId(null)
          setSesionesSemanaSeleccionada([])
        }

        const semanasData = await fetchSemanasObjetivo(atletaId).catch(() => null)
        if (isMounted && semanasData) {
          setSemanasObjetivo(semanasData.semanas || [])
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

  // La semana "de contexto" es la actual o próxima que resuelve el backend por defecto
  // (menor número de pasos para el entrenador). Si el entrenador selecciona otra semana
  // del listado, se consulta y muestra exclusivamente esa semana, sin perder el contexto.
  const esSemanaContexto = semanaSeleccionadaId === null || semanaSeleccionadaId === semana?.id
  const semanaMostrada = useMemo(() => {
    if (esSemanaContexto) {
      return semana
    }
    return semanasObjetivo.find((item) => item.id === semanaSeleccionadaId) || null
  }, [esSemanaContexto, semana, semanasObjetivo, semanaSeleccionadaId])
  const sesionesMostradas = esSemanaContexto ? sesiones : sesionesSemanaSeleccionada

  async function handleSelectSemana(semanaId) {
    if (semanaId === semana?.id) {
      setSemanaSeleccionadaId(null)
      setSesionesSemanaSeleccionada([])
      setErrorSesionesSemana('')
      return
    }

    setSemanaSeleccionadaId(semanaId)
    setErrorSesionesSemana('')
    setCargandoSesionesSemana(true)
    try {
      const data = await fetchSesionesDeSemana(semanaId)
      setSesionesSemanaSeleccionada(data)
    } catch (selectError) {
      setErrorSesionesSemana(selectError.message || 'No se pudieron cargar las sesiones de la semana')
      setSesionesSemanaSeleccionada([])
    } finally {
      setCargandoSesionesSemana(false)
    }
  }

  // Recarga las sesiones que están visibles en pantalla (contexto o semana seleccionada)
  // tras crear/editar una sesión, sin perder la semana que el entrenador está consultando.
  async function refreshSesionesVisibles() {
    if (esSemanaContexto) {
      await loadPlanificacion()
    } else {
      await Promise.all([handleSelectSemana(semanaSeleccionadaId), loadSemanasObjetivo()])
    }
  }

  const objetivoEnDiaDeCompeticion = useMemo(() => {
    return Number(objetivo?.dias_hasta_objetivo) <= 0
  }, [objetivo?.dias_hasta_objetivo])


  const objetivoPendienteDeMarca = useMemo(() => {
    if (!objetivo || !objetivoEnDiaDeCompeticion) {
      return false
    }

    if (marcaRegistradaPendienteConfirmacion) {
      return true
    }

    return !objetivo?.marca_conseguida
  }, [objetivo, objetivoEnDiaDeCompeticion, marcaRegistradaPendienteConfirmacion])

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

    if (!esSemanaContexto) {
      setSesionError('Solo se pueden crear sesiones en la semana actual o próxima')
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
    if (!semanaMostrada?.id) {
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
      await registrarResultadoSesionPlanificacion(atletaId, semanaMostrada.id, sesion.id, payload)
      setResultadoSuccess(`Resultado de sesión ${sesion.orden || sesion.id} guardado`)
      await refreshSesionesVisibles()
    } catch (saveError) {
      setResultadoError(saveError.message || 'No se pudo guardar el resultado de la sesión')
    } finally {
      setSavingResultadoId(null)
    }
  }

  async function handleRegistrarMarcaObjetivo() {
    if (!objetivo?.id) {
      setMarcaError('No hay objetivo activo para registrar la marca')
      return
    }

    const marcaNormalizada = marcaConseguidaInput.trim()
    if (!marcaNormalizada) {
      setMarcaError('La marca conseguida es obligatoria')
      return
    }

    try {
      setRegistrandoMarca(true)
      setMarcaError('')
      setMarcaSuccess('')
      setMarcaFinalizadaInfo('')

      const data = await registrarMarcaObjetivoPlanificacion(atletaId, objetivo.id, {
        marca_conseguida: marcaNormalizada,
      })

      setPlanificacionData((prev) => {
        if (!prev?.objetivo) {
          return prev
        }

        return {
          ...prev,
          objetivo: {
            ...prev.objetivo,
            ...data.objetivo,
            dias_hasta_objetivo: prev.objetivo.dias_hasta_objetivo,
          },
        }
      })

      setMarcaConseguidaInput(data?.objetivo?.marca_conseguida || marcaNormalizada)
      setMarcaSuccess('Marca registrada correctamente')
      setMarcaRegistradaPendienteConfirmacion(true)
    } catch (saveError) {
      setMarcaError(saveError.message || 'No se pudo registrar la marca del objetivo')
    } finally {
      setRegistrandoMarca(false)
    }
  }

  async function handleConfirmarMarca() {
    try {
      await loadPlanificacion()
      setMarcaRegistradaPendienteConfirmacion(false)
      setMarcaSuccess('')
      setMarcaError('')
      setMarcaFinalizadaInfo('La marca se ha registrado correctamente. Puedes consultarla en el historial del atleta.')
    } catch (confirmError) {
      setMarcaError(confirmError.message || 'No se pudo confirmar el registro de la marca')
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

          <article className={`planificacion__card${objetivoEnDiaDeCompeticion ? ' planificacion__card--objetivo-vencido' : ''}`}>
            <h3>Contexto del atleta</h3>
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
              <div>
                <span className="field-label">Días disponibles del atleta</span>
                <strong>{formatDiasDisponibles(atleta?.dias_disponibles)}</strong>
              </div>
              <div>
                <span className="field-label">Marca conseguida</span>
                <strong>{objetivo?.marca_conseguida || '-'}</strong>
              </div>
            </div>

            {marcaFinalizadaInfo && <p className="planificacion__success">{marcaFinalizadaInfo}</p>}

            {objetivoPendienteDeMarca && (
              <div className="planificacion__session-create" aria-label="Registro de marca conseguida">
                {!marcaRegistradaPendienteConfirmacion && (
                  <>
                    <label className="planificacion__field" htmlFor="marca-conseguida-input">
                      <span className="field-label">Marca conseguida</span>
                      <input
                        id="marca-conseguida-input"
                        type="text"
                        value={marcaConseguidaInput}
                        onChange={(event) => {
                          setMarcaConseguidaInput(event.target.value)
                          setMarcaError('')
                          setMarcaSuccess('')
                        }}
                        placeholder="Ej: 36:25, 1:18:42, 5h 12m"
                      />
                    </label>

                    {marcaError && <p>{marcaError}</p>}
                    {marcaSuccess && <p className="planificacion__success">{marcaSuccess}</p>}

                    <div className="planificacion__actions">
                      <button
                        className="planificacion__back"
                        type="button"
                        onClick={handleRegistrarMarcaObjetivo}
                        disabled={registrandoMarca}
                      >
                        {registrandoMarca ? 'Registrando marca...' : 'Registrar marca'}
                      </button>
                    </div>
                  </>
                )}

                {marcaRegistradaPendienteConfirmacion && (
                  <>
                    <p className="planificacion__success">Marca registrada correctamente. Confirma para finalizar el objetivo.</p>
                    <div className="planificacion__actions">
                      <button
                        className="planificacion__back"
                        type="button"
                        onClick={handleConfirmarMarca}
                      >
                        Confirmar registro
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </article>

          <article className="planificacion__card">
            <h3>Semanas de entrenamiento</h3>
            <p className="planificacion__hint">
              La semana actual queda destacada. Las anteriores forman parte del historial de planificación del objetivo.
            </p>

            {semanasError && <p>{semanasError}</p>}
            {!semanasError && semanasObjetivo.length === 0 && (
              <p>Todavía no hay semanas creadas para este objetivo.</p>
            )}

            {semanasObjetivo.length > 0 && (
              <ul className="planificacion__weeks-list" role="list">
                {semanasObjetivo.map((item) => {
                  const estaSeleccionada = item.id === (semanaSeleccionadaId ?? semana?.id)
                  const estadoClave = item.es_actual ? 'actual' : item.es_proxima ? 'proxima' : 'anterior'
                  const etiquetaEstado = item.es_actual ? 'Actual' : item.es_proxima ? 'Próxima' : 'Anterior'

                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        className={`planificacion__week-chip planificacion__week-chip--${estadoClave}${estaSeleccionada ? ' planificacion__week-chip--selected' : ''}`}
                        onClick={() => handleSelectSemana(item.id)}
                      >
                        <span className="planificacion__week-chip-status">{etiquetaEstado}</span>
                        <span>{formatDate(item.fecha_inicio)} – {formatDate(item.fecha_fin)}</span>
                        <span>{item.km_realizados_semana} / {item.km_planificados_semana} km</span>
                        <span>{item.total_sesiones} sesiones</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </article>

          <article className="planificacion__card">
            <h3>{esSemanaContexto ? 'Semana actual / próxima' : 'Semana consultada (historial)'}</h3>
            {!semanaMostrada && <p>No hay semana actual ni próxima para este atleta.</p>}
            {cargandoSesionesSemana && <p>Cargando sesiones de la semana...</p>}
            {errorSesionesSemana && <p>{errorSesionesSemana}</p>}
            {semanaMostrada && (
              <div className="planificacion__grid">
                <div>
                  <span className="field-label">Inicio</span>
                  <strong>{formatDate(semanaMostrada.fecha_inicio)}</strong>
                </div>
                <div>
                  <span className="field-label">Fin</span>
                  <strong>{formatDate(semanaMostrada.fecha_fin)}</strong>
                </div>
                <div>
                  <span className="field-label">Kilómetros semanales</span>
                  <strong>
                    {semanaMostrada.km_realizados_semana} / {semanaMostrada.km_planificados_semana} km
                  </strong>
                </div>
                <div>
                  <span className="field-label">Total sesiones</span>
                  <strong>{semanaMostrada.total_sesiones}</strong>
                </div>
              </div>
            )}
            {!esSemanaContexto && semanaMostrada && (
              <div className="planificacion__actions planificacion__actions--top">
                <button className="planificacion__back" type="button" onClick={() => handleSelectSemana(semana?.id)}>
                  Volver a la semana actual/próxima
                </button>
              </div>
            )}
          </article>

          <article className="planificacion__card">
            <div className="planificacion__sessions-head">
              <h3>Sesiones de la semana {esSemanaContexto ? '' : '(historial)'}</h3>
              <button
                className="planificacion__back"
                type="button"
                onClick={handleOpenCreateSesion}
                disabled={!semana || !esSemanaContexto || creatingSesion}
                title={!esSemanaContexto ? 'Solo se pueden crear sesiones en la semana actual o próxima' : undefined}
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
                    disabled={creatingSesion || !semana || !esSemanaContexto}
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

            {sesionesMostradas.length === 0 && !cargandoSesionesSemana && (
              <p>Esta semana todavía no tiene sesiones planificadas.</p>
            )}

            {sesionesMostradas.length > 0 && (
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
                {sesionesMostradas.map((sesion) => (
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

          <article className="planificacion__card planificacion__card--feedback-placeholder">
            <h3>Feedback</h3>
            <p className="planificacion__hint">
              Próximamente: el atleta podrá enviar feedback de la semana actual y el entrenador
              podrá consultarlo aquí, asociado a la semana/sesión correspondiente. Esta sección
              queda preparada en la interfaz sin implementar todavía la funcionalidad completa.
            </p>
          </article>
        </section>
      )}
    </main>
  )
}

export default Planificacion
