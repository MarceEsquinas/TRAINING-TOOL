import { useState } from 'react'
import '../App.css'
import { loginUser } from '../services/authApi'

function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setInfo('')

    try {
      setLoading(true)
      const usuario = await loginUser({ username, password })
      onLoginSuccess?.(usuario)
    } catch (loginError) {
      setError(loginError.message || 'No se pudo iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  function handleRegisterClick(event) {
    event.preventDefault()
    setInfo('Registro pendiente: se implementará en el siguiente bloque.')
  }

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <p className="login-card__eyebrow">Training Tool</p>
        <h1 id="login-title" className="login-card__title">Iniciar sesión</h1>
        <p className="login-card__subtitle">
          Introduce tu username y contraseña para acceder al panel.
        </p>

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="login-form__label" htmlFor="username">
            Username
          </label>
          <input
            id="username"
            className="login-form__input"
            type="text"
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            disabled={loading}
            required
          />

          <label className="login-form__label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            className="login-form__input"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={loading}
            required
          />

          {error ? <p className="login-form__error">{error}</p> : null}
          {info ? <p className="login-form__info">{info}</p> : null}

          <button className="login-form__button" type="submit" disabled={loading}>
            {loading ? 'Validando...' : 'Iniciar sesión'}
          </button>
        </form>

        <p className="login-card__register">
          ¿Aún no tienes cuenta?{' '}
          <a href="#" onClick={handleRegisterClick}>Registrarse</a>
        </p>
      </section>
    </main>
  )
}

export default Login
