import { useEffect, useState } from 'react'

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/'
import { useSucursales } from './hooks/useData'

function ClientesPage({ user }) {
  const [clientes, setClientes] = useState([])
  const [negocios, setNegocios] = useState([])
  const { sucursales, loadingSucursales } = useSucursales(user)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCliente, setEditingCliente] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    celular: '',
    negocio_id: '',
    sucursal_id: '',
  })

  useEffect(() => {
    loadClientes()
    loadNegocios()
  }, [])

  const loadClientes = async () => {
    try {
      const response = await fetch(`${apiUrl}clientes/`)
      const data = await response.json()
      setClientes(data.clientes || [])
    } catch (error) {
      console.error('Error loading clientes:', error)
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

    const url = editingCliente
      ? `${apiUrl}clientes/${editingCliente.id}/`
      : `${apiUrl}clientes/`

    const method = editingCliente ? 'PUT' : 'POST'

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        await loadClientes()
        setShowModal(false)
        setEditingCliente(null)
        setFormData({ name: '', celular: '', negocio_id: '', sucursal_id: '' })
      } else {
        const error = await response.json()
        alert(`Error: ${error.detail || 'Error desconocido'}`)
      }
    } catch (error) {
      console.error('Error saving cliente:', error)
      alert('Error al guardar el cliente')
    }
  }

  const handleEdit = (cliente) => {
    setEditingCliente(cliente)
    setFormData({
      name: cliente.name,
      celular: cliente.celular || '',
      negocio_id: cliente.negocio_id,
      sucursal_id: cliente.sucursal_id || '',
    })
    setShowModal(true)
  }

  const handleDelete = async (clienteId) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este cliente?')) {
      return
    }

    try {
      const response = await fetch(`${apiUrl}clientes/${clienteId}/`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await loadClientes()
      } else {
        alert('Error al eliminar el cliente')
      }
    } catch (error) {
      console.error('Error deleting cliente:', error)
      alert('Error al eliminar el cliente')
    }
  }

  const openCreateModal = () => {
    setEditingCliente(null)
    setFormData({ name: '', celular: '', negocio_id: user ? user.negocio_id.toString() : '', sucursal_id: '' })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingCliente(null)
    setFormData({ name: '', celular: '', negocio_id: '', sucursal_id: '' })
  }

  if (loading) {
    return <div className="loading">Cargando clientes...</div>
  }

  return (
    <div className="clientes-page">
      <div className="dashboard-topbar">
        <h1>Gestión de Clientes</h1>
        <button className="create-button" onClick={openCreateModal}>
          + Nuevo Cliente
        </button>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Celular/WhatsApp</th>
              <th style={{ display: user.rol === 'Empleado' ? 'none' : 'block' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clientes.map(cliente => (
              <tr key={cliente.id}>
                <td>{cliente.id}</td>
                <td>{cliente.name}</td>
                <td>{cliente.celular || '-'}</td>
                <td style={{ display: user.rol === 'Empleado' ? 'none' : 'block' }}>
                  <button
                    className="edit-button"
                    onClick={() => handleEdit(cliente)}
                  >
                    Editar
                  </button>
                  <button 
                    className="delete-button"
                    onClick={() => handleDelete(cliente.id)}
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
              <h2>{editingCliente ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
              <button className="close-button" onClick={closeModal}>×</button>
            </div>

            <form onSubmit={handleSubmit} className="cliente-form">
              <div className="form-group">
                <label>Nombre completo:</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Celular/WhatsApp:</label>
                <input
                  type="tel"
                  value={formData.celular}
                  onChange={e => setFormData({...formData, celular: e.target.value})}
                  placeholder="Ej: 312 123 4567"
                />
              </div>

              <div className="form-group">
                <label>Sucursal:</label>
                <select disabled={editingCliente}
                  value={formData.sucursal_id}
                  onChange={e => setFormData({...formData, sucursal_id: e.target.value})}
                  required
                >
                  <option value="">Seleccione una sucursal</option>
                  {sucursales.map(sucursal => (
                    <option key={sucursal.id} value={sucursal.id}>
                      {sucursal.name}
                    </option>
                  ))}
                </select>
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
                  {negocios.find(n => n.id.toString() === formData.negocio_id)?.name || 'Cargando...'}
                </div>
              </div>

              <div className="form-actions">
                <button type="button" onClick={closeModal} className="cancel-button">
                  Cancelar
                </button>
                <button type="submit" className="submit-button">
                  {editingCliente ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ClientesPage