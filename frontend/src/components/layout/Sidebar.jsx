import { useEffect, useMemo, useState } from 'react'
import logoCas from '../../assets/CAS_3.jpeg'
import { fetchSidebarAtletas, fetchSidebarHistorialAtleta, fetchSidebarSesionesSemana } from '../../services/sidebarApi'
import { formatDate } from '../../utils/dateFormat'

const ADMIN_SECTIONS = [
  {
    id: 'entrenadores',
    title: 'Entrenadores',
    actions: ['Crear', 'Editar'],
  },
  {
    id: 'atletas',
    title: 'Atletas',
    actions: ['Crear', 'Editar'],
  },
  {
    id: 'objetivos',
    title: 'Objetivos',
    actions: ['Crear', 'Editar'],
  },
]

function getObjetivoEstadoLabel(estado) {
  if (estado === 'activo') {
    return 'Activo'
  }

  if (estado === 'finalizado') {
    return 'Finalizado'
  }

  return 'Inactivo'
}

function formatKilometros(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '-'
  }

  return `${Number(value)} km`
}

function buildFeedbackLabel(feedback) {
  if (!feedback) {
    return 'Sin feedback registrado'
  }

  const estado = feedback.completada ? 'Completada' : 'No completada'
  return `${estado} · ${formatDate(feedback.fecha_feedback)}`
}

function Sidebar({ activeModule = 'panelPrincipal', onNavigateDashboard }) {
  const [logoLoadError, setLogoLoadError] = useState(false)
  const [expandedModule, setExpandedModule] = useState(activeModule === 'panelPrincipal' ? '' : activeModule)
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
  const [expandedAdminSection, setExpandedAdminSection] = useState('atletas')

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

    setExpandedModule('atletas')

    if (expandedAtletaId === atletaIdNumerico) {
      setExpandedAtletaId(null)
      return
    }

    setExpandedAtletaId(atletaIdNumerico)

    if (historialByAtleta[atletaIdNumerico]) {
      return
    }

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

    const currentSemanaId = expandedSemanaIdByObjetivo[objetivoIdNumerico]
    const nextSemanaId = currentSemanaId === semanaIdNumerico ? null : semanaIdNumerico

    setExpandedSemanaIdByObjetivo((prev) => ({
      ...prev,
      [objetivoIdNumerico]: nextSemanaId,
    }))

    if (!nextSemanaId || sesionesBySemana[semanaIdNumerico]) {
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

  function handleToggleModule(moduleId) {
    setExpandedModule((currentModule) => currentModule === moduleId ? '' : moduleId)
  }

  return (
    <aside className="sidebar" aria-label="Navegacion principal">
      <div className="sidebar__brand">
        <div className="sidebar__mark" aria-hidden="true">
          {!logoLoadError && (
            <img
              className="sidebar__logo"
              src={logoCas}
              alt=""
              onError={() => setLogoLoadError(true)}
            />
          )}
          <span className={`sidebar__mark-main${logoLoadError ? '' : ' sidebar__mark-main--hidden'}`}>
            TT
          </span>
          <span className={`sidebar__mark-sub${logoLoadError ? '' : ' sidebar__mark-sub--hidden'}`}>
            app
          </span>
        </div>

        <div>
          <p className="eyebrow eyebrow--brand">Training Tool</p>
          <h1 className="sidebar__title">Panel de trabajo</h1>
        </div>
      </div>

      <nav className="menu" aria-label="Modulos de trabajo">
        <button
          className={`menu__item${activeModule === 'panelPrincipal' ? ' menu__item--active' : ''}`}
          type="button"
          onClick={onNavigateDashboard}
        >
          <span className="menu__item-title">Panel principal</span>
          <span className="menu__item-description">Seguimiento diario del club</span>
        </button>

        <div className="sidebar__section">
          <button
            className={`menu__item${expandedModule === 'atletas' ? ' menu__item--active' : ''}`}
            type="button"
            aria-expanded={expandedModule === 'atletas'}
            onClick={() => handleToggleModule('atletas')}
          >
            <span className="menu__item-title">Atletas</span>
            <span className="menu__item-description">Consulta deportiva e historial completo</span>
          </button>

          {expandedModule === 'atletas' && (
            <div className="sidebar__panel" aria-label="Arbol de atletas">
              <p className="sidebar__panel-copy">
                El sidebar mantiene el contexto del atleta sin obligarte a saltar entre pantallas.
              </p>

              {atletasLoading && <p className="sidebar__status">Cargando atletas...</p>}
              {atletasError && !atletasLoading && <p className="sidebar__status">{atletasError}</p>}

              {!atletasLoading && !atletasError && atletasOrdenados.length === 0 && (
                <p className="sidebar__status">No hay atletas registrados.</p>
              )}

              {!atletasLoading && !atletasError && atletasOrdenados.length > 0 && (
                <div className="sidebar-tree" role="tree">
                  {atletasOrdenados.map((atleta) => {
                    const atletaId = Number(atleta.id)
                    const historial = historialByAtleta[atletaId]
                    const objetivos = historial?.objetivos || []
                    const atletaExpandido = expandedAtletaId === atletaId
                    const cargandoHistorial = Boolean(historialLoadingByAtleta[atletaId])
                    const errorHistorial = historialErrorByAtleta[atletaId]
                    const objetivoExpandidoId = expandedObjetivoIdByAtleta[atletaId]

                    return (
                      <div className="sidebar-tree__node" key={atletaId} role="treeitem" aria-expanded={atletaExpandido}>
                        <button
                          className={`sidebar-tree__button${atletaExpandido ? ' sidebar-tree__button--active' : ''}`}
                          type="button"
                          onClick={() => handleToggleAtleta(atletaId)}
                        >
                          <span>{atleta.nombre || `Atleta ${atletaId}`}</span>
                          <span className="sidebar-tree__meta">{objetivos.length} objetivos</span>
                        </button>

                        {atletaExpandido && (
                          <div className="sidebar-tree__children" role="group">
                            {cargandoHistorial && <p className="sidebar__status">Cargando objetivos...</p>}
                            {errorHistorial && !cargandoHistorial && <p className="sidebar__status">{errorHistorial}</p>}

                            {!cargandoHistorial && !errorHistorial && objetivos.length === 0 && (
                              <p className="sidebar__status">Sin objetivos historicos.</p>
                            )}

                            {!cargandoHistorial && !errorHistorial && objetivos.map((objetivo) => {
                              const objetivoId = Number(objetivo.id)
                              const objetivoExpandido = objetivoExpandidoId === objetivoId
                              const semanas = objetivo.planificacion || []
                              const semanaExpandidaId = expandedSemanaIdByObjetivo[objetivoId]

                              return (
                                <div className="sidebar-tree__node" key={objetivoId} role="treeitem" aria-expanded={objetivoExpandido}>
                                  <button
                                    className={`sidebar-tree__button sidebar-tree__button--child${objetivoExpandido ? ' sidebar-tree__button--active' : ''}`}
                                    type="button"
                                    onClick={() => handleToggleObjetivo(atletaId, objetivoId)}
                                  >
                                    <span>{objetivo.nombre || 'Objetivo sin nombre'}</span>
                                    <span className={`sidebar-tree__badge sidebar-tree__badge--${objetivo.estado}`}>
                                      {getObjetivoEstadoLabel(objetivo.estado)}
                                    </span>
                                  </button>

                                  {objetivoExpandido && (
                                    <div className="sidebar-tree__children" role="group">
                                      <p className="sidebar-tree__summary">
                                        Fecha objetivo: {formatDate(objetivo.fecha_objetivo)}
                                      </p>

                                      {semanas.length === 0 && (
                                        <p className="sidebar__status">Sin semanas de entrenamiento.</p>
                                      )}

                                      {semanas.map((semana, index) => {
                                        const semanaId = Number(semana.semana_id)
                                        const semanaExpandida = semanaExpandidaId === semanaId
                                        const feedback = semana.feedback
                                        const sesiones = sesionesBySemana[semanaId] || []
                                        const cargandoSesiones = Boolean(sesionesLoadingBySemana[semanaId])
                                        const errorSesiones = sesionesErrorBySemana[semanaId]

                                        return (
                                          <div className="sidebar-tree__node" key={semanaId} role="treeitem" aria-expanded={semanaExpandida}>
                                            <button
                                              className={`sidebar-tree__button sidebar-tree__button--grandchild${semanaExpandida ? ' sidebar-tree__button--active' : ''}`}
                                              type="button"
                                              onClick={() => handleToggleSemana(objetivoId, semanaId)}
                                            >
                                              <span>
                                                Semana {index + 1} · {formatDate(semana.fecha_inicio)}
                                              </span>
                                              <span className="sidebar-tree__meta">
                                                {formatKilometros(semana.kilometros_realizados)} / {formatKilometros(semana.kilometros_planificados)}
                                              </span>
                                            </button>

                                            {semanaExpandida && (
                                              <div className="sidebar-tree__detail" role="group">
                                                <div className="sidebar-tree__leaf">
                                                  <p className="sidebar-tree__leaf-label">Sesiones de entrenamiento</p>
                                                  {cargandoSesiones && <p className="sidebar__status">Cargando sesiones...</p>}
                                                  {errorSesiones && !cargandoSesiones && <p className="sidebar__status">{errorSesiones}</p>}
                                                  {!cargandoSesiones && !errorSesiones && sesiones.length === 0 && (
                                                    <p className="sidebar__status">Sin sesiones registradas.</p>
                                                  )}
                                                  {!cargandoSesiones && !errorSesiones && sesiones.length > 0 && (
                                                    <ul className="sidebar-tree__list">
                                                      {sesiones.map((sesion) => (
                                                        <li className="sidebar-tree__list-item" key={sesion.id}>
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

                                                <div className="sidebar-tree__leaf">
                                                  <p className="sidebar-tree__leaf-label">Feedback</p>
                                                  <p className="sidebar-tree__summary">{buildFeedbackLabel(feedback)}</p>
                                                  {feedback?.resumen_corto && (
                                                    <p className="sidebar-tree__feedback">{feedback.resumen_corto}</p>
                                                  )}
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
            </div>
          )}
        </div>

        <div className="sidebar__section">
          <button
            className={`menu__item${expandedModule === 'administracion' ? ' menu__item--active' : ''}`}
            type="button"
            aria-expanded={expandedModule === 'administracion'}
            onClick={() => handleToggleModule('administracion')}
          >
            <span className="menu__item-title">Administracion</span>
            <span className="menu__item-description">Mantenimiento estructural de la aplicacion</span>
          </button>

          {expandedModule === 'administracion' && (
            <div className="sidebar__panel" aria-label="Tareas de administracion">
              <p className="sidebar__panel-copy">
                Estructura preparada para altas y mantenimiento, sin activar permisos ni flujos nuevos en esta iteracion.
              </p>

              {ADMIN_SECTIONS.map((section) => {
                const expanded = expandedAdminSection === section.id

                return (
                  <div className="sidebar-admin" key={section.id}>
                    <button
                      className={`sidebar-tree__button sidebar-tree__button--child${expanded ? ' sidebar-tree__button--active' : ''}`}
                      type="button"
                      aria-expanded={expanded}
                      onClick={() => setExpandedAdminSection(expanded ? '' : section.id)}
                    >
                      <span>{section.title}</span>
                      <span className="sidebar-tree__meta">2 acciones</span>
                    </button>

                    {expanded && (
                      <div className="sidebar-tree__children" role="group">
                        {section.actions.map((action) => (
                          <button
                            className="sidebar-admin__action"
                            key={`${section.id}-${action}`}
                            type="button"
                            disabled
                          >
                            {action}
                          </button>
                        ))}

                        {section.id === 'atletas' && (
                          <p className="sidebar-tree__summary">
                            Regla de negocio: el atleta se asocia al entrenador en el momento de alta.
                          </p>
                        )}

                        {section.id === 'objetivos' && (
                          <p className="sidebar-tree__summary">
                            Regla de negocio: cada objetivo nace ligado a un atleta concreto.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </nav>
    </aside>
  )
}

export default Sidebar