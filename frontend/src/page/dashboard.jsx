import { useEffect, useMemo, useState } from 'react'
import '../App.css'
import { fetchDashboard } from '../services/dashboardApi'
import { formatDate } from '../utils/dateFormat'
import AppLayout from '../layouts/appLayout.jsx'

function Dashboard({ onOpenPlanificacion, onOpenHistorial, onOpenFeedbackFromNotification }) {
  // Estado de pantalla: datos, carga en curso y posible error de red.
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

  // Conteo para la campana de notificaciones del header.
  const feedbackNuevos = useMemo(() => {
    return Number(dashboardData?.summary?.num_feedback_nuevos || 0)
  }, [dashboardData])

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
        fechaObjetivo: atleta.fecha_objetivo || '-',
        diasRestantes: Number(atleta.dias_hasta_objetivo ?? 0),
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
    <AppLayout
      headerProps={{
        trainerName: 'Pepito García',
        trainerRole: 'Entrenador',
        trainerHint: 'Vista rápida del trabajo de hoy en el club',
        notificationCount: feedbackNuevos,
        notifications,
        onOpenNotification: onOpenFeedbackFromNotification,
      }}
      sidebarProps={{
        activeModule: 'panelPrincipal',
      }}
    >
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
            <article
              className={`athlete-card${atleta.diasRestantes <= 0 ? ' athlete-card--objetivo-vencido' : ''}`}
              key={atleta.id || atleta.nombre}
            >
              <div className="athlete-card__header">
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
                  <span className="field-label">Fecha objetivo</span>
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
    </AppLayout>
  )
}

export default Dashboard