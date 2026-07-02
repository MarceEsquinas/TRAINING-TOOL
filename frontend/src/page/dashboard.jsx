import { useEffect, useMemo, useState } from 'react'
import '../App.css'
import { fetchDashboard } from '../services/dashboardApi'
import logoCas from '../assets/CAS_3.jpeg'
import { formatDate } from '../utils/dateFormat'

function Dashboard({ onOpenPlanificacion, onOpenHistorial, onOpenFeedbackFromNotification }) {
   // Estado de pantalla: datos, carga en curso y posible error de red.
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [logoLoadError, setLogoLoadError] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  // Carga inicial del dashboard al montar el componente.
  useEffect(() => {
    // Evita setState cuando la pantalla ya no esta montada.
    let isMounted = true

    async function loadDashboard() {
      try {
        setLoading(true)
        setError('')
        const data = await fetchDashboard()
        if (isMounted) {
          setDashboardData(data)
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message || 'Error al cargar el dashboard')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadDashboard()

    return () => {
      isMounted = false
    }
  }, [])

  // Extrae solo los datos que usa esta vista desde la respuesta del backend.
  const atletas = useMemo(() => dashboardData?.atletas || [], [dashboardData])
  const notifications = useMemo(() => dashboardData?.notifications || [], [dashboardData])

  // Conteo para la campana de notificaciones del topbar.
  const feedbackNuevos = useMemo(() => {
    return Number(dashboardData?.summary?.num_feedback_nuevos || 0)
  }, [dashboardData])
  const feedbackBadge = feedbackNuevos > 9 ? '9+' : String(feedbackNuevos)

  function handleOpenNotification(notification) {
    const atletaId = Number(notification?.atleta_id)
    const feedbackId = Number(notification?.id)

    if (!atletaId || !feedbackId) {
      return
    }

    // Cierra el panel para que el flujo visual sea limpio antes de navegar.
    setNotificationsOpen(false)
    onOpenFeedbackFromNotification?.({ atletaId, feedbackId })
  }

  // Mapea el modelo de backend al modelo visual que necesita la tarjeta de UI.
  const atletasUI = useMemo(() => {
    return atletas.map((atleta) => {
      // Reglas de presentacion para transformar estado de negocio en etiqueta/color/prioridad.
      const estadoPrioritario = atleta.estado_prioritario || 'ok'
      const colorByEstado = {
        planificacion_pendiente: 'rojo',
        objetivo_proximo: 'amarillo',
        ok: 'verde',
      }

      const labelByEstado = {
        planificacion_pendiente: 'Planificacion pendiente',
        objetivo_proximo: 'Objetivo proximo',
        ok: 'Todo correcto',
      }

      const priorityByEstado = {
        planificacion_pendiente: 1,
        objetivo_proximo: 2,
        ok: 3,
      }

      return {
        id: atleta.atleta_id,
        nombre: atleta.atleta_nombre || atleta.nombre,
        objetivo: atleta.objetivo_nombre,
        fechaObjetivo: atleta.semana_fecha_fin || '-',
        diasRestantes: atleta.dias_hasta_objetivo,
        kilometrosHechos: Number(atleta.km_realizados_semana || 0),
        kilometrosPlanificados: Number(atleta.km_planificados_semana || 0),
        estado: labelByEstado[estadoPrioritario] || estadoPrioritario,
        estadoColor: colorByEstado[estadoPrioritario] || 'verde',
        prioridad: priorityByEstado[estadoPrioritario] || 3,
        razonEstado: atleta.razon_estado,
      }
    })
  }, [atletas])

  // Orden final mostrado en pantalla: prioridad ascendente (1 es mas urgente).
  const atletasOrdenados = [...atletasUI].sort((a, b) => a.prioridad - b.prioridad)

  // Texto corto para mantener un lenguaje visual simple y directo.
  const leyendaPrioridad = [
    {
      prioridad: '1',
      titulo: 'Feedback pendiente',
      color: 'rojo',
    },
    {
      prioridad: '2',
      titulo: 'Planificación pendiente',
      color: 'amarillo',
    },
    {
      prioridad: '3',
      titulo: 'Objetivo próximo',
      color: 'azul',
    },
    {
      prioridad: '4',
      titulo: 'Todo correcto',
      color: 'verde',
    },
  ]

  return (
    <main className="app-shell">
      {/* Barra lateral izquierda: navegación principal del entrenador. */}
      <aside className="sidebar" aria-label="Navegación principal">
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

        <nav className="menu" aria-label="Secciones">
          <button className="menu__item menu__item--active" type="button">
            Panel principal
          </button>
          <button className="menu__item" type="button">
            Atletas
          </button>
          <button className="menu__item" type="button">
            Objetivos
          </button>
          <button className="menu__item" type="button">
            Historial
          </button>
        </nav>

        <button className="sidebar__logout" type="button">
          Cerrar sesión
        </button>
      </aside>

      <div className="content">
        {/* Barra superior: identidad del entrenador y zona reservada para avisos. */}
        <header className="topbar">
          <div className="trainer">
            <div className="trainer__avatar" aria-hidden="true">
              PG
            </div>
            <div>
              <p className="eyebrow">Entrenador: Pepito García</p>
              <p className="topbar__hint">Vista rápida del trabajo de hoy en el club</p>
            </div>
          </div>

          <button
            className="notifications"
            type="button"
            aria-label={`Notificaciones (${feedbackNuevos} pendientes)`}
            aria-expanded={notificationsOpen}
            onClick={() => setNotificationsOpen((prev) => !prev)}
          >
            <span className="notifications__bell" aria-hidden="true" />
            <span className="notifications__text">Notificaciones</span>
            {feedbackNuevos > 0 && (
              <span className="notifications__badge" aria-hidden="true">
                {feedbackBadge}
              </span>
            )}
          </button>

          {notificationsOpen && (
            // Responsabilidad del componente: desplegar notificaciones pendientes en la misma pantalla.
            <div className="notifications__panel" role="region" aria-label="Listado de notificaciones">
              {notifications.length === 0 && (
                <p className="notifications__empty">Sin feedback pendiente de lectura.</p>
              )}

              {notifications.length > 0 && (
                <ul className="notifications__list" role="list">
                  {notifications.map((notification) => (
                    <li key={notification.id} className="notifications__item">
                      <button
                        className="notifications__item-button"
                        type="button"
                        onClick={() => handleOpenNotification(notification)}
                      >
                        <p className="notifications__line"><strong>Atleta:</strong> {notification.atleta_nombre || '-'}</p>
                        <p className="notifications__line"><strong>Objetivo:</strong> {notification.objetivo_nombre || '-'}</p>
                        <p className="notifications__line">
                          <strong>Semana:</strong> {formatDate(notification.semana_fecha_inicio)} - {formatDate(notification.semana_fecha_fin)}
                        </p>
                        <p className="notifications__hint">Abrir feedback completo</p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </header>

        {/* Contenido principal: la atención se centra en qué atleta necesita acción. */}
        <section className="main-panel" aria-labelledby="panel-principal">
          <div className="panel-header">
            <h2 id="panel-principal">Panel principal</h2>
            <p className="panel-header__subtitle">
              ¿Qué atleta necesita hoy mi atención?
            </p>
            <p className="panel-header__note">Atletas con objetivo activo.</p>
          </div>

          {/* Estados de experiencia: primero carga, luego error si existe. */}
          {loading && <p>Cargando dashboard...</p>}
          {error && !loading && <p>{error}</p>}

          <div className="athletes-list">
            {atletasOrdenados.map((atleta) => (
              <article className="athlete-card" key={atleta.id || atleta.nombre}>
                <div className="athlete-card__head">
                  <div>
                    <h3 translate="no">{atleta.nombre}</h3>
                    <p className="athlete-card__objective">{atleta.objetivo}</p>
                  </div>
                  <span className={`status-pill status-pill--${atleta.estadoColor}`}>
                    {atleta.estado}
                  </span>
                </div>

                <div className="athlete-card__grid">
                  <div>
                    <span className="field-label">Semana (fin)</span>
                    <strong>{formatDate(atleta.fechaObjetivo)}</strong>
                  </div>
                  <div>
                    <span className="field-label">Días restantes</span>
                    <strong>{atleta.diasRestantes}</strong>
                  </div>
                  <div>
                    <span className="field-label">Kilómetros semanales</span>
                    <strong>
                      {atleta.kilometrosHechos} / {atleta.kilometrosPlanificados} km
                    </strong>
                  </div>
                </div>

                <div className="athlete-card__footer">
                  <span className="field-label">{atleta.razonEstado || 'Prioridad de trabajo'}</span>
                  <div className="planificacion__actions">
                    <button
                      className="plan-button"
                      type="button"
                      onClick={() => onOpenPlanificacion?.(atleta.id)}
                      disabled={!atleta.id}
                    >
                      Ver planificación
                    </button>
                    <button
                      className="plan-button"
                      type="button"
                      onClick={() => onOpenHistorial?.(atleta.id)}
                      disabled={!atleta.id}
                    >
                      Ver historial
                    </button>
                  </div>
                </div>
              </article>
            ))}
            {/* Estado vacio: respuesta valida sin atletas activos. */}
            {!loading && !error && atletasOrdenados.length === 0 && (
              <p>No hay atletas activos para mostrar.</p>
            )}
          </div>

          <footer className="legend" aria-label="Leyenda de prioridades">
            <p className="field-label">Orden de prioridad</p>
            <ul>
              {leyendaPrioridad.map((item) => (
                <li className="legend__item" key={item.prioridad}>
                  <span
                    className={`legend__dot legend__dot--${item.color}`}
                    aria-hidden="true"
                  />
                  <span className="legend__text">
                    <strong>{item.prioridad}.</strong> {item.titulo}
                  </span>
                </li>
              ))}
            </ul>
          </footer>
        </section>
      </div>
    </main>
  )
}

export default Dashboard
