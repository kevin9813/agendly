import { useEffect, useState } from 'react'

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/'

function UsuariosPage({ user }) {
  const [usuarios, setUsuarios] = useState([])
  const [negocios, setNegocios] = useState([])
  const [roles, setRoles] = useState([])
  const [servicios, setServicios] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingUsuario, setEditingUsuario] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    rol_id: '',
    negocio_id: '',
    color: '#4ECDC4',
    whatsapp: '',
    servicios_ids: [],
  })

  useEffect(() => {
    loadUsuarios()
    loadNegocios()
    loadRoles()
    loadServicios()
  }, [])

  const loadServicios = async () => {
    try {
      const response = await fetch(`${apiUrl}servicios/`)
      const data = await response.json()
      setServicios(data.servicios || [])
    } catch (error) {
      console.error('Error loading servicios:', error)
    }
  }

  const loadUsuarios = async () => {
    try {
      const response = await fetch(`${apiUrl}usuarios/`)
      const data = await response.json()
      setUsuarios(data.usuarios || [])
    } catch (error) {
      console.error('Error loading usuarios:', error)
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

  const loadRoles = async () => {
    try {
      // Asumiendo que hay un endpoint para roles, si no, podemos hardcodearlos por ahora
      const response = await fetch(`${apiUrl}roles/`)
      if (response.ok) {
        const data = await response.json()
        setRoles(data.roles || [])
      } else {
        // Fallback: roles comunes
        setRoles([
          { id: 1, name: 'Administrador' },
          { id: 2, name: 'Empleado' },
          { id: 3, name: 'Cliente' },
        ])
      }
    } catch (error) {
      console.error('Error loading roles:', error)
      // Fallback: roles comunes
      setRoles([
        { id: 1, name: 'Administrador' },
        { id: 2, name: 'Empleado' },
        { id: 3, name: 'Cliente' },
      ])
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const url = editingUsuario
      ? `${apiUrl}usuarios/${editingUsuario.id}/`
      : `${apiUrl}usuarios/`

    const method = editingUsuario ? 'PUT' : 'POST'

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          rol_id: parseInt(formData.rol_id),
          negocio_id: parseInt(formData.negocio_id),
          whatsapp: formData.whatsapp,
          servicios_ids: formData.servicios_ids,
        }),
      })

      if (response.ok) {
        await loadUsuarios()
        setShowModal(false)
        setEditingUsuario(null)
        setFormData({ name: '', username: '', password: '', rol_id: '', negocio_id: '' })
      } else {
        const error = await response.json()
        alert(`Error: ${error.detail || 'Error desconocido'}`)
      }
    } catch (error) {
      console.error('Error saving usuario:', error)
      alert('Error al guardar el usuario')
    }
  }

  const handleEdit = (usuario) => {
    setEditingUsuario(usuario)
    setFormData({
      name: usuario.name,
      username: usuario.username,
      password: '', // No mostrar contraseña existente
      rol_id: usuario.rol_id.toString(),
      negocio_id: usuario.negocio_id.toString(),
      color: usuario.color || '#4ECDC4',
      whatsapp: usuario.whatsapp || '',
      servicios_ids: usuario.servicios_ids || [],
    })
    setShowModal(true)
  }

  const handleDelete = async (usuarioId) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
      return
    }

    try {
      const response = await fetch(`${apiUrl}usuarios/${usuarioId}/`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await loadUsuarios()
      } else {
        alert('Error al eliminar el usuario')
      }
    } catch (error) {
      console.error('Error deleting usuario:', error)
      alert('Error al eliminar el usuario')
    }
  }

  const openCreateModal = () => {
    setEditingUsuario(null)
    setFormData({
      name: '',
      username: '',
      password: '',
      rol_id: '',
      negocio_id: user ? user.negocio_id.toString() : '',
      color: '#4ECDC4',
      whatsapp: '',
      servicios_ids: [],
    })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingUsuario(null)
    setFormData({ name: '', username: '', password: '', rol_id: '', negocio_id: '', color: '#4ECDC4', whatsapp: '' })
  }

  if (loading) {
    return <div className="loading">Cargando usuarios...</div>
  }

  return (
    <div className="usuarios-page">
      <div className="page-header">
        <h1>Gestión de Usuarios</h1>
        <button className="create-button" onClick={openCreateModal}>
          + Nuevo Usuario
        </button>
      </div>

      <div className="usuarios-table-container">
        <table className="usuarios-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Color</th>
              <th>Nombre</th>
              <th>Usuario</th>
              <th>WhatsApp</th>
              <th>Rol</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map(usuario => (
              <tr key={usuario.id}>
                <td>{usuario.id}</td>
                <td>
                  <div
                    style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '50%',
                      backgroundColor: usuario.color,
                      border: '2px solid #ddd',
                    }}
                    title={usuario.color}
                  />
                </td>
                <td>{usuario.name}</td>
                <td>{usuario.username}</td>
                <td>{usuario.whatsapp || '-'}</td>
                <td>{usuario.rol}</td>
                <td>
                  <button
                    className="edit-button"
                    onClick={() => handleEdit(usuario)}
                  >
                    Editar
                  </button>
                  <button
                    className="delete-button"
                    onClick={() => handleDelete(usuario.id)}
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
              <h2>{editingUsuario ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
              <button className="close-button" onClick={closeModal}>×</button>
            </div>

            <form onSubmit={handleSubmit} className="usuario-form">
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
                <label>Nombre de usuario:</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={e => setFormData({...formData, username: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Contraseña:</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  required={!editingUsuario}
                  placeholder={editingUsuario ? 'Dejar vacío para mantener la contraseña actual' : ''}
                />
              </div>

              <div className="form-group">
                <label>WhatsApp:</label>
                <input
                  type="tel"
                  value={formData.whatsapp}
                  onChange={e => setFormData({...formData, whatsapp: e.target.value})}
                  placeholder="Ej: 312 123 4567"
                />
              </div>

              <div className="form-group">
                <label>Rol:</label>
                <select
                  value={formData.rol_id}
                  onChange={e => setFormData({...formData, rol_id: e.target.value})}
                  required
                >
                  <option value="">Seleccionar rol</option>
                  {roles.map(rol => (
                    <option key={rol.id} value={rol.id}>
                      {rol.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Servicios asignados:</label>
                <select
                  multiple
                  value={formData.servicios_ids.map(id => id.toString())}
                  onChange={e => {
                    const options = Array.from(e.target.selectedOptions)
                    setFormData({...formData, servicios_ids: options.map(option => parseInt(option.value))})
                  }}
                  style={{ minHeight: '120px' }}
                >
                  {servicios.map(servicio => (
                    <option key={servicio.id} value={servicio.id}>
                      {servicio.name} ({servicio.negocio})
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

              <div className="form-group">
                <label>Color para la Agenda:</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <input
                    type="color"
                    value={formData.color}
                    onChange={e => setFormData({...formData, color: e.target.value})}
                    style={{
                      width: '60px',
                      height: '40px',
                      border: '2px solid #ddd',
                      borderRadius: '8px',
                      cursor: 'pointer',
                    }}
                  />
                  <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>
                    {formData.color}
                  </span>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" onClick={closeModal} className="cancel-button">
                  Cancelar
                </button>
                <button type="submit" className="submit-button">
                  {editingUsuario ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default UsuariosPage