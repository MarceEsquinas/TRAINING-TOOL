import { useState } from 'react'
import '../App.css'
import { API_BASE_URL } from '../services/apiBaseUrl'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const DIAS_SEMANA = [
  { value: 'lunes', label: 'Lunes' },
  { value: 'martes', label: 'Martes' },
  { value: 'miercoles', label: 'Miércoles' },
  { value: 'jueves', label: 'Jueves' },
  { value: 'viernes', label: 'Viernes' },
  { value: 'sabado', label: 'Sábado' },
  { value: 'domingo', label: 'Domingo' },
]

// Recibe los datos del formulario y devuelve una lista de errores (vacía si todo es válido).
function validateRegisterForm({
  nombre,
  username,
  email,
  password,
  confirmPassword,
  peso,
  diasDisponibles,
  kmMedios,
  tuvoLesiones,
  lesiones,
}) {
  const errors = []

  if (!nombre.trim()) {
    errors.push('El nombre es obligatorio.')
  }

  if (!username.trim()) {
    errors.push('El username es obligatorio.')
  }

  if (!email.trim()) {
    errors.push('El email es obligatorio.')
  } else if (!EMAIL_REGEX.test(email)) {
    errors.push('El email no tiene un formato válido.')
  }

  if (!password) {
    errors.push('La password es obligatoria.')
  }

  if (!confirmPassword) {
    errors.push('Confirmar password es obligatorio.')
  }

  if (password && confirmPassword && password !== confirmPassword) {
    errors.push('La password y la confirmación no coinciden.')
  }

  if (!Number.isFinite(Number(peso)) || Number(peso) <= 0 || Number(peso) > 999.99) {
    errors.push('El peso debe ser un número entre 0 y 999,99 kg.')
  }

  if (diasDisponibles.length === 0) {
    errors.push('Selecciona al menos un día disponible.')
  }

  if (kmMedios === '' || !Number.isFinite(Number(kmMedios)) || Number(kmMedios) < 0 || Number(kmMedios) > 999.99) {
    errors.push('Los kilómetros medios deben ser un número entre 0 y 999,99.')
  }

  if (!tuvoLesiones) {
    errors.push('Indica si has tenido lesiones durante el último año.')
  } else if (tuvoLesiones === 'si' && !lesiones.trim()) {
    errors.push('Describe las lesiones del último año.')
  }

  return errors
}

function Register() {
  const [nombre, setNombre] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [peso, setPeso] = useState('')
  const [diasDisponibles, setDiasDisponibles] = useState([])
  const [kmMedios, setKmMedios] = useState('')
  const [tuvoLesiones, setTuvoLesiones] = useState('')
  const [lesiones, setLesiones] = useState('')
  const [errors, setErrors] = useState([])
  const [responseMessage, setResponseMessage] = useState(null)
  const [loading, setLoading] = useState(false)

  function handleDayChange(day) {
    setDiasDisponibles((currentDays) => (
      currentDays.includes(day)
        ? currentDays.filter((currentDay) => currentDay !== day)
        : [...currentDays, day]
    ))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const validationErrors = validateRegisterForm({
      nombre,
      username,
      email,
      password,
      confirmPassword,
      peso,
      diasDisponibles,
      kmMedios,
      tuvoLesiones,
      lesiones,
    })

    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      setResponseMessage(null)
      return
    }

    setErrors([])
    setResponseMessage(null)

    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre,
          username,
          email,
          password,
          peso: Number(peso),
          dias_disponibles: diasDisponibles,
          km_medios_ultimos_2_meses: Number(kmMedios),
          lesiones_ultimo_anio: tuvoLesiones === 'si' ? [{ tipo: lesiones.trim() }] : [],
        }),
      })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'No se pudo crear la cuenta.')
      }

      setResponseMessage({ type: 'success', text: result.message || 'Cuenta creada correctamente.' })
    } catch (error) {
      setResponseMessage({ type: 'error', text: error.message || 'No se pudo conectar con el servidor.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-card register-card" aria-labelledby="register-title">
        <p className="login-card__eyebrow">Training Tool</p>
        <h1 id="register-title" className="login-card__title">Crear cuenta</h1>
        <p className="login-card__subtitle">
          Regístrate para empezar a entrenar con nosotros.
        </p>

        <form className="login-form register-form" onSubmit={handleSubmit}>
          <label className="register-form__field">
            <span className="login-form__label">Nombre</span>
            <input
              className="login-form__input"
              type="text"
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
              disabled={loading}
              required
            />
          </label>

          <label className="register-form__field">
            <span className="login-form__label">Username</span>
            <input
              className="login-form__input"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              disabled={loading}
              required
            />
          </label>

          <label className="register-form__field">
            <span className="login-form__label">Email</span>
            <input
              className="login-form__input"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={loading}
              required
            />
          </label>

          <label className="register-form__field">
            <span className="login-form__label">Contraseña</span>
            <input
              className="login-form__input"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={loading}
              required
            />
          </label>

          <label className="register-form__field">
            <span className="login-form__label">Confirmar contraseña</span>
            <input
              className="login-form__input"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              disabled={loading}
              required
            />
          </label>

          <label className="register-form__field">
            <span className="login-form__label">Peso (kg)</span>
            <input
              className="login-form__input"
              type="number"
              min="0.1"
              max="999.99"
              step="0.1"
              value={peso}
              onChange={(event) => setPeso(event.target.value)}
              disabled={loading}
              required
            />
          </label>

          <label className="register-form__field">
            <span className="login-form__label">Kilómetros medios por semana (últimos 2 meses)</span>
            <input
              className="login-form__input"
              type="number"
              min="0"
              max="999.99"
              step="0.1"
              value={kmMedios}
              onChange={(event) => setKmMedios(event.target.value)}
              disabled={loading}
              required
            />
          </label>

          <fieldset className="register-form__group">
            <legend className="login-form__label">Días disponibles para entrenar</legend>
            <div className="register-form__days">
              {DIAS_SEMANA.map((day) => (
                <label className="register-form__option" key={day.value}>
                  <input
                    type="checkbox"
                    checked={diasDisponibles.includes(day.value)}
                    onChange={() => handleDayChange(day.value)}
                    disabled={loading}
                  />
                  {day.label}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="register-form__group">
            <legend className="login-form__label">¿Has tenido lesiones durante el último año?</legend>
            <div className="register-form__options">
              <label className="register-form__option">
                <input
                  type="radio"
                  name="tuvoLesiones"
                  value="no"
                  checked={tuvoLesiones === 'no'}
                  onChange={(event) => setTuvoLesiones(event.target.value)}
                  disabled={loading}
                  required
                />
                No
              </label>
              <label className="register-form__option">
                <input
                  type="radio"
                  name="tuvoLesiones"
                  value="si"
                  checked={tuvoLesiones === 'si'}
                  onChange={(event) => setTuvoLesiones(event.target.value)}
                  disabled={loading}
                  required
                />
                Sí
              </label>
            </div>
            {tuvoLesiones === 'si' ? (
              <label className="register-form__field register-form__injury">
                <span className="login-form__label">Describe las lesiones</span>
                <textarea
                  className="login-form__input register-form__textarea"
                  value={lesiones}
                  onChange={(event) => setLesiones(event.target.value)}
                  disabled={loading}
                  required
                />
              </label>
            ) : null}
          </fieldset>

          {errors.length > 0 ? (
            <ul className="login-form__error register-form__message">
              {errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          ) : null}
          {responseMessage ? (
            <p className={`register-form__message ${responseMessage.type === 'error' ? 'login-form__error' : 'login-form__info'}`}>
              {responseMessage.text}
            </p>
          ) : null}

          <button className="login-form__button register-form__submit" type="submit" disabled={loading}>
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>
        <p className="login-card__register">
          <a href="/">Volver al acceso</a>
        </p>
      </section>
    </main>
  )
}

export default Register
