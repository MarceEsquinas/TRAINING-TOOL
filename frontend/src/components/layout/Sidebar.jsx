import logoCas from '../../assets/CAS_3.jpeg'
import { useState } from 'react'

function Sidebar({ activeModule = 'dashboard', onNavigate }) {
  const [logoLoadError, setLogoLoadError] = useState(false)

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
          className={`menu__item${activeModule === 'dashboard' ? ' menu__item--active' : ''}`}
          type="button"
          onClick={() => onNavigate?.('dashboard')}
        >
          Dashboard
        </button>

        <button
          className={`menu__item${activeModule === 'atletas' ? ' menu__item--active' : ''}`}
          type="button"
          onClick={() => onNavigate?.('atletas')}
        >
          Atletas
        </button>

        <button
          className={`menu__item${activeModule === 'administracion' ? ' menu__item--active' : ''}`}
          type="button"
          onClick={() => onNavigate?.('administracion')}
        >
          Administración
        </button>
      </nav>
    </aside>
  )
}

export default Sidebar