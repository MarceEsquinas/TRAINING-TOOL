import { useState } from 'react'
import Dashboard from './page/dashboard.jsx'
import Atletas from './page/atletas.jsx'
import Administracion from './page/administracion.jsx'
import Planificacion from './page/planificacion.jsx'
import Historial from './page/historial.jsx'
import FeedbackDetalle from './page/feedbackDetalle.jsx'
import AppLayout from './layouts/appLayout.jsx'

function App() {
  // Módulo activo del layout principal.
  const [activeModule, setActiveModule] = useState('dashboard')
  // Estado de navegación local del módulo Atletas.
  const [activeView, setActiveView] = useState('dashboard')
  const [selectedAtletaId, setSelectedAtletaId] = useState(null)
  const [selectedFeedbackId, setSelectedFeedbackId] = useState(null)
  const [headerNotifications, setHeaderNotifications] = useState([])
  const [headerNotificationCount, setHeaderNotificationCount] = useState(0)

  // Navega a planificación usando el id del atleta pulsado en dashboard.
  function handleOpenPlanificacion(atletaId) {
    setActiveModule('atletas')
    setSelectedAtletaId(atletaId)
    setSelectedFeedbackId(null)
    setActiveView('planificacion')
  }

  // Navega a historial usando el id del atleta pulsado en dashboard.
  function handleOpenHistorial(atletaId) {
    setActiveModule('atletas')
    setSelectedAtletaId(atletaId)
    setSelectedFeedbackId(null)
    setActiveView('historial')
  }

  // Navega al detalle directo del feedback seleccionado en la campana del header.
  function handleOpenFeedbackFromHeader({ atletaId, feedbackId }) {
    setActiveModule('atletas')
    setSelectedAtletaId(atletaId)
    setSelectedFeedbackId(feedbackId)
    setActiveView('feedbackDetalle')
  }

  // Vuelve al panel principal y limpia selección temporal.
  function handleBackToDashboard() {
    setActiveModule('dashboard')
    setActiveView('dashboard')
    setSelectedAtletaId(null)
    setSelectedFeedbackId(null)
  }

  function handleOpenHistorialFromFeedback() {
    if (!selectedAtletaId) {
      setActiveModule('dashboard')
      setActiveView('dashboard')
      return
    }

    setActiveModule('atletas')
    setSelectedFeedbackId(null)
    setActiveView('historial')
  }

  function handleNavigateModule(moduleId) {
    if (moduleId === 'dashboard') {
      setActiveModule('dashboard')
      setActiveView('dashboard')
      return
    }

    if (moduleId === 'atletas') {
      setActiveModule('atletas')
      setActiveView('atletasHome')
      return
    }

    setActiveModule('administracion')
    setActiveView('administracion')
  }

  function handleHeaderNotificationsChange({ notificationCount, notifications }) {
    setHeaderNotificationCount(Number(notificationCount || 0))
    setHeaderNotifications(Array.isArray(notifications) ? notifications : [])
  }

  function renderMainContent() {
    if (activeModule === 'dashboard') {
      return (
        <Dashboard
          onOpenPlanificacion={handleOpenPlanificacion}
          onOpenHistorial={handleOpenHistorial}
          onHeaderNotificationsChange={handleHeaderNotificationsChange}
        />
      )
    }

    if (activeModule === 'administracion') {
      return <Administracion />
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
      <Atletas
        onOpenPlanificacion={handleOpenPlanificacion}
        onOpenHistorial={handleOpenHistorial}
      />
    )
  }

  return (
    <AppLayout
      headerProps={{
        trainerName: 'Pepito García',
        trainerRole: 'Entrenador',
        trainerHint: 'Vista rápida del trabajo de hoy en el club',
        notificationCount: headerNotificationCount,
        notifications: headerNotifications,
        onOpenNotification: handleOpenFeedbackFromHeader,
      }}
      sidebarProps={{
        activeModule,
        onNavigate: handleNavigateModule,
      }}
    >
      {renderMainContent()}
    </AppLayout>
  )
}

export default App
