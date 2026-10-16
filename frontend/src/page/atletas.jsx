import { useEffect, useMemo, useState } from 'react'
import { formatDate } from '../utils/dateFormat'
import {
  fetchSidebarAtletas,
  fetchSidebarHistorialAtleta,
  fetchSidebarSesionesSemana,
} from '../services/sidebarApi'
import { crearObjetivo, DISTANCIAS_OBJETIVO } from '../services/objetivosApi'

const FORMULARIO_OBJETIVO_VACIO = {
  nombre: '',
  distancia_objetivo: DISTANCIAS_OBJETIVO[0],
  distancia_objetivo_manual: '',
  fecha_objetivo: '',
}

function formatKilometros(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '-'
  }

  return `${Number(value)} km`
}

function getObjetivoEstadoLabel(estado) {
  if (estado === 'activo') {
    return 'Activo'
  }

  if (estado === 'finalizado') {
    return 'Finalizado'
  }

  return 'Inactivo'
}

function buildFeedbackLabel(feedback) {
  if (!feedback) {
    return 'Sin feedback registrado'
  }

  return `${feedback.completada ? 'Completada' : 'No completada'} · ${formatDate(feedback.fecha_feedback)}`
}

function Atletas({ rol, onOpenPlanificacion, onOpenHistorial }) {
  const [formAtletaId, setFormAtletaId] = useState(null)
  const [formObjetivo, setFormObjetivo] = useState(FORMULARIO_OBJETIVO_VACIO)
  const [formError, setFormError] = useState('')
  const [formSaving, setFormSaving] = useState(false)
  const [atletas, setAtletas] = useState([])
  const [atletasLoading, setAtletasLoading] = useState(true)
  const [atletasError, setAtletasError] = useState('')
  const [expandedAtletaId, setExpandedAtletaId] = useState(null)
  const [historialByAtleta, setHistorialByAtleta] = useState({})
  const [historialLoadingByAtleta, setHistorialLoadingByAtleta] = useState({})
  const [historialErrorByAtleta, setHistorialErrorByAtleta] = useState({})
  const [expandedObjetivoIdByAtleta, setExpandedObjetivoIdByAtleta] = useState({})
  const [expandedSemanaIdByObjetivo, setExpandedSemanaIdByObjetivo] = useState({})
  const [sesionesBySemana, setSesionesBySemana] = useState({})
  const [sesionesLoadingBySemana, setSesionesLoadingBySemana] = useState({})
  const [sesionesErrorBySemana, setSesionesErrorBySemana] = useState({})

  useEffect(() => {
    let isMounted = true

    async function loadAtletas() {
      try {
        setAtletasLoading(true)
        setAtletasError('')
        const data = await fetchSidebarAtletas()

        if (isMounted) {
          setAtletas(data)
        }
      } catch (loadError) {
        if (isMounted) {
          setAtletasError(loadError.message || 'Error al cargar atletas')
        }
      } finally {
        if (isMounted) {
          setAtletasLoading(false)
        }
      }
    }

    loadAtletas()

    return () => {
      isMounted = false
    }
  }, [])

  const atletasOrdenados = useMemo(() => {
    return [...atletas].sort((left, right) => {
      return String(left.nombre || '').localeCompare(String(right.nombre || ''), 'es')
    })
  }, [atletas])

  async function handleToggleAtleta(atletaId) {
    const atletaIdNumerico = Number(atletaId)
    if (!atletaIdNumerico) {
      return
    }

    if (expandedAtletaId === atletaIdNumerico) {
      setExpandedAtletaId(null)
      return
    }

    setExpandedAtletaId(atletaIdNumerico)

    if (historialByAtleta[atletaIdNumerico]) {
      return
    }

    await cargarHistorial(atletaIdNumerico)
  }

  async function cargarHistorial(atletaIdNumerico) {
    try {
      setHistorialLoadingByAtleta((prev) => ({
        ...prev,
        [atletaIdNumerico]: true,
      }))
      setHistorialErrorByAtleta((prev) => ({
        ...prev,
        [atletaIdNumerico]: '',
      }))

      const data = await fetchSidebarHistorialAtleta(atletaIdNumerico)

      setHistorialByAtleta((prev) => ({
        ...prev,
        [atletaIdNumerico]: data,
      }))
    } catch (loadError) {
      setHistorialErrorByAtleta((prev) => ({
        ...prev,
        [atletaIdNumerico]: loadError.message || 'Error al cargar el historial del atleta',
      }))
    } finally {
      setHistorialLoadingByAtleta((prev) => ({
        ...prev,
        [atletaIdNumerico]: false,
      }))
    }
  }

  function handleAbrirFormObjetivo(atletaId) {
    setFormAtletaId(atletaId)
    setFormObjetivo(FORMULARIO_OBJETIVO_VACIO)
    setFormError('')
  }

  async function handleSubmitObjetivo(event, atletaId) {
    event.preventDefault()
    setFormError('')

    if (!formObjetivo.nombre.trim() || !formObjetivo.fecha_objetivo) {
      setFormError('Nombre y fecha son obligatorios')
      return
    }

    const esOtro = formObjetivo.distancia_objetivo === 'Otro'
    if (esOtro && !formObjetivo.distancia_objetivo_manual.trim()) {
      setFormError('Indica la distancia manual')
      return
    }

    try {
      setFormSaving(true)
      await crearObjetivo({
        atleta_id: atletaId,
        nombre: formObjetivo.nombre.trim(),
        distancia_objetivo: formObjetivo.distancia_objetivo,
        ...(esOtro ? { distancia_objetivo_manual: formObjetivo.distancia_objetivo_manual.trim() } : {}),
        fecha_objetivo: formObjetivo.fecha_objetivo,
      })
      setFormAtletaId(null)
      await cargarHistorial(atletaId)
    } catch (saveError) {
      setFormError(saveError.message)
    } finally {
      setFormSaving(false)
    }
  }

  function handleToggleObjetivo(atletaId, objetivoId) {
    const objetivoIdNumerico = Number(objetivoId)
    if (!objetivoIdNumerico) {
      return
    }

    setExpandedObjetivoIdByAtleta((prev) => ({
      ...prev,
      [atletaId]: prev[atletaId] === objetivoIdNumerico ? null : objetivoIdNumerico,
    }))
  }

  async function handleToggleSemana(objetivoId, semanaId) {
    const objetivoIdNumerico = Number(objetivoId)
    const semanaIdNumerico = Number(semanaId)

    if (!objetivoIdNumerico || !semanaIdNumerico) {
      return
    }

    const semanaActual = expandedSemanaIdByObjetivo[objetivoIdNumerico]
    const siguienteSemana = semanaActual === semanaIdNumerico ? null : semanaIdNumerico

    setExpandedSemanaIdByObjetivo((prev) => ({
      ...prev,
      [objetivoIdNumerico]: siguienteSemana,
    }))

    if (!siguienteSemana || sesionesBySemana[semanaIdNumerico]) {
      return
    }

    try {
      setSesionesLoadingBySemana((prev) => ({
        ...prev,
        [semanaIdNumerico]: true,
      }))
      setSesionesErrorBySemana((prev) => ({
        ...prev,
        [semanaIdNumerico]: '',
      }))

      const sesiones = await fetchSidebarSesionesSemana(semanaIdNumerico)

      setSesionesBySemana((prev) => ({
        ...prev,
        [semanaIdNumerico]: sesiones,
      }))
    } catch (loadError) {
      setSesionesErrorBySemana((prev) => ({
        ...prev,
        [semanaIdNumerico]: loadError.message || 'Error al cargar las sesiones de la semana',
      }))
    } finally {
      setSesionesLoadingBySemana((prev) => ({
        ...prev,
        [semanaIdNumerico]: false,
      }))
    }
  }

  return (
    <section className="main-panel" aria-labelledby="modulo-atletas">
      <div className="panel-header">
        <h2 id="modulo-atletas">Atletas</h2>
        <p className="panel-header__subtitle">Todos los atletas y su contexto deportivo completo.</p>
      </div>

      {atletasLoading && <p>Cargando atletas...</p>}
      {atletasError && !atletasLoading && <p>{atletasError}</p>}
      {!atletasLoading && !atletasError && atletasOrdenados.length === 0 && <p>No hay atletas registrados.</p>}

      {!atletasLoading && !atletasError && atletasOrdenados.length > 0 && (
        <div className="atletas-tree" role="tree">
          {atletasOrdenados.map((atleta) => {
            const atletaId = Number(atleta.id)
            const historial = historialByAtleta[atletaId]
            const objetivos = historial?.objetivos || []
            const atletaExpandido = expandedAtletaId === atletaId
            const cargandoHistorial = Boolean(historialLoadingByAtleta[atletaId])
            const errorHistorial = historialErrorByAtleta[atletaId]
            const objetivoExpandidoId = expandedObjetivoIdByAtleta[atletaId]

            return (
              <div className="atletas-tree__node" key={atletaId} role="treeitem" aria-expanded={atletaExpandido}>
                <button
                  className={`atletas-tree__button${atletaExpandido ? ' atletas-tree__button--active' : ''}`}
                  type="button"
                  onClick={() => handleToggleAtleta(atletaId)}
                >
                  <span>{atleta.nombre || `Atleta ${atletaId}`}</span>
                  <span className="atletas-tree__meta">{objetivos.length} objetivos</span>
                </button>

                {atletaExpandido && (
                  <div className="atletas-tree__children" role="group">
                    <div className="module-actions">
                      <button className="plan-button" type="button" onClick={() => onOpenPlanificacion?.(atletaId)}>
                        Ver planificación
                      </button>
                      <button className="plan-button" type="button" onClick={() => onOpenHistorial?.(atletaId)}>
                        Ver historial
                      </button>
                    </div>

                    {rol === 'ENTRENADOR' && (
                      formAtletaId === atletaId ? (
                        <form className="objetivo-form" onSubmit={(event) => handleSubmitObjetivo(event, atletaId)}>
                          <label>
                            Nombre
                            <input
                              type="text"
                              value={formObjetivo.nombre}
                              onChange={(event) => setFormObjetivo((prev) => ({ ...prev, nombre: event.target.value }))}
                            />
                          </label>
                          <label>
                            Distancia
                            <select
                              value={formObjetivo.distancia_objetivo}
                              onChange={(event) => setFormObjetivo((prev) => ({ ...prev, distancia_objetivo: event.target.value }))}
                            >
                              {DISTANCIAS_OBJETIVO.map((distancia) => (
                                <option key={distancia} value={distancia}>{distancia}</option>
                              ))}
                            </select>
                          </label>
                          {formObjetivo.distancia_objetivo === 'Otro' && (
                            <label>
                              Distancia manual
                              <input
                                type="text"
                                value={formObjetivo.distancia_objetivo_manual}
                                onChange={(event) => setFormObjetivo((prev) => ({ ...prev, distancia_objetivo_manual: event.target.value }))}
                              />
                            </label>
                          )}
                          <label>
                            Fecha objetivo
                            <input
                              type="date"
                              value={formObjetivo.fecha_objetivo}
                              onChange={(event) => setFormObjetivo((prev) => ({ ...prev, fecha_objetivo: event.target.value }))}
                            />
                          </label>
                          {formError && <p role="alert">{formError}</p>}
                          <div className="module-actions">
                            <button className="plan-button" type="submit" disabled={formSaving}>
                              {formSaving ? 'Guardando...' : 'Crear objetivo'}
                            </button>
                            <button className="plan-button" type="button" onClick={() => setFormAtletaId(null)}>
                              Cancelar
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="module-actions">
                          <button
                            className="plan-button"
                            type="button"
                            disabled={objetivos.some((objetivo) => objetivo.estado === 'activo')}
                            onClick={() => handleAbrirFormObjetivo(atletaId)}
                          >
                            Nuevo objetivo
                          </button>
                          {objetivos.some((objetivo) => objetivo.estado === 'activo') && (
                            <span className="module-note">Ya tiene un objetivo activo</span>
                          )}
                        </div>
                      )
                    )}

                    {cargandoHistorial && <p>Cargando objetivos...</p>}
                    {errorHistorial && !cargandoHistorial && <p>{errorHistorial}</p>}
                    {!cargandoHistorial && !errorHistorial && objetivos.length === 0 && <p>Sin objetivos historicos.</p>}

                    {!cargandoHistorial && !errorHistorial && objetivos.map((objetivo) => {
                      const objetivoId = Number(objetivo.id)
                      const objetivoExpandido = objetivoExpandidoId === objetivoId
                      const semanas = objetivo.planificacion || []
                      const semanaExpandidaId = expandedSemanaIdByObjetivo[objetivoId]

                      return (
                        <div className="atletas-tree__node" key={objetivoId} role="treeitem" aria-expanded={objetivoExpandido}>
                          <button
                            className={`atletas-tree__button atletas-tree__button--child${objetivoExpandido ? ' atletas-tree__button--active' : ''}`}
                            type="button"
                            onClick={() => handleToggleObjetivo(atletaId, objetivoId)}
                          >
                            <span>{objetivo.nombre || 'Objetivo sin nombre'}</span>
                            <span className={`atletas-tree__badge atletas-tree__badge--${objetivo.estado}`}>
                              {getObjetivoEstadoLabel(objetivo.estado)}
                            </span>
                          </button>

                          {objetivoExpandido && (
                            <div className="atletas-tree__children" role="group">
                              <p className="module-note">Fecha objetivo: {formatDate(objetivo.fecha_objetivo)}</p>
                              {semanas.length === 0 && <p>Sin semanas de entrenamiento.</p>}

                              {semanas.map((semana, index) => {
                                const semanaId = Number(semana.semana_id)
                                const semanaExpandida = semanaExpandidaId === semanaId
                                const feedback = semana.feedback
                                const sesiones = sesionesBySemana[semanaId] || []
                                const cargandoSesiones = Boolean(sesionesLoadingBySemana[semanaId])
                                const errorSesiones = sesionesErrorBySemana[semanaId]

                                return (
                                  <div className="atletas-tree__node" key={semanaId} role="treeitem" aria-expanded={semanaExpandida}>
                                    <button
                                      className={`atletas-tree__button atletas-tree__button--grandchild${semanaExpandida ? ' atletas-tree__button--active' : ''}`}
                                      type="button"
                                      onClick={() => handleToggleSemana(objetivoId, semanaId)}
                                    >
                                      <span>Semana {index + 1} · {formatDate(semana.fecha_inicio)}</span>
                                      <span className="atletas-tree__meta">
                                        {formatKilometros(semana.kilometros_realizados)} / {formatKilometros(semana.kilometros_planificados)}
                                      </span>
                                    </button>

                                    {semanaExpandida && (
                                      <div className="atletas-tree__detail" role="group">
                                        <div className="atletas-tree__leaf">
                                          <p className="atletas-tree__leaf-label">Sesiones de entrenamiento</p>
                                          {cargandoSesiones && <p>Cargando sesiones...</p>}
                                          {errorSesiones && !cargandoSesiones && <p>{errorSesiones}</p>}
                                          {!cargandoSesiones && !errorSesiones && sesiones.length === 0 && <p>Sin sesiones registradas.</p>}
                                          {!cargandoSesiones && !errorSesiones && sesiones.length > 0 && (
                                            <ul className="atletas-tree__list">
                                              {sesiones.map((sesion) => (
                                                <li className="atletas-tree__list-item" key={sesion.id}>
                                                  <strong>Sesion {sesion.orden}</strong>
                                                  <span>{sesion.descripcion}</span>
                                                  <span>
                                                    {formatKilometros(sesion.kilometros_planificados)} / {formatKilometros(sesion.kilometros_realizados)}
                                                  </span>
                                                </li>
                                              ))}
                                            </ul>
                                          )}
                                        </div>

                                        <div className="atletas-tree__leaf">
                                          <p className="atletas-tree__leaf-label">Feedback</p>
                                          <p className="module-note">{buildFeedbackLabel(feedback)}</p>
                                          {feedback?.resumen_corto && <p className="module-note">{feedback.resumen_corto}</p>}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

export default Atletas