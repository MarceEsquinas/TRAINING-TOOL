import { useEffect, useMemo, useState } from 'react'
import '../App.css'
import { fetchDashboard } from '../services/dashboardApi'

function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
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

  const atletas = useMemo(() => dashboardData?.atletas || [], [dashboardData])

  const atletasUI = useMemo(() => {
    return atletas.map((atleta) => {
      const estadoPrioritario = atleta.estado_prioritario || 'ok'
      const colorByEstado = {
        planificacion_pendiente: 'amarillo',
        objetivo_proximo: 'azul',
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
        nombre: atleta.nombre || atleta.atleta_nombre,
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
            CAS
          </div>
          <div>
            <p className="eyebrow">Club Atletismo Seseña</p>
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

          <div className="notifications" aria-label="Notificaciones futuras">
            Espacio para notificaciones
          </div>
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

          {loading && <p>Cargando dashboard...</p>}
          {error && !loading && <p>{error}</p>}

          <div className="athletes-list">
            {atletasOrdenados.map((atleta) => (
              <article className="athlete-card" key={atleta.nombre}>
                <div className="athlete-card__head">
                  <div>
                    <h3>{atleta.nombre}</h3>
                    <p className="athlete-card__objective">{atleta.objetivo}</p>
                  </div>
                  <span className={`status-pill status-pill--${atleta.estadoColor}`}>
                    {atleta.estado}
                  </span>
                </div>

                <div className="athlete-card__grid">
                  <div>
                    <span className="field-label">Semana (fin)</span>
                    <strong>{atleta.fechaObjetivo}</strong>
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
                  <button className="plan-button" type="button">
                    Ver planificación
                  </button>
                </div>
              </article>
            ))}
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
