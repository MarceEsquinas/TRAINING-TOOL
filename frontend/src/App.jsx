import { useState } from 'react'
import Dashboard from './page/dashboard.jsx'
import Planificacion from './page/planificacion.jsx'
import Historial from './page/historial.jsx'

function App() {
  // Estado de navegación local: pantalla activa y atleta seleccionado.
  const [activeView, setActiveView] = useState('dashboard')
  const [selectedAtletaId, setSelectedAtletaId] = useState(null)

  // Navega a planificación usando el id del atleta pulsado en dashboard.
  function handleOpenPlanificacion(atletaId) {
    setSelectedAtletaId(atletaId)
    setActiveView('planificacion')
  }

  // Navega a historial usando el id del atleta pulsado en dashboard.
  function handleOpenHistorial(atletaId) {
    setSelectedAtletaId(atletaId)
    setActiveView('historial')
  }

  // Vuelve al panel principal y limpia selección temporal.
  function handleBackToDashboard() {
    setActiveView('dashboard')
    setSelectedAtletaId(null)
  }

  if (activeView === 'planificacion' && selectedAtletaId) {
    return (
      <Planificacion
        atletaId={selectedAtletaId}
        onBack={handleBackToDashboard}
      />
    )
  }

  if (activeView === 'historial' && selectedAtletaId) {
    return (
      <Historial
        atletaId={selectedAtletaId}
        onBack={handleBackToDashboard}
      />
    )
  }

  return (
    <Dashboard
      onOpenPlanificacion={handleOpenPlanificacion}
      onOpenHistorial={handleOpenHistorial}
    />
  )
}

export default App
