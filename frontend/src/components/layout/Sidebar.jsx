import logoCas from '../../assets/CAS_3.jpeg'
import { useState } from 'react'
import { MENU_POR_ROL } from '../../utils/permisos.js'

const MODULOS = {
  dashboard: 'Dashboard',
  atletas: 'Atletas',
  administracion: 'Administración',
  planificacion: 'Planificación',
  historial: 'Historial',
  perfil: 'Perfil',
}

function Sidebar({ activeModule = 'dashboard', onNavigate, rol }) {
  const [logoLoadError, setLogoLoadError] = useState(false)
  const modulosVisibles = MENU_POR_ROL[rol] || []

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
        {modulosVisibles.map((moduleId) => (
          <button
            key={moduleId}
            className={`menu__item${activeModule === moduleId ? ' menu__item--active' : ''}`}
            type="button"
            onClick={() => onNavigate?.(moduleId)}
          >
            {MODULOS[moduleId]}
          </button>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar