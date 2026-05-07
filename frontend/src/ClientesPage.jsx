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
    <div className="min-h-screen text-white p-6 rounded-2xl border border-slate-800 dark:bg-gray-800">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Gestión de Clientes
          </h1>
        </div>

        <button
          className="inline-flex items-center justify-center rounded-2xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition-all hover:bg-violet-700"
          onClick={openCreateModal}
        >
          + Nuevo Cliente
        </button>
      </div>

      <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[#111827] shadow-[0_10px_40px_rgba(0,0,0,0.35)]">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="border-b border-white/10 bg-white/[0.03]">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  ID
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Nombre
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Celular / WhatsApp
                </th>

                <th
                  style={{ display: user.rol === 'Empleado' ? 'none' : 'table-cell' }}
                  className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-400"
                >
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody>
              {clientes.map(cliente => (
                <tr
                  key={cliente.id}
                  className="border-b border-slate-800 hover:bg-slate-900/50 transition-colors duration-200"
                >
                  <td className="px-6 py-4 text-sm text-slate-400">
                    #{cliente.id}
                  </td>

                  <td className="px-6 py-4">
                    <div className="font-medium text-white">
                      {cliente.name}
                    </div>
                  </td>

                  <td className="px-6 py-4 text-slate-300 text-sm">
                    {cliente.celular || '-'}
                  </td>

                  <td
                    style={{ display: user.rol === 'Empleado' ? 'none' : 'table-cell' }}
                    className="px-6 py-4"
                  >
                    <div className="flex justify-end gap-2">
                      <button
                        className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-slate-200 transition-all hover:bg-white/[0.06]"
                        onClick={() => handleEdit(cliente)}
                      >
                        Editar
                      </button>

                      <button
                        className="rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-red-600"
                        onClick={() => handleDelete(cliente.id)}
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

      {showModal && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-2xl rounded-3xl border border-slate-800 bg-[#111827] shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-[#0f172a]">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                  Clientes
                </p>

                <h2 className="text-2xl font-bold text-white">
                  {editingCliente ? 'Editar Cliente' : 'Nuevo Cliente'}
                </h2>
              </div>

              <button
                className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all duration-200"
                onClick={closeModal}
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="cliente-form p-6 space-y-5"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="form-group">
                  <label className="block mb-2 text-sm font-medium text-slate-300">
                    Nombre completo
                  </label>

                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    required
                    className="w-full h-12 rounded-2xl border border-slate-700 bg-slate-900 px-4 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  />
                </div>

                <div className="form-group">
                  <label className="block mb-2 text-sm font-medium text-slate-300">
                    Celular / WhatsApp
                  </label>

                  <input
                    type="tel"
                    value={formData.celular}
                    onChange={e => setFormData({...formData, celular: e.target.value})}
                    placeholder="Ej: 312 123 4567"
                    className="w-full h-12 rounded-2xl border border-slate-700 bg-slate-900 px-4 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="block mb-2 text-sm font-medium text-slate-300">
                  Sucursal
                </label>

                <select
                  disabled={editingCliente}
                  value={formData.sucursal_id}
                  onChange={e => setFormData({...formData, sucursal_id: e.target.value})}
                  required
                  className="w-full h-12 rounded-2xl border border-slate-700 bg-slate-900 px-4 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
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
                <label className="block mb-2 text-sm font-medium text-slate-300">
                  Negocio
                </label>

                <div className="flex items-center h-12 rounded-2xl border border-slate-700 bg-slate-900 px-4 text-slate-400">
                  {negocios.find(n => n.id.toString() === formData.negocio_id)?.name || 'Cargando...'}
                </div>
              </div>

              <div className="flex flex-col-reverse md:flex-row justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={closeModal}
                  className="h-12 px-5 rounded-2xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white font-medium transition-all duration-200"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="h-12 px-5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-lg shadow-blue-600/20 transition-all duration-200"
                >
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