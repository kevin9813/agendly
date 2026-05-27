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
    lazos_tiempo: false,
    activo: true,
  })
  const [horarios, setHorarios] = useState([])

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

  const loadHorarios = async (sucursal_id) => {
     try {
      const response = await fetch(`${apiUrl}sucursal-horarios/${sucursal_id}`)
      if (response.ok) {
        const data = await response.json()
        setHorarios(data.horarios || [])
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
      lazos_tiempo: Boolean(sucursal.lazos_tiempo),
      activo: Boolean(sucursal.activo),
    })
    setMessage('')
    loadHorarios(sucursal.id)
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
      lazos_tiempo: false,
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
        lazos_tiempo: Boolean(sucursalForm.lazos_tiempo),
        activo: Boolean(sucursalForm.activo),
        negocio_id: user.negocio_id,
        horarios: horarios,
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
    <div className="min-h-screen space-y-8 rounded-2xl border dark:border-slate-800 dark:bg-gray-800 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">
            Información del Negocio
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Botones futuros */}
        </div>
      </div>

      {/* Alert */}
      {message && (
        <div
          className={`rounded-2xl border px-5 py-4 text-sm font-medium shadow-sm ${
            message.includes('Error')
              ? 'border-red-200 bg-red-50 text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300'
          }`}
        >
          {message}
        </div>
      )}

      {/* Cards negocio */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-medium text-slate-500">
            Nombre del Negocio
          </p>

          <h2 className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
            {negocio.name}
          </h2>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-medium text-slate-500">
            Total Sucursales
          </p>

          <h2 className="mt-3 text-4xl font-bold text-slate-900 dark:text-white">
            {sucursales.length}
          </h2>
        </div>
      </div>

      {/* Edit negocio */}
      {editNegocio && (
        <form onSubmit={handleNegocioSubmit}>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Nombre del Negocio *
                </label>

                <input
                  type="text"
                  id="name"
                  name="name"
                  value={negocioForm.name}
                  onChange={handleNegocioChange}
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditNegocio(false)}
                  disabled={savingNegocio}
                  className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={savingNegocio}
                  className="rounded-2xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:bg-violet-700"
                >
                  {savingNegocio ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Sucursales */}
      <div className="space-y-5">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Sucursales
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Gestiona las sucursales que dependen de este negocio.
          </p>
        </div>

        {sucursales.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-900">
            No hay sucursales registradas aún.
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                <thead className="bg-slate-50 dark:bg-slate-800/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Nombre
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Ciudad
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Barrio
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Tel
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      WhatsApp
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Agenda
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Rango horario
                    </th>

                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Acciones
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {sucursales.map(sucursal => (
                    <tr
                      key={sucursal.id}
                      className="transition hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    >
                      <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                        {sucursal.name}
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                        {sucursal.ciudad}
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                        {sucursal.barrio}
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                        {sucursal.tel || '-'}
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                        {sucursal.whatsapp || '-'}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            sucursal.permite_agendar
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                              : 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300'
                          }`}
                        >
                          {sucursal.permite_agendar ? 'Sí' : 'No'}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            sucursal.lazos_tiempo
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                              : 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300'
                          }`}
                        >
                          {sucursal.lazos_tiempo ? 'Sí' : 'No'}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => openEditSucursal(sucursal)}
                          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {editingSucursal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm"
          onClick={cancelSucursalForm}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="relative max-h-[95vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl dark:bg-slate-900"
          >
            <form onSubmit={handleSucursalSubmit}>
              {/* Header */}
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 px-6 py-5 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
                <div>
                  <p className="text-sm font-medium text-violet-500">
                    Sucursales
                  </p>

                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Editar sucursal
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={cancelSucursalForm}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-xl text-slate-600 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                >
                  ×
                </button>
              </div>

              {/* Body */}
              <div className="space-y-6 p-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Nombre *
                    </label>

                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={sucursalForm.name}
                      onChange={handleSucursalChange}
                      required
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Teléfono
                    </label>

                    <input
                      type="tel"
                      id="tel"
                      name="tel"
                      value={sucursalForm.tel}
                      onChange={handleSucursalChange}
                      placeholder="Ej: 312 123 4567"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Dirección
                  </label>

                  <input
                    type="text"
                    id="direccion"
                    name="direccion"
                    value={sucursalForm.direccion}
                    onChange={handleSucursalChange}
                    placeholder="Ej: Calle Principal 123"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Barrio
                    </label>

                    <select
                      id="barrio_id"
                      name="barrio_id"
                      value={sucursalForm.barrio_id}
                      onChange={e => {
                        const selectedBarrio = barrios.find(
                          b => b.id.toString() === e.target.value
                        )

                        setSucursalForm(prev => ({
                          ...prev,
                          barrio_id: e.target.value,
                          ciudad_id: selectedBarrio
                            ? selectedBarrio.ciudad_id.toString()
                            : prev.ciudad_id,
                        }))
                      }}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    >
                      <option value="">Seleccionar barrio</option>

                      {barrios.map(barrio => (
                        <option key={barrio.id} value={barrio.id}>
                          {barrio.name} ({barrio.ciudad})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                      WhatsApp
                    </label>

                    <input
                      type="tel"
                      id="whatsapp"
                      name="whatsapp"
                      value={sucursalForm.whatsapp}
                      onChange={handleSucursalChange}
                      placeholder="Ej: 312 123 4567"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Notas
                  </label>

                  <textarea
                    id="horario"
                    name="horario"
                    rows="4"
                    value={sucursalForm.horario}
                    onChange={handleSucursalChange}
                    placeholder={`Ej:\nLunes a Viernes: 9:00 - 18:00`}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                      Horarios de Atención
                    </h2>

                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Configura los días y horarios disponibles para la sucursal.
                    </p>
                  </div>
                  <div className="space-y-3">
                    {horarios.map((horario, index) => (
                      <div
                        key={horario.dia_semana}
                        className={`
                          flex flex-col gap-4 rounded-xl border p-4 transition-all
                          md:flex-row md:items-center md:justify-between
                          
                          ${
                            horario.activo
                              ? 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800'
                              : 'border-slate-100 bg-slate-100 opacity-70 dark:border-slate-800 dark:bg-slate-950'
                          }
                        `}
                      >
                        {/* Día */}
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={horario.activo}
                            className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800"
                            onChange={(e) => {
                              const nuevos = [...horarios]
                              nuevos[index].activo = e.target.checked
                              setHorarios(nuevos)
                            }}
                          />

                          <span className="min-w-[100px] font-medium text-slate-700 dark:text-slate-200">
                            {horario.nombre}
                          </span>
                        </div>

                        {/* Horarios */}
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col">
                            <label className="mb-1 text-xs text-slate-500 dark:text-slate-400">
                              Inicio
                            </label>

                            <input
                              type="time"
                              value={horario.hora_inicio}
                              disabled={!horario.activo}
                              className="
                                rounded-lg border border-slate-300 bg-white px-3 py-2
                                text-slate-700 outline-none transition
                                focus:border-blue-500 focus:ring-2 focus:ring-blue-200
                                disabled:cursor-not-allowed disabled:opacity-50
                                dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200
                                dark:focus:border-blue-400 dark:focus:ring-blue-900
                              "
                              onChange={(e) => {
                                const nuevos = [...horarios]
                                nuevos[index].hora_inicio = e.target.value
                                setHorarios(nuevos)
                              }}
                            />
                          </div>

                          <span className="mt-5 text-slate-400">—</span>

                          <div className="flex flex-col">
                            <label className="mb-1 text-xs text-slate-500 dark:text-slate-400">
                              Fin
                            </label>

                            <input
                              type="time"
                              value={horario.hora_fin}
                              disabled={!horario.activo}
                              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:focus:border-blue-400 dark:focus:ring-blue-900"
                              onChange={(e) => {
                                const nuevos = [...horarios]
                                nuevos[index].hora_fin = e.target.value
                                setHorarios(nuevos)
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/50">
                  <label className="flex cursor-pointer items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-white">
                        Permitir agendamiento
                      </p>

                      <p className="text-sm text-slate-500">
                        Los clientes podrán reservar citas.
                      </p>
                    </div>

                    <input
                      type="checkbox"
                      id="permite_agendar"
                      name="permite_agendar"
                      checked={sucursalForm.permite_agendar}
                      onChange={handleSucursalChange}
                      className="h-5 w-5 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                    />
                  </label>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/50">
                  <label className="flex cursor-pointer items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-white">
                        Lazos de tiempo
                      </p>

                      <p className="text-sm text-slate-500">
                        Permitir agendar en lazos de tiempo 
                      </p>
                    </div>

                    <input
                      type="checkbox"
                      id="lazos_tiempo"
                      name="lazos_tiempo"
                      checked={sucursalForm.lazos_tiempo}
                      onChange={handleSucursalChange}
                      className="h-5 w-5 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                    />
                  </label>
                </div>
              </div>

              {/* Footer */}
              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 px-6 py-5 sm:flex-row sm:justify-end dark:border-slate-800">
                <button
                  type="button"
                  onClick={cancelSucursalForm}
                  disabled={savingSucursal}
                  className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={savingSucursal}
                  className="rounded-2xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:bg-violet-700"
                >
                  {savingSucursal ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default NegocioPage
