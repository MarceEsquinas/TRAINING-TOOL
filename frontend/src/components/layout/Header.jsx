import NotificationBell from './NotificationBell.jsx'
import trainerAvatar from '../../assets/trainer-avatar.svg'

function Header({
  trainerName = 'Pepito García',
  trainerRole = 'Entrenador',
  trainerHint = 'Vista rápida del trabajo de hoy en el club',
  trainerPhotoSrc = trainerAvatar,
  notificationCount = 0,
  notifications = [],
  onOpenNotification,
}) {
  return (
    <header className="topbar">
      <div className="trainer">
        <div className="trainer__avatar" aria-hidden="true">
          <img className="trainer__avatar-image" src={trainerPhotoSrc} alt="" />
        </div>
        <div>
          <p className="eyebrow">{trainerRole}: {trainerName}</p>
          <p className="topbar__hint">{trainerHint}</p>
        </div>
      </div>

      <NotificationBell
        notifications={notifications}
        notificationCount={notificationCount}
        onOpenNotification={onOpenNotification}
      />
    </header>
  )
}

export default Header