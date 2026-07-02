import { useState } from 'react'
import Dashboard from './page/dashboard.jsx'
import Planificacion from './page/planificacion.jsx'
import Historial from './page/historial.jsx'
import FeedbackDetalle from './page/feedbackDetalle.jsx'

function App() {
  // Estado de navegación local: pantalla activa y atleta seleccionado.
  const [activeView, setActiveView] = useState('dashboard')
  const [selectedAtletaId, setSelectedAtletaId] = useState(null)
  const [selectedFeedbackId, setSelectedFeedbackId] = useState(null)

  // Navega a planificación usando el id del atleta pulsado en dashboard.
  function handleOpenPlanificacion(atletaId) {
    setSelectedAtletaId(atletaId)
    setSelectedFeedbackId(null)
    setActiveView('planificacion')
  }

  // Navega a historial usando el id del atleta pulsado en dashboard.
  function handleOpenHistorial(atletaId) {
    setSelectedAtletaId(atletaId)
    setSelectedFeedbackId(null)
    setActiveView('historial')
  }

  // Navega al detalle directo del feedback seleccionado en la campana.
  function handleOpenFeedbackFromNotification({ atletaId, feedbackId }) {
    setSelectedAtletaId(atletaId)
    setSelectedFeedbackId(feedbackId)
    setActiveView('feedbackDetalle')
  }

  // Vuelve al panel principal y limpia selección temporal.
  function handleBackToDashboard() {
    setActiveView('dashboard')
    setSelectedAtletaId(null)
    setSelectedFeedbackId(null)
  }

  function handleOpenHistorialFromFeedback() {
    if (!selectedAtletaId) {
      setActiveView('dashboard')
      return
    }

    setSelectedFeedbackId(null)
    setActiveView('historial')
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

  if (activeView === 'feedbackDetalle' && selectedFeedbackId) {
    return (
      <FeedbackDetalle
        feedbackId={selectedFeedbackId}
        onBack={handleBackToDashboard}
        onOpenHistorial={handleOpenHistorialFromFeedback}
      />
    )
  }

  return (
    <Dashboard
      onOpenPlanificacion={handleOpenPlanificacion}
      onOpenHistorial={handleOpenHistorial}
      onOpenFeedbackFromNotification={handleOpenFeedbackFromNotification}
    />
  )
}

export default App
