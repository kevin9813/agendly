import { useEffect, useState } from 'react'

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/'

function NegocioPage({ user }) {
  const [negocio, setNegocio] = useState(null)
  const [sucursales, setSucursales] = useState([])
  const [barrios, setBarrios] = useState([])
  const [loading, setLoading] = useState(true)
  const [editNegocio, setEditNegocio] = useState(false)
  const [savingNegocio, setSavingNegocio] = useState(false)
  const [editingSucursal, setEditingSucursal] = useState(null)
  const [savingSucursal, setSavingSucursal] = useState(false)
  const [message, setMessage] = useState('')
  const [negocioForm, setNegocioForm] = useState({ name: '' })
  const [sucursalForm, setSucursalForm] = useState({
    name: '',
    direccion: '',
    tel: '',
    whatsapp: '',
    barrio_id: '',
    horario: '',
    ciudad_id: '',
    permite_agendar: false,
    activo: true,
  })

  useEffect(() => {
    if (!user?.negocio_id) {
      setLoading(false)
      return
    }

    loadNegocio()
    loadBarrios()
    loadSucursales()
  }, [user])

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
        setNegocioForm({ name: data.name || '' })
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

  const loadSucursales = async () => {
    if (!user?.negocio_id) {
      return
    }

    try {
      const response = await fetch(`${apiUrl}sucursales/?negocio_id=${user.negocio_id}`)
      if (response.ok) {
        const data = await response.json()
        setSucursales(data.sucursales || [])
      }
    } catch (error) {
      console.error('Error loading sucursales:', error)
    }
  }

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

  const handleNegocioChange = (e) => {
    setNegocioForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleNegocioSubmit = async (e) => {
    e.preventDefault()
    setSavingNegocio(true)
    setMessage('')

    try {
      const response = await fetch(`${apiUrl}negocios/${user.negocio_id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: negocioForm.name }),
      })

      if (response.ok) {
        setMessage('Negocio actualizado correctamente')
        await loadNegocio()
        setEditNegocio(false)
        setTimeout(() => setMessage(''), 3000)
      } else {
        const error = await response.json()
        setMessage(`Error: ${error.detail || 'Error desconocido'}`)
      }
    } catch (error) {
      console.error('Error saving negocio:', error)
      setMessage('Error al guardar los cambios')
    } finally {
      setSavingNegocio(false)
    }
  }

  const handleSucursalChange = (e) => {
    const { name, value, type, checked } = e.target
    setSucursalForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const openEditSucursal = (sucursal) => {
    setEditingSucursal(sucursal)
    setSucursalForm({
      name: sucursal.name || '',
      direccion: sucursal.direccion || '',
      tel: sucursal.tel || '',
      whatsapp: sucursal.whatsapp || '',
      barrio_id: sucursal.barrio_id ? sucursal.barrio_id.toString() : '',
      horario: sucursal.horario || '',
      ciudad_id: sucursal.ciudad_id ? sucursal.ciudad_id.toString() : '',
      permite_agendar: Boolean(sucursal.permite_agendar),
      activo: Boolean(sucursal.activo),
    })
    setMessage('')
  }

  const cancelSucursalForm = () => {
    setEditingSucursal(null)
    setSucursalForm({
      name: '',
      direccion: '',
      tel: '',
      whatsapp: '',
      barrio_id: '',
      horario: '',
      ciudad_id: '',
      permite_agendar: false,
      activo: true,
    })
  }

  const handleSucursalSubmit = async (e) => {
    e.preventDefault()
    setSavingSucursal(true)
    setMessage('')

    try {
      const barrioId = sucursalForm.barrio_id ? parseInt(sucursalForm.barrio_id) : null
      const selectedBarrio = barrios.find(b => b.id.toString() === sucursalForm.barrio_id)
      const ciudadId = selectedBarrio ? selectedBarrio.ciudad_id : (sucursalForm.ciudad_id ? parseInt(sucursalForm.ciudad_id) : null)
      const payload = {
        name: sucursalForm.name,
        direccion: sucursalForm.direccion,
        tel: sucursalForm.tel,
        whatsapp: sucursalForm.whatsapp,
        barrio_id: barrioId,
        ciudad_id: ciudadId,
        horario: sucursalForm.horario,
        permite_agendar: Boolean(sucursalForm.permite_agendar),
        activo: Boolean(sucursalForm.activo),
        negocio_id: user.negocio_id,
      }

      if (!editingSucursal) {
        setMessage('No hay sucursal seleccionada para editar')
        setSavingSucursal(false)
        return
      }
      const url = `${apiUrl}sucursales/${editingSucursal.id}/`
      const method = 'PUT'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        setMessage('Sucursal actualizada correctamente')
        await loadSucursales()
        cancelSucursalForm()
        setEditingSucursal(null)
        setTimeout(() => setMessage(''), 3000)
      } else {
        const error = await response.json()
        setMessage(`Error: ${error.detail || 'Error desconocido'}`)
      }
    } catch (error) {
      console.error('Error saving sucursal:', error)
      setMessage('Error al guardar la sucursal')
    } finally {
      setSavingSucursal(false)
    }
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
          {/* {!editNegocio && !editingSucursal && (
            <button className="btn-secondary" onClick={() => setEditNegocio(true)}>
              Editar nombre
            </button>
          )} */}
        </div>
      </div>

      {message && (
        <div className={`alert ${message.includes('Error') ? 'alert-error' : 'alert-success'}`}>
          {message}
        </div>
      )}

      <div className="negocio-view">
        <div className="card">
          <div className="card-content">
            <div className="info-group">
              <label>Nombre del Negocio</label>
              <p>{negocio.name}</p>
            </div>
            <div className="info-group">
              <label>Sucursales</label>
              <p>{sucursales.length}</p>
            </div>
          </div>
        </div>
      </div>

      {editNegocio && (
        <form onSubmit={handleNegocioSubmit} className="negocio-form">
          <div className="card">
            <div className="form-group">
              <label htmlFor="name">Nombre del Negocio *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={negocioForm.name}
                onChange={handleNegocioChange}
                required
                className="form-input"
              />
            </div>

            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => setEditNegocio(false)} disabled={savingNegocio}>
                Cancelar
              </button>
              <button type="submit" className="btn-primary" disabled={savingNegocio}>
                {savingNegocio ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="sucursales-section">
        <div className="section-header">
          <h2>Sucursales</h2>
          <p>Gestiona las sucursales que dependen de este negocio.</p>
        </div>

        {sucursales.length === 0 ? (
          <div className="card">
            <p>No hay sucursales registradas aún.</p>
          </div>
        ) : (
          <div className="card table-card">
            <table className="table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Ciudad</th>
                  <th>Barrio</th>
                  <th>Tel</th>
                  <th>WhatsApp</th>
                  <th>Agenda</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sucursales.map(sucursal => (
                  <tr key={sucursal.id}>
                    <td>{sucursal.name}</td>
                    <td>{sucursal.ciudad}</td>
                    <td>{sucursal.barrio}</td>
                    <td>{sucursal.tel || '-'}</td>
                    <td>{sucursal.whatsapp || '-'}</td>
                    <td>{sucursal.permite_agendar ? 'Sí' : 'No'}</td>
                    <td>
                      <button className="edit-button" onClick={() => openEditSucursal(sucursal)}>
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editingSucursal && (
        <div className="modal-overlay" onClick={cancelSucursalForm}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <form onSubmit={handleSucursalSubmit} className="negocio-form">
              <div className="card">
                <h2>Editar sucursal</h2>

            <div className="form-group">
              <label htmlFor="name">Nombre *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={sucursalForm.name}
                onChange={handleSucursalChange}
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
                value={sucursalForm.direccion}
                onChange={handleSucursalChange}
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
                  value={sucursalForm.barrio_id}
                  onChange={e => {
                    const selectedBarrio = barrios.find(b => b.id.toString() === e.target.value)
                    setSucursalForm(prev => ({
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
                  value={sucursalForm.tel}
                  onChange={handleSucursalChange}
                  className="form-input"
                  placeholder="Ej: 312 123 4567"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="whatsapp">WhatsApp</label>
              <input
                type="tel"
                id="whatsapp"
                name="whatsapp"
                value={sucursalForm.whatsapp}
                onChange={handleSucursalChange}
                className="form-input"
                placeholder="Ej: 312 123 4567"
              />
            </div>

            <div className="form-group">
              <label htmlFor="horario">Horario de Atención</label>
              <textarea
                id="horario"
                name="horario"
                value={sucursalForm.horario}
                onChange={handleSucursalChange}
                className="form-input"
                rows="4"
                placeholder="Ej:\nLunes a Viernes: 9:00 - 18:00\nSábado: 10:00 - 14:00\nDomingo: Cerrado"
              />
            </div>

            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                Permitir que los clientes agenden citas
                <input
                  type="checkbox"
                  id="permite_agendar"
                  name="permite_agendar"
                  checked={sucursalForm.permite_agendar}
                  onChange={handleSucursalChange}
                />
              </label>

              {/* <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                Sucursal activa
                <input
                  type="checkbox"
                  id="activo"
                  name="activo"
                  checked={sucursalForm.activo}
                  onChange={handleSucursalChange}
                />
              </label> */}
            </div>

            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={cancelSucursalForm} disabled={savingSucursal}>
                Cancelar
              </button>
              <button type="submit" className="btn-primary" disabled={savingSucursal}>
                {savingSucursal ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default NegocioPage
