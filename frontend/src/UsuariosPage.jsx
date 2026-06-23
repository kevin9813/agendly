import { useEffect, useState, useRef } from 'react'

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/'

function UsuariosPage({ user }) {
  const [usuarios, setUsuarios] = useState([])
  const [negocios, setNegocios] = useState([])
  const [sucursales, setSucursales] = useState([])
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
    sucursal_id: '',
    color: '#4ECDC4',
    whatsapp: '',
    description: '',
    servicios_ids: [],
  })
  const hasInitialized = useRef(false)

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      loadUsuarios()
      loadNegocios()
      loadRoles()
      loadServicios()
      loadSucursales()
    }
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

  const loadSucursales = async () => {
    try {
      const response = await fetch(`${apiUrl}sucursales/?negocio_id=${user.negocio_id}`)
      const data = await response.json()
      setSucursales(data.sucursales || [])
    } catch (error) {
      console.error('Error loading sucursales:', error)
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
        setFormData({ name: '', username: '', password: '', rol_id: '', negocio_id: '', description: '' })
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
      description: usuario.description,
      rol_id: usuario.rol_id.toString(),
      negocio_id: usuario.negocio_id.toString(),
      sucursal_id: usuario.sucursal_id ? usuario.sucursal_id.toString() : '',
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
      sucursal_id: '',
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
    <div className="min-h-screen rounded-2xl border dark:border-slate-800 dark:bg-gray-800 p-6">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">
            Gestión de Usuarios
          </h1>
        </div>

        {usuarios.length <= 5 ? (
          <button
            onClick={openCreateModal}
            className="inline-flex items-center justify-center rounded-2xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition-all hover:bg-violet-700"
          >
            + Nuevo Usuario
          </button>
        ) : (
          <p className="text-sm text-gray-500">Límite de usuarios alcanzado</p>
        )}
      </div>

      {/* Tabla */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  ID
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Color
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Nombre
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Usuario
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  WhatsApp
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Rol
                </th>

                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {usuarios.map(usuario => (
                <tr
                  key={usuario.id}
                  className="transition hover:bg-slate-50 dark:hover:bg-slate-800/40"
                >
                  <td className="px-6 py-4 text-sm font-medium text-slate-700 dark:text-slate-200">
                    #{usuario.id}
                  </td>

                  <td className="px-6 py-4">
                    <div
                      className="h-10 w-10 rounded-full border-4 border-white shadow-md"
                      style={{
                        backgroundColor: usuario.color,
                      }}
                      title={usuario.color}
                    />
                  </td>

                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {usuario.name}
                    </div>
                  </td>

                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                    @{usuario.username}
                  </td>

                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                    {usuario.whatsapp || '-'}
                  </td>

                  <td className="px-6 py-4">
                    <span className="inline-flex rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
                      {usuario.rol}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => handleEdit(usuario)}
                        className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        Editar
                      </button>

                      <button
                        onClick={() => handleDelete(usuario.id)}
                        className="rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="relative max-h-[95vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl dark:bg-slate-900"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 px-6 py-5 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
              <div>
                <p className="text-sm font-medium text-violet-500">
                  Usuarios
                </p>

                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {editingUsuario ? 'Editar Usuario' : 'Nuevo Usuario'}
                </h2>
              </div>

              <button
                onClick={closeModal}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-xl text-slate-600 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
              >
                ×
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="space-y-6 p-6"
            >
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Nombre */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Nombre completo
                  </label>

                  <input
                    type="text"
                    value={formData.name}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        name: e.target.value,
                      })
                    }
                    required
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                {/* Usuario */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Nombre de usuario
                  </label>

                  <input
                    type="text"
                    value={formData.username}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        username: e.target.value,
                      })
                    }
                    required
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Contraseña
                  </label>

                  <input
                    type="password"
                    value={formData.password}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        password: e.target.value,
                      })
                    }
                    required={!editingUsuario}
                    placeholder={
                      editingUsuario
                        ? 'Dejar vacío para mantener la contraseña actual'
                        : ''
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                {/* WhatsApp */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    WhatsApp
                  </label>

                  <input
                    type="tel"
                    value={formData.whatsapp}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        whatsapp: e.target.value,
                      })
                    }
                    placeholder="Ej: 312 123 4567"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                {/* Rol */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Rol
                  </label>

                  <select
                    value={formData.rol_id}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        rol_id: e.target.value,
                      })
                    }
                    required
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="">Seleccionar rol</option>

                    {roles.map(rol => (
                      <option key={rol.id} value={rol.id}>
                        {rol.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sucursal */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Sucursal
                  </label>

                  <select
                    value={formData.sucursal_id}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        sucursal_id: e.target.value,
                      })
                    }
                    required
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="">Seleccione una sucursal</option>

                    {sucursales.map(sucursal => (
                      <option key={sucursal.id} value={sucursal.id}>
                        {sucursal.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Servicios */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Servicios asignados
                </label>

                <select
                  multiple
                  value={formData.servicios_ids.map(id => id.toString())}
                  onChange={e => {
                    const options = Array.from(e.target.selectedOptions)

                    setFormData({
                      ...formData,
                      servicios_ids: options.map(option =>
                        parseInt(option.value)
                      ),
                    })
                  }}
                  className="min-h-[160px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {servicios.map(servicio => (
                    <option key={servicio.id} value={servicio.id}>
                      {servicio.name} ({servicio.negocio})
                    </option>
                  ))}
                </select>
              </div>

              {/* descripcion  */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Descripcion
                </label>
                <textarea
                  value={formData.description}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      description: e.target.value,
                    })
                  }
                  rows="4"
                  className="w-full rounded-2xl border border-gray-300 dark:border-white/10 bg-white dark:bg-[#0f172a] px-4 py-3 text-sm text-gray-900 dark:text-white outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:border-slate-500"
                />
              </div>
              {/* Negocio */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Negocio
                </label>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {negocios.find(
                    n => n.id.toString() === formData.negocio_id
                  )?.name || 'Cargando...'}
                </div>
              </div>

              {/* Color */}
              <div>
                <label className="mb-3 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Color para la Agenda
                </label>

                <div className="flex items-center gap-4">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        color: e.target.value,
                      })
                    }
                    className="h-14 w-20 cursor-pointer rounded-2xl border border-slate-300 bg-transparent"
                  />

                  <div className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {formData.color}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end dark:border-slate-800">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="rounded-2xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:bg-violet-700"
                >
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