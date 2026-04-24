import { useEffect, useState } from 'react'

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/'

// Función para formatear precios con puntos de miles
const formatPrice = (price) => {
  return parseFloat(price).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

function ServiciosPage({ user }) {
  const [servicios, setServicios] = useState([])
  const [negocios, setNegocios] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingServicio, setEditingServicio] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    precio: '',
    tiempo: '',
    permite_domicilio: false,
    notas: '',
    negocio_id: '',
  })

  useEffect(() => {
    loadServicios()
    loadNegocios()
  }, [])

  const loadServicios = async () => {
    try {
      const response = await fetch(`${apiUrl}servicios/`)
      const data = await response.json()
      setServicios(data.servicios || [])
    } catch (error) {
      console.error('Error loading servicios:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadNegocios = async () => {
    try {
      const response = await fetch(`${apiUrl}negocios/`)
      const data = await response.json()
      setNegocios(data.negocios || [])
    } catch (error) {
      console.error('Error loading negocios:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const url = editingServicio
      ? `${apiUrl}servicios/${editingServicio.id}/`
      : `${apiUrl}servicios/`

    const method = editingServicio ? 'PUT' : 'POST'

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          precio: parseFloat(formData.precio),
          tiempo: parseInt(formData.tiempo),
          permite_domicilio: Boolean(formData.permite_domicilio),
          notas: formData.notas,
          negocio_id: parseInt(formData.negocio_id),
        }),
      })

      if (response.ok) {
        await loadServicios()
        setShowModal(false)
        setEditingServicio(null)
        setFormData({ name: '', precio: '', tiempo: '', negocio_id: '' })
      } else {
        const error = await response.json()
        alert(`Error: ${error.detail || 'Error desconocido'}`)
      }
    } catch (error) {
      console.error('Error saving servicio:', error)
      alert('Error al guardar el servicio')
    }
  }

  const handleEdit = (servicio) => {
    setEditingServicio(servicio)
    setFormData({
      name: servicio.name,
      precio: servicio.precio,
      tiempo: servicio.tiempo.toString(),
      permite_domicilio: servicio.permite_domicilio,
      notas: servicio.notas || '',
      negocio_id: servicio.negocio_id.toString(),
    })
    setShowModal(true)
  }

  const handleDelete = async (servicioId) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este servicio?')) {
      return
    }

    try {
      const response = await fetch(`${apiUrl}servicios/${servicioId}/`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await loadServicios()
      } else {
        alert('Error al eliminar el servicio')
      }
    } catch (error) {
      console.error('Error deleting servicio:', error)
      alert('Error al eliminar el servicio')
    }
  }

  const openCreateModal = () => {
    setEditingServicio(null)
    setFormData({
      name: '',
      precio: '',
      tiempo: '',
      permite_domicilio: false,
      notas: '',
      negocio_id: user ? user.negocio_id.toString() : '',
    })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingServicio(null)
    setFormData({ name: '', precio: '', tiempo: '', negocio_id: '' })
  }

  if (loading) {
    return <div className="loading">Cargando servicios...</div>
  }

  return (
    <div className="servicios-page">
      <div className="page-header">
        <h1>Gestión de Servicios</h1>
        <button className="create-button" onClick={openCreateModal}>
          + Nuevo Servicio
        </button>
      </div>

      <div className="servicios-table-container">
        <table className="servicios-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Precio</th>
              <th>Tiempo (min)</th>
              <th>Domicilio</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {servicios.map(servicio => (
              <tr key={servicio.id}>
                <td>{servicio.id}</td>
                <td>{servicio.name}</td>
                <td>${formatPrice(servicio.precio)}</td>
                <td>{servicio.tiempo}</td>
                <td>{servicio.permite_domicilio ? 'Sí' : 'No'}</td>
                <td>
                  <button
                    className="edit-button"
                    onClick={() => handleEdit(servicio)}
                  >
                    Editar
                  </button>
                  <button
                    className="delete-button"
                    onClick={() => handleDelete(servicio.id)}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingServicio ? 'Editar Servicio' : 'Nuevo Servicio'}</h2>
              <button className="close-button" onClick={closeModal}>×</button>
            </div>

            <form onSubmit={handleSubmit} className="servicio-form">
              <div className="form-group">
                <label>Nombre:</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Precio:</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.precio}
                  onChange={e => setFormData({...formData, precio: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Tiempo (minutos):</label>
                <input
                  type="number"
                  value={formData.tiempo}
                  onChange={e => setFormData({...formData, tiempo: e.target.value})}
                  required
                />
              </div>

              <div className="form-group checkbox-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  Permite a domicilio:
                  <input
                    type="checkbox"
                    checked={formData.permite_domicilio}
                    onChange={e => setFormData({...formData, permite_domicilio: e.target.checked})}
                  />
                </label>
              </div>

              <div className="form-group">
                <label>Notas:</label>
                <textarea
                  value={formData.notas}
                  onChange={e => setFormData({...formData, notas: e.target.value})}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db', fontFamily: 'inherit' }}
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Negocio:</label>
                <div style={{
                    padding: '0.9rem 1rem',
                    border: '1px solid #cbd5e1',
                    borderRadius: '14px',
                    background: '#f8fafc',
                    color: '#64748b'
                  }}>
                    {negocios.find(n => n.id.toString() === formData.negocio_id)?.name || 'Cargando..'}
                </div>
              </div>

              <div className="form-actions">
                <button type="button" onClick={closeModal} className="cancel-button">
                  Cancelar
                </button>
                <button type="submit" className="submit-button">
                  {editingServicio ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ServiciosPage