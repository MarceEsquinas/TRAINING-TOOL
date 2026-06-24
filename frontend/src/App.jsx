import './App.css'

function App() {
  // Datos de ejemplo del MVP para representar la carga de trabajo del entrenador.
  const atletas = [
    {
      nombre: 'Laura Martín',
      objetivo: 'Perder 3 kg',
      fechaObjetivo: '30/07/2026',
      diasRestantes: 36,
      kilometrosHechos: 18,
      kilometrosPlanificados: 24,
      estado: 'Feedback pendiente',
      estadoColor: 'rojo',
      prioridad: 1,
    },
    {
      nombre: 'Javier Ruiz',
      objetivo: 'Mejorar resistencia 10K',
      fechaObjetivo: '12/08/2026',
      diasRestantes: 49,
      kilometrosHechos: 22,
      kilometrosPlanificados: 26,
      estado: 'Planificación pendiente',
      estadoColor: 'amarillo',
      prioridad: 2,
    },
    {
      nombre: 'Marta López',
      objetivo: 'Preparar media maratón',
      fechaObjetivo: '03/09/2026',
      diasRestantes: 71,
      kilometrosHechos: 31,
      kilometrosPlanificados: 34,
      estado: 'Objetivo próximo',
      estadoColor: 'azul',
      prioridad: 3,
    },
    {
      nombre: 'Diego Sánchez',
      objetivo: 'Ganancia de fuerza general',
      fechaObjetivo: '20/10/2026',
      diasRestantes: 118,
      kilometrosHechos: 12,
      kilometrosPlanificados: 12,
      estado: 'Todo correcto',
      estadoColor: 'verde',
      prioridad: 4,
    },
  ]

  // Ordena los atletas para que el entrenador vea primero lo urgente.
  const atletasOrdenados = [...atletas].sort((a, b) => a.prioridad - b.prioridad)

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
                    <span className="field-label">Fecha del objetivo</span>
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
                  <span className="field-label">Prioridad de trabajo</span>
                  <button className="plan-button" type="button">
                    Ver planificación
                  </button>
                </div>
              </article>
            ))}
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

export default App
