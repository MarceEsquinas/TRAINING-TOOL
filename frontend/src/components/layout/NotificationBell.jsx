import { useState } from 'react'
import { formatDate } from '../../utils/dateFormat'

function NotificationBell({ notifications = [], notificationCount = 0, onOpenNotification }) {
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  const feedbackBadge = notificationCount > 9 ? '9+' : String(notificationCount)

  function handleOpenNotification(notification) {
    const atletaId = Number(notification?.atleta_id)
    const feedbackId = Number(notification?.id)

    if (!atletaId || !feedbackId) {
      return
    }

    setNotificationsOpen(false)
    onOpenNotification?.({ atletaId, feedbackId })
  }

  return (
    <>
      <button
        className="notifications"
        type="button"
        aria-label={`Notificaciones (${notificationCount} pendientes)`}
        aria-expanded={notificationsOpen}
        onClick={() => setNotificationsOpen((prev) => !prev)}
      >
        <span className="notifications__bell" aria-hidden="true" />
        <span className="notifications__text">Notificaciones</span>
        {notificationCount > 0 && (
          <span className="notifications__badge" aria-hidden="true">
            {feedbackBadge}
          </span>
        )}
      </button>

      {notificationsOpen && (
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
    </>
  )
}

export default NotificationBell