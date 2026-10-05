import { useEffect, useState } from 'react'
import { fetchPerfil, updatePerfil } from '../services/perfilApi'

const DIAS = [
  ['lunes', 'Lunes'],
  ['martes', 'Martes'],
  ['miercoles', 'Miércoles'],
  ['jueves', 'Jueves'],
  ['viernes', 'Viernes'],
  ['sabado', 'Sábado'],
  ['domingo', 'Domingo'],
]

function Perfil() {
  const [perfil, setPerfil] = useState(null)
  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  function toForm(data) {
    return {
      nombre: data.nombre || '',
      sexo: data.sexo || '',
      peso: data.peso ?? '',
      km_medios_ultimos_2_meses: data.km_medios_ultimos_2_meses ?? '',
      dias_disponibles: Array.isArray(data.dias_disponibles) ? data.dias_disponibles : [],
    }
  }

  useEffect(() => {
    let isMounted = true

    async function load() {
      try {
        const data = await fetchPerfil()
        if (isMounted) {
          setPerfil(data)
          setForm(toForm(data))
        }
      } catch (loadError) {
        if (isMounted) setError(loadError.message)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    load()
    return () => {
      isMounted = false
    }
  }, [])

  function setField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }))
    setSuccess('')
    setError('')
  }

  function toggleDia(dia) {
    const dias = form.dias_disponibles.includes(dia)
      ? form.dias_disponibles.filter((item) => item !== dia)
      : [...form.dias_disponibles, dia]
    setField('dias_disponibles', dias)
  }

  async function handleSave() {
    try {
      setSaving(true)
      setError('')
      setSuccess('')
      const data = await updatePerfil({
        nombre: form.nombre,
        sexo: form.sexo,
        peso: Number(form.peso),
        km_medios_ultimos_2_meses: Number(form.km_medios_ultimos_2_meses),
        dias_disponibles: form.dias_disponibles,
      })
      setPerfil(data)
      setForm(toForm(data))
      setSuccess('Perfil actualizado correctamente')
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="planificacion">
      <header className="planificacion__header">
        <h2>Mi perfil</h2>
        <p>Consulta tus datos y modifica los que puedes cambiar.</p>
      </header>

      {loading && <p>Cargando perfil...</p>}
      {error && <p>{error}</p>}

      {perfil && form && (
        <section className="planificacion__content">
          <article className="planificacion__card">
            <h3>Datos de la cuenta (solo lectura)</h3>
            <div className="planificacion__grid">
              <div>
                <span className="field-label">Username</span>
                <strong>{perfil.username}</strong>
              </div>
              <div>
                <span className="field-label">Email</span>
                <strong>{perfil.email}</strong>
              </div>
              <div>
                <span className="field-label">Entrenador</span>
                <strong>{perfil.entrenador_nombre || 'Sin asignar'}</strong>
              </div>
              <div>
                <span className="field-label">Lesiones del último año</span>
                <strong>
                  {Array.isArray(perfil.lesiones_ultimo_anio) && perfil.lesiones_ultimo_anio.length > 0
                    ? perfil.lesiones_ultimo_anio.map((lesion) => lesion.tipo).join(', ')
                    : 'Ninguna'}
                </strong>
              </div>
            </div>
          </article>

          <article className="planificacion__card">
            <h3>Datos personales</h3>
            <div className="planificacion__session-form-grid">
              <label className="planificacion__field" htmlFor="perfil-nombre">
                <span className="field-label">Nombre</span>
                <input
                  id="perfil-nombre"
                  type="text"
                  maxLength={100}
                  value={form.nombre}
                  onChange={(event) => setField('nombre', event.target.value)}
                />
              </label>

              <label className="planificacion__field" htmlFor="perfil-sexo">
                <span className="field-label">Sexo</span>
                <select
                  id="perfil-sexo"
                  value={form.sexo}
                  onChange={(event) => setField('sexo', event.target.value)}
                >
                  <option value="M">M</option>
                  <option value="F">F</option>
                  <option value="OTRO">Otro</option>
                </select>
              </label>

              <label className="planificacion__field" htmlFor="perfil-peso">
                <span className="field-label">Peso (kg)</span>
                <input
                  id="perfil-peso"
                  type="number"
                  min="0"
                  step="0.1"
                  value={form.peso}
                  onChange={(event) => setField('peso', event.target.value)}
                />
              </label>

              <label className="planificacion__field" htmlFor="perfil-km">
                <span className="field-label">Km medios por semana (últimos 2 meses)</span>
                <input
                  id="perfil-km"
                  type="number"
                  min="0"
                  step="0.1"
                  value={form.km_medios_ultimos_2_meses}
                  onChange={(event) => setField('km_medios_ultimos_2_meses', event.target.value)}
                />
              </label>
            </div>

            <fieldset className="planificacion__session-create">
              <legend className="field-label">Días disponibles</legend>
              {DIAS.map(([valor, etiqueta]) => (
                <label key={valor} className="planificacion__row-checkbox" htmlFor={`dia-${valor}`}>
                  <input
                    id={`dia-${valor}`}
                    type="checkbox"
                    checked={form.dias_disponibles.includes(valor)}
                    onChange={() => toggleDia(valor)}
                  />
                  <span>{etiqueta}</span>
                </label>
              ))}
            </fieldset>

            {success && <p className="planificacion__success">{success}</p>}
            <div className="planificacion__actions">
              <button className="planificacion__back" type="button" onClick={handleSave} disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </article>
        </section>
      )}
    </main>
  )
}

export default Perfil
