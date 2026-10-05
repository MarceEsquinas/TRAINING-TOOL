import { useState } from 'react'
import '../App.css'
import { loginUser } from '../services/authApi'

function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!username.trim() || !password) {
      setError('Introduce tu username y contraseña.')
      return
    }

    try {
      setLoading(true)
      const usuario = await loginUser({ username, password })
      onLoginSuccess?.(usuario)
    } catch (loginError) {
      if (loginError.status === 401) {
        setError('Usuario o contraseña incorrectos')
      } else if (loginError.status) {
        setError(loginError.message || 'No se pudo iniciar sesión')
      } else {
        setError('No se pudo conectar con el servidor.')
      }
    } finally {
      setLoading(false)
    }
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
          <button className="login-form__button" type="submit" disabled={loading}>
            {loading ? 'Validando...' : 'Iniciar sesión'}
          </button>
        </form>

        <p className="login-card__register">
          ¿No tienes cuenta? <a href="/register">Regístrate</a>
        </p>
      </section>
    </main>
  )
}

export default Login
