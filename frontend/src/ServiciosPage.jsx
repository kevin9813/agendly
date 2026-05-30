import { useEffect, useState, useRef } from 'react'

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

  const hasInitialized = useRef(false)

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      loadServicios()
      loadNegocios()
    }
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
    setFormData({ name: '', precio: '', tiempo: '', negocio_id: ''})
  }

  if (loading) {
    return <div className="loading">Cargando servicios...</div>
  }

  return (
    <div className="min-h-screen rounded-2xl border dark:border-slate-800 dark:bg-gray-800 p-6">
      {/* TOPBAR */}
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">
            Gestión de Servicios
          </h1>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center rounded-2xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition-all hover:bg-violet-700"
        >
          + Nuevo Servicio
        </button>
      </div>

      {/* TABLA */}
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
                  Precio
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Tiempo
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Domicilio
                </th>

                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {servicios.map(servicio => (
                <tr
                  key={servicio.id}
                  className="transition hover:bg-slate-50 dark:hover:bg-slate-800/40"
                >
                  <td className="px-6 py-4 text-sm font-medium text-slate-700 dark:text-slate-200">
                    #{servicio.id}
                  </td>

                  <td className="px-6 py-5">
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {servicio.name}
                    </div>
                  </td>

                  <td className="px-6 py-5">
                    <span className="inline-flex rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                      ${formatPrice(servicio.precio)}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                    {servicio.tiempo} min
                  </td>

                  <td className="px-6 py-5">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        servicio.permite_domicilio
                          ? 'bg-blue-500/10 text-blue-400'
                          : 'bg-white/[0.04] text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {servicio.permite_domicilio ? 'Sí' : 'No'}
                    </span>
                  </td>

                  <td className="px-6 py-5">
                    <div className="flex justify-end gap-2">
                      <button
                        className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                        onClick={() => handleEdit(servicio)}
                      >
                        Editar
                      </button>

                      <button
                        className="rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-red-600"
                        onClick={() => handleDelete(servicio.id)}
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

      {/* MODAL */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="relative max-h-[95vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl dark:bg-slate-900"
            onClick={e => e.stopPropagation()}
          >
            {/* HEADER */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 px-6 py-5 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
              <div>
                <p className="text-sm font-medium text-violet-500">
                  Servicio
                </p>

                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {editingServicio ? 'Editar Servicio' : 'Nuevo Servicio'}
                </h2>
              </div>

              <button
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-xl text-slate-600 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                onClick={closeModal}
              >
                ×
              </button>
            </div>

            {/* FORM */}
            <form onSubmit={handleSubmit} className="space-y-6 p-6">
              <div className="grid gap-5 md:grid-cols-2">
                {/* NOMBRE */}
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Nombre
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

                {/* PRECIO */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Precio
                  </label>

                  <input
                    type="number"
                    step="0.01"
                    value={formData.precio}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        precio: e.target.value,
                      })
                    }
                    required
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"

                  />
                </div>

                {/* TIEMPO */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Tiempo (minutos)
                  </label>

                  <input
                    type="number"
                    value={formData.tiempo}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        tiempo: e.target.value,
                      })
                    }
                    required
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              {/* CHECKBOX */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <label className="flex items-center gap-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={formData.permite_domicilio}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        permite_domicilio: e.target.checked,
                      })
                    }
                    className="h-5 w-5 rounded border-white/20 text-slate-700 dark:bg-[#0f172a]"
                  />

                  Permite a domicilio
                </label>
              </div>

              {/* NOTAS */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Notas
                </label>

                <textarea
                  value={formData.notas}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      notas: e.target.value,
                    })
                  }
                  rows="4"
                  className="w-full rounded-2xl border border-gray-300 dark:border-white/10 bg-white dark:bg-[#0f172a] px-4 py-3 text-sm text-gray-900 dark:text-white outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:border-slate-500"
                />
              </div>

              {/* NEGOCIO */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Negocio
                </label>

                <div className="rounded-2xl border border-gray-300 dark:border-white/10 bg-white dark:bg-[#0f172a] px-4 py-3 text-sm text-gray-500 dark:text-slate-400">
                  {negocios.find(
                    n => n.id.toString() === formData.negocio_id
                  )?.name || 'Cargando..'}
                </div>
              </div>

              {/* ACTIONS */}
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
                  className="inline-flex items-center justify-center rounded-2xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition-all hover:bg-violet-700"
                >
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