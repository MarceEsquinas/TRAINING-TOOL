import { useEffect, useMemo, useState } from 'react'
import {
  autoasignarAtletaAdmin,
  createEntrenadorAdmin,
  fetchAtletasAdmin,
  fetchEntrenadoresAdmin,
  reasignarAtletaAdmin,
  resetPasswordTemporalAtletaAdmin,
  resetPasswordTemporalEntrenadorAdmin,
  updateAtletaAdmin,
  updateEntrenadorAdmin,
} from '../services/administracionApi'

function Administracion() {
  const [entrenadores, setEntrenadores] = useState([])
  const [atletas, setAtletas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [nuevoEntrenador, setNuevoEntrenador] = useState({ nombre: '', correo: '', password: '' })
  const [editEntrenadorById, setEditEntrenadorById] = useState({})
  const [editAtletaById, setEditAtletaById] = useState({})
  const [asignacionByAtletaId, setAsignacionByAtletaId] = useState({})

  // Carga única del módulo por entidades para mantener una vista administrativa coherente.
  async function loadAdministracion(options = {}) {
    const { showLoader = true, clearMessages = true } = options

    try {
      if (showLoader) {
        setLoading(true)
      }
      if (clearMessages) {
        setError('')
      }

      const [entrenadoresData, atletasData] = await Promise.all([
        fetchEntrenadoresAdmin(),
        fetchAtletasAdmin(),
      ])

      setEntrenadores(entrenadoresData)
      setAtletas(atletasData)
    } catch (loadError) {
      setError(loadError.message || 'No se pudo cargar administración')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let isMounted = true

    async function initialLoad() {
      try {
        const [entrenadoresData, atletasData] = await Promise.all([
          fetchEntrenadoresAdmin(),
          fetchAtletasAdmin(),
        ])

        if (!isMounted) {
          return
        }

        setEntrenadores(entrenadoresData)
        setAtletas(atletasData)
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message || 'No se pudo cargar administración')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    initialLoad()

    return () => {
      isMounted = false
    }
  }, [])

  const atletasPendientes = useMemo(() => {
    // Regla visible en UI: pendiente = atleta sin entrenador asignado.
    return atletas.filter((atleta) => atleta.entrenador_id === null)
  }, [atletas])

  function handleNuevoEntrenadorChange(field, value) {
    setNuevoEntrenador((prev) => ({ ...prev, [field]: value }))
  }

  async function handleCrearEntrenador() {
    try {
      setError('')
      setSuccess('')
      await createEntrenadorAdmin(nuevoEntrenador)
      setSuccess('Entrenador creado correctamente')
      setNuevoEntrenador({ nombre: '', correo: '', password: '' })
      await loadAdministracion()
    } catch (createError) {
      setError(createError.message || 'No se pudo crear el entrenador')
    }
  }

  function getEditEntrenadorState(entrenador) {
    const cached = editEntrenadorById[entrenador.id]
    if (cached) {
      return cached
    }

    return {
      nombre: entrenador.nombre || '',
      correo: entrenador.correo || '',
      passwordTemporal: '',
    }
  }

  function handleEditEntrenadorField(entrenadorId, field, value) {
    const entrenadorActual = entrenadores.find((item) => Number(item.id) === Number(entrenadorId))

    setEditEntrenadorById((prev) => ({
      ...prev,
      [entrenadorId]: {
        ...(prev[entrenadorId] || {
          nombre: entrenadorActual?.nombre || '',
          correo: entrenadorActual?.correo || '',
          passwordTemporal: '',
        }),
        [field]: value,
      },
    }))
  }

  async function handleGuardarEntrenador(entrenador) {
    const state = getEditEntrenadorState(entrenador)
    try {
      setError('')
      setSuccess('')

      const payload = {
        nombre: state.nombre,
        correo: state.correo,
      }

      await updateEntrenadorAdmin(entrenador.id, payload)
      setSuccess(`Entrenador ${entrenador.nombre} actualizado correctamente`)
      await loadAdministracion()
    } catch (updateError) {
      setError(updateError.message || 'No se pudo actualizar el entrenador')
    }
  }

  async function handleResetPasswordEntrenador(entrenador) {
    const state = getEditEntrenadorState(entrenador)
    const nuevaPassword = state.passwordTemporal

    if (!nuevaPassword || String(nuevaPassword).trim() === '') {
      setError('Debes indicar una contraseña temporal para el entrenador')
      return
    }

    try {
      setError('')
      setSuccess('')
      await resetPasswordTemporalEntrenadorAdmin(entrenador.id, String(nuevaPassword).trim())
      setSuccess(`Contraseña temporal actualizada para el entrenador ${entrenador.nombre}`)
      setEditEntrenadorById((prev) => ({
        ...prev,
        [entrenador.id]: {
          ...getEditEntrenadorState(entrenador),
          passwordTemporal: '',
        },
      }))
      await loadAdministracion()
    } catch (resetError) {
      setError(resetError.message || 'No se pudo resetear la contraseña del entrenador')
    }
  }

  function handleSetAsignacion(atletaId, entrenadorId) {
    setAsignacionByAtletaId((prev) => ({
      ...prev,
      [atletaId]: entrenadorId,
    }))
  }

  async function handleAsignarPendiente(atletaId) {
    const entrenadorId = asignacionByAtletaId[atletaId]
    if (!entrenadorId) {
      setError('Selecciona un entrenador para asignar el atleta pendiente')
      return
    }

    try {
      setError('')
      setSuccess('')
      // Autoasignación controlada: sólo sobre atletas pendientes.
      await autoasignarAtletaAdmin(atletaId, Number(entrenadorId))
      setSuccess('Atleta pendiente asignado correctamente')
      await loadAdministracion()
    } catch (assignError) {
      setError(assignError.message || 'No se pudo asignar el atleta pendiente')
    }
  }

  async function handleReasignar(atletaId) {
    const entrenadorId = asignacionByAtletaId[atletaId]
    if (!entrenadorId) {
      setError('Selecciona un entrenador para reasignar el atleta')
      return
    }

    try {
      setError('')
      setSuccess('')
      // Reasignación administrativa explícita (flujo distinto al de autoasignación).
      await reasignarAtletaAdmin(atletaId, Number(entrenadorId))
      setSuccess('Atleta reasignado correctamente')
      await loadAdministracion()
    } catch (assignError) {
      setError(assignError.message || 'No se pudo reasignar el atleta')
    }
  }

  function getEditAtletaState(atleta) {
    const cached = editAtletaById[atleta.id]
    if (cached) {
      return cached
    }

    return {
      nombre: atleta.nombre || '',
      sexo: atleta.sexo || '',
      peso: atleta.peso ?? '',
      passwordTemporal: '',
    }
  }

  function handleEditAtletaField(atletaId, field, value) {
    const atletaActual = atletas.find((item) => Number(item.id) === Number(atletaId))

    setEditAtletaById((prev) => ({
      ...prev,
      [atletaId]: {
        ...(prev[atletaId] || {
          nombre: atletaActual?.nombre || '',
          sexo: atletaActual?.sexo || '',
          peso: atletaActual?.peso ?? '',
          passwordTemporal: '',
        }),
        [field]: value,
      },
    }))
  }

  async function handleGuardarAtleta(atleta) {
    const state = getEditAtletaState(atleta)

    try {
      setError('')
      setSuccess('')

      const payload = {
        nombre: state.nombre,
        sexo: state.sexo || null,
        peso: state.peso === '' ? null : Number(state.peso),
      }

      await updateAtletaAdmin(atleta.id, payload)
      setSuccess(`Atleta ${atleta.nombre} actualizado correctamente`)
      await loadAdministracion()
    } catch (updateError) {
      setError(updateError.message || 'No se pudo actualizar el atleta')
    }
  }

  async function handleResetPasswordAtleta(atleta) {
    const state = getEditAtletaState(atleta)
    const nuevaPassword = state.passwordTemporal
    if (!nuevaPassword || String(nuevaPassword).trim() === '') {
      setError('Debes indicar una contraseña temporal para el atleta')
      return
    }

    try {
      setError('')
      setSuccess('')
      // Contraseña temporal: backend la guarda como hash y no devuelve secretos.
      await resetPasswordTemporalAtletaAdmin(atleta.id, String(nuevaPassword).trim())
      setSuccess(`Contraseña temporal actualizada para el atleta ${atleta.nombre}`)
      setEditAtletaById((prev) => ({
        ...prev,
        [atleta.id]: {
          ...getEditAtletaState(atleta),
          passwordTemporal: '',
        },
      }))
      await loadAdministracion()
    } catch (resetError) {
      setError(resetError.message || 'No se pudo resetear la contraseña del atleta')
    }
  }

  return (
    <section className="main-panel" aria-labelledby="modulo-administracion">
      <div className="panel-header">
        <h2 id="modulo-administracion">Administración</h2>
        <p className="panel-header__subtitle">Gestión por entidades: Entrenadores y Atletas.</p>
      </div>

      {loading && <p>Cargando administración...</p>}
      {error && !loading && <p>{error}</p>}
      {success && !loading && <p className="planificacion__success">{success}</p>}

      {!loading && (
        <div className="admin-grid">
          <article className="admin-card">
            <h3>Entrenadores</h3>
            <p className="module-note">Solo se muestra el nombre. Haz clic en un entrenador para desplegar sus acciones.</p>

            <div className="admin-form-grid">
              <input
                className="planificacion__row-input"
                type="text"
                placeholder="Nombre"
                value={nuevoEntrenador.nombre}
                onChange={(event) => handleNuevoEntrenadorChange('nombre', event.target.value)}
              />
              <input
                className="planificacion__row-input"
                type="email"
                placeholder="Correo"
                value={nuevoEntrenador.correo}
                onChange={(event) => handleNuevoEntrenadorChange('correo', event.target.value)}
              />
              <input
                className="planificacion__row-input"
                type="password"
                placeholder="Contraseña inicial"
                value={nuevoEntrenador.password}
                onChange={(event) => handleNuevoEntrenadorChange('password', event.target.value)}
              />
              <button className="plan-button" type="button" onClick={handleCrearEntrenador}>
                Crear entrenador
              </button>
            </div>

            <ul className="admin-list">
              {entrenadores.map((entrenador) => {
                const editState = getEditEntrenadorState(entrenador)

                return (
                  <li className="admin-list__item" key={entrenador.id}>
                    <details className="admin-accordion-item">
                      <summary className="admin-accordion-item__summary">
                        <span>{entrenador.nombre}</span>
                        <span className="module-note">#{entrenador.id}</span>
                      </summary>

                      <div className="admin-accordion-item__content">
                        <input
                          className="planificacion__row-input"
                          type="text"
                          value={editState.nombre}
                          onChange={(event) => handleEditEntrenadorField(entrenador.id, 'nombre', event.target.value)}
                        />
                        <input
                          className="planificacion__row-input"
                          type="email"
                          value={editState.correo}
                          onChange={(event) => handleEditEntrenadorField(entrenador.id, 'correo', event.target.value)}
                        />
                        <input
                          className="planificacion__row-input"
                          type="password"
                          placeholder="Nueva contraseña temporal"
                          value={editState.passwordTemporal}
                          onChange={(event) => handleEditEntrenadorField(entrenador.id, 'passwordTemporal', event.target.value)}
                        />
                        <button className="plan-button" type="button" onClick={() => handleGuardarEntrenador(entrenador)}>
                          Guardar
                        </button>
                        <button className="plan-button" type="button" onClick={() => handleResetPasswordEntrenador(entrenador)}>
                          Resetear contraseña
                        </button>
                      </div>
                    </details>
                  </li>
                )
              })}
            </ul>
          </article>

          <article className="admin-card">
            <h3>Atletas</h3>
            <p className="module-note">Solo se muestra el nombre. Haz clic en un atleta para desplegar sus acciones.</p>
            <h4>Total: {atletas.length} | Pendientes: {atletasPendientes.length}</h4>
            <ul className="admin-list">
              {atletas.map((atleta) => {
                const editState = getEditAtletaState(atleta)
                const esPendiente = atleta.entrenador_id === null

                return (
                  <li className="admin-list__item" key={atleta.id}>
                    <details className="admin-accordion-item">
                      <summary className="admin-accordion-item__summary">
                        <span>{atleta.nombre}</span>
                        <span className="module-note">{esPendiente ? 'Pendiente' : 'Asignado'}</span>
                      </summary>

                      <div className="admin-accordion-item__content">
                        <span className="module-note">
                          Entrenador actual: {atleta.entrenador_nombre || 'Pendiente'}
                        </span>

                        <input
                          className="planificacion__row-input"
                          type="text"
                          value={editState.nombre}
                          onChange={(event) => handleEditAtletaField(atleta.id, 'nombre', event.target.value)}
                        />
                        <select
                          className="planificacion__row-input"
                          value={editState.sexo || ''}
                          onChange={(event) => handleEditAtletaField(atleta.id, 'sexo', event.target.value)}
                        >
                          <option value="">Sin definir</option>
                          <option value="M">M</option>
                          <option value="F">F</option>
                          <option value="OTRO">OTRO</option>
                        </select>
                        <input
                          className="planificacion__row-input"
                          type="number"
                          min="0"
                          step="0.1"
                          placeholder="Peso (kg)"
                          value={editState.peso}
                          onChange={(event) => handleEditAtletaField(atleta.id, 'peso', event.target.value)}
                        />
                        <button className="plan-button" type="button" onClick={() => handleGuardarAtleta(atleta)}>
                          Guardar atleta
                        </button>

                        <select
                          className="planificacion__row-input"
                          value={asignacionByAtletaId[atleta.id] || ''}
                          onChange={(event) => handleSetAsignacion(atleta.id, event.target.value)}
                        >
                          <option value="">Seleccionar entrenador</option>
                          {entrenadores.map((entrenador) => (
                            <option key={entrenador.id} value={entrenador.id}>{entrenador.nombre}</option>
                          ))}
                        </select>
                        <button
                          className="plan-button"
                          type="button"
                          onClick={() => (esPendiente ? handleAsignarPendiente(atleta.id) : handleReasignar(atleta.id))}
                        >
                          {esPendiente ? 'Asignar' : 'Reasignar'}
                        </button>

                        <input
                          className="planificacion__row-input"
                          type="password"
                          placeholder="Nueva contraseña temporal"
                          value={editState.passwordTemporal}
                          onChange={(event) => handleEditAtletaField(atleta.id, 'passwordTemporal', event.target.value)}
                        />
                        <button className="plan-button" type="button" onClick={() => handleResetPasswordAtleta(atleta)}>
                          Resetear contraseña
                        </button>
                      </div>
                    </details>
                  </li>
                )
              })}
            </ul>
          </article>
        </div>
      )}
    </section>
  )
}

export default Administracion
