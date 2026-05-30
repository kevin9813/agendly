import { useEffect, useState, useRef } from 'react'

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/'

function ClientesPage({ user }) {
  const [clientes, setClientes] = useState([])
  const [negocios, setNegocios] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCliente, setEditingCliente] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    celular: '',
    negocio_id: '',
  })

  const hasInitialized = useRef(false)

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      loadClientes()
      loadNegocios()
    }
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
        setFormData({ name: '', celular: '', negocio_id: '' })
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
    setFormData({ name: '', celular: '', negocio_id: user ? user.negocio_id.toString() : '' })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingCliente(null)
    setFormData({ name: '', celular: '', negocio_id: ''})
  }

  if (loading) {
    return <div className="loading">Cargando clientes...</div>
  }

  return (
    <div className="min-h-screen rounded-2xl border dark:border-slate-800 dark:bg-gray-800 p-6">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">
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

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  ID
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Nombre
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Celular / WhatsApp
                </th>

                <th style={{ display: user.rol === 'Empleado' ? 'none' : 'table-cell' }}
                  className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500"
                >
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {clientes.map(cliente => (
                <tr
                  key={cliente.id}
                  className="transition hover:bg-slate-50 dark:hover:bg-slate-800/40"
                >
                  <td className="px-6 py-4 text-sm font-medium text-slate-700 dark:text-slate-200">
                    #{cliente.id}
                  </td>

                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {cliente.name}
                    </div>
                  </td>

                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                    {cliente.celular || '-'}
                  </td>

                  <td
                    style={{ display: user.rol === 'Empleado' ? 'none' : 'table-cell' }}
                    className="px-6 py-4"
                  >
                    <div className="flex justify-end gap-2">
                      <button
                        className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="relative max-h-[95vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl dark:bg-slate-900"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 px-6 py-5 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
              <div>
                <p className="text-sm font-medium text-violet-500">
                  Clientes
                </p>

                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {editingCliente ? 'Editar Cliente' : 'Nuevo Cliente'}
                </h2>
              </div>

              <button
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-xl text-slate-600 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
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
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Nombre completo
                  </label>

                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    required
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div className="form-group">
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Celular / WhatsApp
                  </label>

                  <input
                    type="tel"
                    value={formData.celular}
                    onChange={e => setFormData({...formData, celular: e.target.value})}
                    placeholder="Ej: 312 123 4567"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Negocio
                </label>

                <div className="rounded-2xl border border-gray-300 dark:border-white/10 bg-white dark:bg-[#0f172a] px-4 py-3 text-sm text-gray-500 dark:text-slate-400">
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