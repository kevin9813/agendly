import { useEffect, useState } from 'react'

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/'

function NegocioPage({ user }) {
  const [negocio, setNegocio] = useState(null)
  const [barrios, setBarrios] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    direccion: '',
    tel: '',
    whatsapp: '',
    barrio_id: '',
    horario: '',
    ciudad_id: '',
    permite_agendar: false,
  })

  useEffect(() => {
    loadNegocio()
    loadBarrios()
  }, [user])

  const loadBarrios = async () => {
    try {
      const response = await fetch(`${apiUrl}barrios/`)
      if (response.ok) {
        const data = await response.json()
        setBarrios(data.barrios || [])
      }
    } catch (error) {
      console.error('Error loading barrios:', error)
    }
  }

  const loadNegocio = async () => {
    if (!user?.negocio_id) {
      setLoading(false)
      return
    }

    try {
      const response = await fetch(`${apiUrl}negocios/${user.negocio_id}/`)
      if (response.ok) {
        const data = await response.json()
        setNegocio(data)
        setFormData({
          name: data.name,
          direccion: data.direccion,
          tel: data.tel,
          whatsapp: data.whatsapp || '',
          barrio_id: data.barrio_id ? data.barrio_id.toString() : '',
          horario: data.horario,
          ciudad_id: data.ciudad_id ? data.ciudad_id.toString() : '',
          permite_agendar: data.permite_agendar || false,
        })
      } else {
        setMessage('Error al cargar la información del negocio')
      }
    } catch (error) {
      console.error('Error loading negocio:', error)
      setMessage('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      const barrioId = formData.barrio_id ? parseInt(formData.barrio_id) : null
      const ciudadId = (barrios.find(b => b.id.toString() === formData.barrio_id)?.ciudad_id) || (formData.ciudad_id ? parseInt(formData.ciudad_id) : null)
      const response = await fetch(`${apiUrl}negocios/${user.negocio_id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          barrio_id: barrioId,
          ciudad_id: ciudadId,
        }),
      })

      if (response.ok) {
        setMessage('Negocio actualizado correctamente')
        await loadNegocio()
        setEditing(false)
        setTimeout(() => setMessage(''), 3000)
      } else {
        const error = await response.json()
        setMessage(`Error: ${error.detail || 'Error desconocido'}`)
      }
    } catch (error) {
      console.error('Error saving negocio:', error)
      setMessage('Error al guardar los cambios')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditing(false)
    setFormData({
      name: negocio.name,
      direccion: negocio.direccion,
      tel: negocio.tel,
      whatsapp: negocio.whatsapp || '',
      barrio_id: negocio.barrio_id ? negocio.barrio_id.toString() : '',
      horario: negocio.horario,
      ciudad_id: negocio.ciudad_id ? negocio.ciudad_id.toString() : '',
    })
  }

  if (loading) {
    return (
      <div>
        <h1>Negocio</h1>
        <p>Cargando información...</p>
      </div>
    )
  }

  if (!negocio) {
    return (
      <div>
        <h1>Negocio</h1>
        <p>No se encontró información del negocio</p>
      </div>
    )
  }

  return (
    <div className="negocio-page">
      <div className="dashboard-topbar">
        <div>
          <p className="eyebrow">Configuración</p>
          <h1>Información del Negocio</h1>
        </div>
        <div className="topbar-actions">
          {!editing && (
            <button className="btn-primary" onClick={() => setEditing(true)}>
              Editar
            </button>
          )}
        </div>
      </div>

      {message && (
        <div className={`alert ${message.includes('Error') ? 'alert-error' : 'alert-success'}`}>
          {message}
        </div>
      )}

      {!editing ? (
        <div className="negocio-view">
          <div className="card">
            <div className="card-content">
              <div className="info-group">
                <label>Nombre del Negocio</label>
                <p>{negocio.name}</p>
              </div>

              <div className="info-group">
                <label>Dirección</label>
                <p>{negocio.direccion || 'No especificada'}</p>
              </div>

              <div className="info-group">
                <label>Barrio</label>
                <p>{negocio.barrio || 'No especificado'}</p>
              </div>

              <div className="info-group">
                <label>Teléfono</label>
                <p>{negocio.tel || 'No especificado'}</p>
              </div>

              <div className="info-group">
                <label>WhatsApp del negocio</label>
                <p>{negocio.whatsapp || 'No especificado'}</p>
              </div>

              <div className="info-group">
                <label>Ciudad</label>
                <p>{negocio.ciudad || 'No especificada'}</p>
              </div>

              <div className="info-group">
                <label>Horario</label>
                <p style={{ whiteSpace: 'pre-wrap' }}>
                  {negocio.horario || 'No especificado'}
                </p>
              </div>

              <div className="info-group">
                <label>Permitir agendar cliente</label>
                <p>{negocio.permite_agendar ? 'Sí' : 'No'}</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="negocio-form">
          <div className="card">
            <div className="form-group">
              <label htmlFor="name">Nombre del Negocio *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="direccion">Dirección</label>
              <input
                type="text"
                id="direccion"
                name="direccion"
                value={formData.direccion}
                onChange={handleChange}
                className="form-input"
                placeholder="Ej: Calle Principal 123"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="barrio_id">Barrio</label>
                <select
                  id="barrio_id"
                  name="barrio_id"
                  value={formData.barrio_id}
                  onChange={e => {
                    const selectedBarrio = barrios.find(b => b.id.toString() === e.target.value)
                    setFormData(prev => ({
                      ...prev,
                      barrio_id: e.target.value,
                      ciudad_id: selectedBarrio ? selectedBarrio.ciudad_id.toString() : prev.ciudad_id,
                    }))
                  }}
                  className="form-input"
                >
                  <option value="">Seleccionar barrio</option>
                  {barrios.map(barrio => (
                    <option key={barrio.id} value={barrio.id}>
                      {barrio.name} ({barrio.ciudad})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="tel">Teléfono</label>
                <input
                  type="tel"
                  id="tel"
                  name="tel"
                  value={formData.tel}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Ej: 312 123 4567"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="whatsapp">WhatsApp del negocio</label>
              <input
                type="tel"
                id="whatsapp"
                name="whatsapp"
                value={formData.whatsapp}
                onChange={handleChange}
                className="form-input"
                placeholder="Ej: 312 123 4567"
              />
            </div>

            <div className="form-group">
              <label htmlFor="horario">Horario de Atención</label>
              <textarea
                id="horario"
                name="horario"
                value={formData.horario}
                onChange={handleChange}
                className="form-input"
                rows="4"
                placeholder="Ej:&#10;Lunes a Viernes: 9:00 - 18:00&#10;Sábado: 10:00 - 14:00&#10;Domingo: Cerrado"
              />
            </div>

            <div className="form-group">
              <label htmlFor="permite_agendar"  style={{display: "flex",alignItems: "center",gap: "8px",cursor: "pointer"}}>
                Permitir que los clientes agenden citas
                <input
                  type="checkbox"
                  id="permite_agendar"
                  name="permite_agendar"
                  checked={formData.permite_agendar || false}
                  onChange={e => setFormData(prev => ({ ...prev, permite_agendar: e.target.checked }))}
                  />
              </label>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={handleCancel}
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={saving}
              >
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  )
}

export default NegocioPage
