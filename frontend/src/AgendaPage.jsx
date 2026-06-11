import { useEffect, useState, useRef } from 'react'

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/'

// Función para formatear precios con puntos de miles
const formatPrice = (price) => {
  return parseFloat(price).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

function AgendaPage({ user }) {
  const [citas, setCitas] = useState([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedDayForCita, setSelectedDayForCita] = useState(null)
  const [viewMode, setViewMode] = useState('weekly') // 'monthly' o 'weekly'
  
  // Form data para crear cita
  const [clientes, setClientes] = useState([])
  const [empleados, setEmpleados] = useState([])
  const [servicios, setServicios] = useState([])
  const [coberturas, setCoberturas] = useState([])
  const [citaForm, setCitaForm] = useState({
    cliente_id: '',
    empleado_id: '',
    servicio_id: '',
    fecha: '',
    hora: '09:00',
    tipo_servicio: 'local',
    cobertura_id: '',
    direccion: '',
    notas: '',
    precio_final: '',
  })
  const [newClientName, setNewClientName] = useState('')
  const [newClientCelular, setNewClientCelular] = useState('')
  const [creatingCita, setCreatingCita] = useState(false)
  const [horaFin, setHoraFin] = useState('')
  const [searchCliente, setSearchCliente] = useState('');
  
  // Estados para editar cita
  const [isEditMode, setIsEditMode] = useState(false)
  const [editCitaForm, setEditCitaForm] = useState({
    cliente_id: '',
    empleado_id: '',
    servicio_id: '',
    fecha: '',
    hora: '09:00',
    tipo_servicio: 'local',
    cobertura_id: '',
    direccion: '',
    notas: '',
    precio_final: '',
  })
  const [editHoraFin, setEditHoraFin] = useState('')
  const [updatingCita, setUpdatingCita] = useState(false)
  const [selectedUsuarioId, setSelectedUsuarioId] = useState('')

  useEffect(() => {
    loadCitas()
  }, [currentDate, user, viewMode, selectedUsuarioId])

  useEffect(() => {
    if (user?.negocio_id) {
      loadDataForForm()
    }
  }, [user])

  useEffect(() => {
    if (user?.rol !== 'Administrador') {
      setSelectedUsuarioId('')
    }
  }, [user?.rol])

  // Calcular hora fin cuando cambien servicio u hora
  useEffect(() => {
    if (citaForm.servicio_id && citaForm.hora) {
      const servicio = servicios.find(s => s.id === parseInt(citaForm.servicio_id))
      if (servicio) {
        const [horas, minutos] = citaForm.hora.split(':').map(Number)
        const inicio = new Date(2024, 0, 1, horas, minutos)
        const fin = new Date(inicio.getTime() + servicio.tiempo * 60000)
        const horaFinStr = String(fin.getHours()).padStart(2, '0') + ':' + String(fin.getMinutes()).padStart(2, '0')
        setHoraFin(horaFinStr)
      }
    } else {
      setHoraFin('')
    }
  }, [citaForm.servicio_id, citaForm.hora, servicios])

  // Calcular hora fin en modo edición
  useEffect(() => {
    if (editCitaForm.servicio_id && editCitaForm.hora) {
      const servicio = servicios.find(s => s.id === parseInt(editCitaForm.servicio_id))
      if (servicio) {
        const [horas, minutos] = editCitaForm.hora.split(':').map(Number)
        const inicio = new Date(2024, 0, 1, horas, minutos)
        const fin = new Date(inicio.getTime() + servicio.tiempo * 60000)
        const horaFinStr = String(fin.getHours()).padStart(2, '0') + ':' + String(fin.getMinutes()).padStart(2, '0')
        setEditHoraFin(horaFinStr)
      }
    }
  }, [editCitaForm.servicio_id, editCitaForm.hora, servicios])

  const loadDataForForm = async () => {
    try {
      const [clientesRes, empleadosRes, serviciosRes, coberturasRes] = await Promise.all([
        fetch(`${apiUrl}clientes/`, { credentials: 'include' }),
        fetch(`${apiUrl}usuarios/`, { credentials: 'include' }),
        fetch(`${apiUrl}servicios/`, { credentials: 'include' }),
        fetch(`${apiUrl}coberturas/?negocio_id=${user.negocio_id}`, { credentials: 'include' }),
      ])
      
      const clientesData = await clientesRes.json()
      const empleadosData = await empleadosRes.json()
      const serviciosData = await serviciosRes.json()
      const coberturasData = await coberturasRes.json()
      
      setClientes(clientesData.clientes || [])
      // Filtrar solo usuarios del negocio actual
      const empleadosFiltrados = (empleadosData.usuarios || []).filter(
        u => String(u.negocio_id) === String(user.negocio_id)
      )
      setEmpleados(empleadosFiltrados)
      // Filtrar servicios del negocio actual
      const serviciosFiltrados = (serviciosData.servicios || []).filter(
        s => s.negocio_id === user.negocio_id
      )
      setServicios(serviciosFiltrados)
      setCoberturas(coberturasData.coberturas || [])
    } catch (error) {
      console.error('Error loading form data:', error)
    }
  }

  const loadCitas = async () => {
    setLoading(true)
    try {
      if (!user || !user.negocio_id) {
        setCitas([])
        return
      }
      const weekDays = getWeekDays(currentDate)
      const fecha_inicio = viewMode === 'monthly'
        ? `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-01`
        : `${weekDays[0].getFullYear()}-${String(weekDays[0].getMonth() + 1).padStart(2, '0')}-${String(weekDays[0].getDate()).padStart(2, '0')}`
      const fecha_fin = viewMode === 'monthly'
        ? `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(getDaysInMonth(currentDate)).padStart(2, '0')}`
        : `${weekDays[6].getFullYear()}-${String(weekDays[6].getMonth() + 1).padStart(2, '0')}-${String(weekDays[6].getDate()).padStart(2, '0')}`

      const body = {
        fecha_inicio,
        fecha_fin,
        negocio_id: Number(user.negocio_id),
      }

      if (selectedUsuarioId) {
        body.usuario_id = Number(selectedUsuarioId)
      }

      const response = await fetch(`${apiUrl}citas/filter/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include',
      })
      const data = await response.json()
      let citasData = data.citas || []
      if (selectedUsuarioId) {
        citasData = citasData.filter(cita => String(cita.empleado_id) === String(selectedUsuarioId))
      }
      setCitas(citasData)
    } catch (error) {
      console.error('Error loading citas:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const getCitasForDay = (day) => {
    const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
      .toISOString()
      .split('T')[0]
    return citas.filter(cita => cita.fecha_hora.startsWith(dateStr))
  }

  const getCitasToday = () => {
    const today = new Date().toISOString().split('T')[0]
    return citas.filter(cita => cita.fecha_hora.startsWith(today)).sort((a, b) => a.fecha_hora.localeCompare(b.fecha_hora))
  }

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const previousWeek = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() - 7)
    setCurrentDate(newDate)
  }

  const nextWeek = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() + 7)
    setCurrentDate(newDate)
  }

  const getWeekDays = (date) => {
    const curr = new Date(date)
    curr.setDate(curr.getDate() - curr.getDay())
    const weekDays = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(curr)
      day.setDate(day.getDate() + i)
      weekDays.push(day)
    }
    return weekDays
  }

  const openCreateCitaModal = (selectedDay) => {
    const selectedDate =
      typeof selectedDay === 'number'
        ? new Date(currentDate.getFullYear(), currentDate.getMonth(), selectedDay)
        : selectedDay
    const dateStr = selectedDate.toISOString().split('T')[0]
    setSelectedDayForCita(selectedDate.getDate())
    
    // Si es empleado, setear automáticamente el empleado_id
    const empleado_id = user.rol === 'Empleado' ? user.id : ''
    
    setCitaForm({
      cliente_id: '',
      empleado_id: empleado_id,
      servicio_id: '',
      fecha: dateStr,
      hora: '09:00',
      notas: '',
    })
    loadDataForForm()
    setShowCreateModal(true)
  }

  const handleCreateCliente = async () => {
    if (!newClientName.trim()) {
      alert('Por favor ingresa el nombre del cliente')
      return
    }
    
    try {
      const response = await fetch(`${apiUrl}clientes/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: newClientName,
          celular: newClientCelular,
          negocio_id: user.negocio_id,
        }),
        credentials: 'include',
      })
      
      if (response.ok) {
        const data = await response.json()
        setClientes([...clientes, data.cliente])
        setCitaForm({ ...citaForm, cliente_id: data.cliente.id })
        setNewClientName('')
        setNewClientCelular('')
      } else {
        alert('Error al crear cliente')
      }
    } catch (error) {
      console.error('Error creating cliente:', error)
      alert('Error al crear cliente')
    }
  }

  const normalizePhoneForWhatsApp = (phone) => {
    if (!phone) return ''
    return phone.replace(/[^0-9]/g, '').replace(/^0+/, '')
  }

  const sendWhatsAppConfirmation = (telefono, nombreCliente, fecha, hora, servicio) => {
    const number = normalizePhoneForWhatsApp(telefono)
    if (!number) return

    const text = `Hola ${nombreCliente}, tu cita ha sido confirmada para el ${fecha} a las ${hora} para el servicio ${servicio}.`
    const url = `https://wa.me/+57${number}?text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
  }

  const initializeEditForm = (event) => {
    const fecha = event.fecha_hora.split('T')[0]
    const hora = event.fecha_hora.split('T')[1].substring(0, 5)
    
    setEditCitaForm({
      cliente_id: event.cliente_id,
      empleado_id: event.empleado_id,
      servicio_id: event.servicio_id,
      fecha,
      hora,
      estado: event.estado,
      tipo_servicio: event.tipo_servicio || 'local',
      cobertura_id: event.cobertura_id ? event.cobertura_id.toString() : '',
      direccion: event.direccion || '',
      notas: event.notas,
    })
    loadDataForForm()
    setIsEditMode(true)
  }

  const handleUpdateCita = async (e) => {
    e.preventDefault()
    
    if (!editCitaForm.cliente_id || !editCitaForm.empleado_id || !editCitaForm.servicio_id) {
      alert('Por favor completa todos los campos requeridos')
      return
    }

    let estado = 'confirmada'
    // Validar que la fecha no sea anterior a hoy
    const today = new Date().toISOString().split('T')[0]
    if (editCitaForm.fecha < today) {
      if(user.rol === 'Administrador'){
        estado = 'completada'
      }else{
        alert('No se puede agendar citas en fechas anteriores a hoy')
        return

      }
    }
    
    setUpdatingCita(true)
    
    try {
      const fechaHora = `${editCitaForm.fecha}T${editCitaForm.hora}:00`
      const response = await fetch(`${apiUrl}citas/${selectedEvent.id}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente_id: parseInt(editCitaForm.cliente_id),
          empleado_id: parseInt(editCitaForm.empleado_id),
          servicio_id: parseInt(editCitaForm.servicio_id),
          fecha_hora: fechaHora,
          estado: editCitaForm.estado,
          tipo_servicio: editCitaForm.tipo_servicio,
          cobertura_id: editCitaForm.cobertura_id ? parseInt(editCitaForm.cobertura_id) : null,
          direccion: editCitaForm.direccion,
          notas: editCitaForm.notas,
        }),
        credentials: 'include',
      })
      
      if (response.ok) {
        // Recargar citas
        await loadCitas()
        setSelectedEvent(null)
        setIsEditMode(false)
        alert('¡Cita actualizada correctamente!')
      } else {
        const error = await response.json()
        alert(`Error: ${error.detail || 'Error al actualizar cita'}`)
      }
    } catch (error) {
      console.error('Error updating cita:', error)
      alert('Error al actualizar cita')
    } finally {
      setUpdatingCita(false)
    }
  }

  const handleDeleteCita = async () => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta cita?')) {
      return
    }

    try {
      const response = await fetch(`${apiUrl}citas/${selectedEvent.id}/`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      })
      
      if (response.ok) {
        // Recargar citas
        await loadCitas()
        setSelectedEvent(null)
        alert('¡Cita eliminada correctamente!')
      } else {
        const error = await response.json()
        alert(`Error: ${error.detail || 'Error al eliminar cita'}`)
      }
    } catch (error) {
      console.error('Error deleting cita:', error)
      alert('Error al eliminar cita')
    }
  }

  const handleCreateCita = async (e) => {
    e.preventDefault()
    
    
    if (!citaForm.cliente_id || !citaForm.empleado_id || !citaForm.servicio_id) {
      alert('Por favor completa todos los campos requeridos')
      return
    }

    let estado = 'confirmada'
    // Validar que la fecha no sea anterior a hoy
    const today = new Date().toISOString().split('T')[0]
    if (citaForm.fecha < today) {
      if(user.rol === 'Administrador'){
        estado = 'completada'
      }else{
        alert('No se puede agendar citas en fechas anteriores a hoy')
        return

      }
    }
    
    setCreatingCita(true)
    
    try {
      const fechaHora = `${citaForm.fecha}T${citaForm.hora}:00`
      const response = await fetch(`${apiUrl}citas/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente_id: parseInt(citaForm.cliente_id),
          empleado_id: parseInt(citaForm.empleado_id),
          servicio_id: parseInt(citaForm.servicio_id),
          fecha_hora: fechaHora,
          estado: estado,
          tipo_servicio: citaForm.tipo_servicio,
          cobertura_id: citaForm.cobertura_id ? parseInt(citaForm.cobertura_id) : null,
          direccion: citaForm.direccion,
          notas: citaForm.notas,
          precio_final: citaForm.precio_final ? parseFloat(citaForm.precio_final) : parseFloat(servicioSeleccionado?.precio),
        }),
        credentials: 'include',
      })
      
      if (response.ok) {
        const data = await response.json()
        // Recargar citas
        await loadCitas()
        setShowCreateModal(false)

        if (data.cita?.cliente_celular) {
          sendWhatsAppConfirmation(
            data.cita.cliente_celular,
            data.cita.cliente,
            citaForm.fecha,
            citaForm.hora,
            data.cita.servicio,
          )
        }

        alert('¡Cita creada correctamente! La confirmación se abrirá en WhatsApp si el cliente tiene celular.')
      } else {
        const error = await response.json()
        alert(`Error: ${error.detail || 'Error al crear cita'}`)
      }
    } catch (error) {
      console.error('Error creating cita:', error)
      alert('Error al crear cita')
    } finally {
      setCreatingCita(false)
    }
  }

  const servicioSeleccionado = servicios.find(
    s => s.id === Number(citaForm.servicio_id)
  )

  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
  const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sab']

  const daysInMonth = getDaysInMonth(currentDate)
  const firstDay = getFirstDayOfMonth(currentDate)
  const days = []

  // Empty cells before the first day
  for (let i = 0; i < firstDay; i++) {
    days.push(null)
  }

  // Days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i)
  }

  if (loading) {
    return <div className="loading">Cargando agenda...</div>
  }

  return (
    <div className="min-h-screen text-white p-6 rounded-2xl border dark:border-slate-800 dark:bg-gray-800">
      <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        {/* LEFT */}
        <div>
          <p className="text-sm uppercase tracking-widest text-gray-500 dark:text-gray-400">
            Calendario
          </p>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Agenda
          </h1>
        </div>
        {/* RIGHT */}
        <div className="flex flex-wrap items-center gap-3">

          {/* VIEW MODE */}
          <div className="flex items-center rounded-xl border dark:border-slate-800 dark:bg-slate-900 p-1">

            <button
              type="button"
              onClick={() => setViewMode('monthly')}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                viewMode === 'monthly'
                  ? 'bg-indigo-500 dark:text-white'
                  : 'text-slate-400 dark:hover:text-white'
              }`}
            >
              Mes
            </button>

            <button
              type="button"
              onClick={() => setViewMode('weekly')}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                viewMode === 'weekly'
                  ? 'bg-indigo-500 dark:text-white'
                  : 'text-slate-400 dark:hover:text-white'
              }`}
            >
              Semana
            </button>
          </div>

          {/* FILTRO POR USUARIO */}
          {user?.rol === 'Administrador' && (
            <div className="rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2 text-sm text-gray-700 dark:text-slate-200">
              <label className="mr-2 text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400">
                Usuario
              </label>
              <select
                value={selectedUsuarioId}
                onChange={(e) => setSelectedUsuarioId(e.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              >
                <option value="">Todos</option>
                {empleados.map((empleado) => (
                  <option key={empleado.id} value={empleado.id}>
                    {empleado.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* PREVIOUS */}
          <button
            type="button"
            onClick={() =>
              viewMode === 'monthly'
                ? previousMonth()
                : previousWeek()
            }
            className="rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-medium text-gray-700 dark:text-white transition hover:bg-gray-100 dark:hover:bg-slate-800"
          >
            ←
          </button>

          {/* DATE */}
          <div className="rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-2 text-sm font-medium text-gray-700 dark:text-slate-200">
            {viewMode === 'monthly'
              ? `${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`
              : `Semana del ${
                  getWeekDays(currentDate)[0].toLocaleDateString('es-EN')
                } al ${
                  getWeekDays(currentDate)[6].toLocaleDateString('es-EN')
                }`}
          </div>

          {/* NEXT */}
          <button
            type="button"
            onClick={() =>
              viewMode === 'monthly'
                ? nextMonth()
                : nextWeek()
            }
            className="rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-medium text-gray-700 dark:text-white transition hover:bg-gray-100 dark:hover:bg-slate-800"
          >
            →
          </button>

          {/* CREATE */}
          <button
            type="button"
            onClick={() => openCreateCitaModal(new Date().getDate())}
            className="rounded-xl bg-indigo-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-600"
          >
            + Nueva Cita
          </button>

        </div>
      </div>

      {viewMode === 'monthly' && (
        <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-gray-900 shadow-xl">

          <table className="w-full border-collapse">

            {/* HEADER */}
            <thead>
              <tr className="border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900">

                {weekDays.map(day => (
                  <th
                    key={day}
                    className="border-r border-gray-200 dark:border-slate-800 px-4 py-4 text-center text-sm font-semibold text-gray-700 dark:text-slate-300 last:border-r-0"
                  >
                    {day}
                  </th>
                ))}

              </tr>
            </thead>

            {/* BODY */}
            <tbody>

              {Array(Math.ceil(days.length / 7))
                .fill(0)
                .map((_, weekIndex) => (

                  <tr key={weekIndex}>

                    {days
                      .slice(
                        weekIndex * 7,
                        (weekIndex + 1) * 7
                      )
                      .map((day, dayIndex) => {

                        const citasDelDia = day
                          ? getCitasForDay(day)
                          : []

                        const isToday =
                          day === new Date().getDate() &&
                          currentDate.getMonth() ===
                            new Date().getMonth() &&
                          currentDate.getFullYear() ===
                            new Date().getFullYear()

                        return (
                          <td
                            key={dayIndex}
                            onClick={() =>
                              day && openCreateCitaModal(day)
                            }
                           className={`
                            h-[170px] align-top border-r border-b border-gray-200 dark:border-slate-800 p-2 transition
                            ${
                              day
                                ? 'cursor-pointer bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-slate-800/40'
                                : 'bg-gray-50 dark:bg-slate-950'
                            }
                          `}
                          >

                            {day && (
                              <div className="flex h-full flex-col">

                                {/* DAY NUMBER */}
                                <div className="mb-2 flex items-center justify-between">

                                  <div
                                    className={`
                                      flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold
                                      ${
                                        isToday
                                          ? 'bg-indigo-500 dark:text-white'
                                          : 'text-slate-300'
                                      }
                                    `}
                                  >
                                    {day}
                                  </div>

                                </div>

                                {/* EVENTS */}
                                <div className="flex flex-1 flex-col gap-2 overflow-hidden">

                                  {citasDelDia.map(cita => (
                                    <div
                                      key={cita.id}
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setSelectedEvent(cita)
                                      }}
                                      title={`${cita.servicio} - ${cita.empleado} (${cita.servicio_tiempo} min)`}
                                      className="rounded-lg p-2 text-xs text-white shadow transition hover:opacity-90"
                                      style={{
                                        backgroundColor:
                                          cita.empleado_color || '#4ECDC4',
                                        color: '#fff',
                                      }}
                                    >

                                      <div className="truncate font-semibold">
                                        {cita.servicio.substring(
                                          0,
                                          10
                                        )}
                                      </div>

                                      <div className="truncate text-[11px] opacity-90">
                                        {cita.empleado}
                                      </div>

                                      <div className="mt-1 text-[10px] opacity-80">
                                        {new Date(
                                          cita.fecha_hora
                                        ).toLocaleTimeString(
                                          'es-EN',
                                          {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                          }
                                        )}
                                        {' - '}
                                        {cita.hora_fin
                                          ? new Date(
                                              cita.hora_fin
                                            ).toLocaleTimeString(
                                              'es-EN',
                                              {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                              }
                                            )
                                          : 'N/A'}
                                      </div>

                                    </div>
                                  ))}

                                </div>

                              </div>
                            )}

                          </td>
                        )
                      })}

                  </tr>
                ))}

            </tbody>

          </table>

        </div>
      )}

      {viewMode === 'weekly' && (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-gray-900 shadow-xl">

          <table className="w-full border-collapse min-w-[900px]">

            {/* HEADER */}
            <thead>
              <tr className="border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900">

                {getWeekDays(currentDate).map((day, idx) => (

                  <th
                    key={idx}
                    className="min-w-[140px] border-r border-gray-200 dark:border-slate-800 px-4 py-4 text-center last:border-r-0"
                  >

                    <div className="text-sm font-semibold text-gray-700 dark:text-slate-200">
                      {weekDays[day.getDay()]}
                    </div>

                    <div className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                      {day.toLocaleDateString('es-EN', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </div>

                  </th>

                ))}

              </tr>
            </thead>

            {/* BODY */}
            <tbody>
              <tr>

                {getWeekDays(currentDate).map((day, idx) => {

                  const dateStr = `${day.getFullYear()}-${String(
                    day.getMonth() + 1
                  ).padStart(2, '0')}-${String(
                    day.getDate()
                  ).padStart(2, '0')}`

                  const citasDelDia = citas
                    .filter(cita =>
                      cita.fecha_hora.startsWith(dateStr)
                    )
                    .sort((a, b) =>
                      a.fecha_hora.localeCompare(
                        b.fecha_hora
                      )
                    )

                  const isToday =
                    day.toDateString() ===
                    new Date().toDateString()

                  return (
                    <td
                      key={idx}
                      onClick={() =>
                        openCreateCitaModal(day.getDate())
                      }
                      className={`
                        min-h-[500px] min-w-[140px] align-top border-r border-gray-200 dark:border-slate-800 p-4 transition cursor-pointer
                        ${
                          isToday
                            ? 'bg-gray-100 dark:bg-slate-800/40'
                            : 'bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-slate-800/30'
                        }
                      `}
                    >

                      <div className="flex flex-col gap-3">

                        {citasDelDia.map(cita => (

                          <div
                            key={cita.id}
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedEvent(cita)
                            }}
                            className="cursor-pointer rounded-xl p-3 text-white shadow transition hover:opacity-90"
                            style={{
                              backgroundColor:
                                cita.empleado_color || '#4ECDC4',
                              color: '#fff',
                            }}
                          >

                            <div className="truncate text-sm font-semibold">
                              {cita.servicio.substring(0, 8)}
                            </div>

                            <div className="mt-1 text-xs opacity-90">
                              {cita.empleado}
                            </div>

                            <div className="mt-2 text-[11px] opacity-80">
                              {new Date(
                                cita.fecha_hora
                              ).toLocaleTimeString(
                                'es-EN',
                                {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                }
                              )}
                              {' - '}
                              {cita.hora_fin
                                ? new Date(
                                    cita.hora_fin
                                  ).toLocaleTimeString(
                                    'es-EN',
                                    {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    }
                                  )
                                : 'N/A'}
                            </div>

                          </div>

                        ))}

                      </div>

                    </td>
                  )
                })}

              </tr>
            </tbody>

          </table>

        </div>
      )}

      {selectedEvent && !isEditMode && (
        <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
        onClick={() => setSelectedEvent(null)}
        >

        <div
          className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-gray-100 border dark:border-slate-800 dark:bg-gray-900 shadow-2xl"
          onClick={e => e.stopPropagation()}
        >

          {/* CLOSE */}
          <button
            onClick={() => setSelectedEvent(null)}
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/30 text-xl text-white transition hover:bg-black/50"
          >
            ×
          </button>

          {/* HEADER */}
          <div
            className="p-6"
            style={{
              backgroundColor: selectedEvent.empleado_color || '#4ECDC4',
            }}
          >

            <h2 className="text-2xl font-bold text-white">
              {selectedEvent.servicio}
            </h2>

          </div>

          {/* BODY */}
          <div className="space-y-5 p-6">

            {/* EMPLEADO */}
            <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950/40 p-4">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-900 dark:text-slate-400">
                Empleado
              </label>

              <p className="text-base font-medium text-gray-700 dark:text-white">
                {selectedEvent.empleado}
              </p>
            </div>

            {/* CLIENTE */}
            <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950/40 p-4">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-900 dark:text-slate-400">
                Cliente
              </label>

              <p className="text-base font-medium text-gray-700 dark:text-white">
                {selectedEvent.cliente}
              </p>
            </div>

            {/* SERVICIO */}
            <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950/40 p-4">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-900 dark:text-slate-400">
                Servicio
              </label>

              <p className="text-base font-medium text-gray-700 dark:text-white">
                {selectedEvent.servicio} ({selectedEvent.servicio_tiempo} minutos)
              </p>
            </div>

            {/* HORARIO */}
            <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950/40 p-4">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-900 dark:text-slate-400">
                Horario
              </label>

              <p className="text-base font-medium text-gray-700 dark:text-white">
                {new Date(
                  selectedEvent.fecha_hora
                ).toLocaleString('es-EN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
                {' - '}
                {selectedEvent.hora_fin
                  ? new Date(
                      selectedEvent.hora_fin
                    ).toLocaleString('es-EN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'N/A'}
              </p>
            </div>

            {/* ESTADO */}
            <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950/40 p-4">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-900 dark:text-slate-400">
                Estado
              </label>

              <span
                className={`
                  inline-flex rounded-full px-3 py-1 text-sm font-semibold
                  ${
                    selectedEvent.estado === 'confirmada'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : selectedEvent.estado === 'cancelada'
                      ? 'bg-red-500/20 text-red-400'
                      : selectedEvent.estado === 'completada'
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'bg-yellow-500/20 text-yellow-400'
                  }
                `}
              >
                {selectedEvent.estado}
              </span>
            </div>

            {/* NOTAS */}
            {selectedEvent.notas && (
              <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950/40 p-4">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-900 dark:text-slate-400">
                  Notas
                </label>

                <p className="text-base text-gray-700 dark:text-slate-200">
                  {selectedEvent.notas}
                </p>
              </div>
            )}

          </div>

          {/* FOOTER */}
          <div className="flex flex-wrap items-center justify-end gap-3 border-t dark:border-slate-800 p-6">

            <button
              onClick={() => setSelectedEvent(null)}
              className="rounded-xl border dark:border-slate-700 dark:bg-slate-800 px-5 py-2 text-sm font-medium text-white transition dark:hover:bg-slate-700"
            >
              Cerrar
            </button>

            <button
              onClick={() => initializeEditForm(selectedEvent)}
              className="rounded-xl bg-indigo-500 px-5 py-2 text-sm font-semibold dark:text-white transition hover:bg-indigo-600"
            >
              Editar
            </button>

            <button
              onClick={handleDeleteCita}
              className="rounded-xl bg-red-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
            >
              Eliminar
            </button>

          </div>

        </div>
        </div>
      )}

      {selectedEvent && isEditMode && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => {
            setSelectedEvent(null)
            setIsEditMode(false)
          }}
        >

          <div
            className="relative max-h-[95vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-gray-100 border dark:border-slate-800 dark:bg-gray-900 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >

            {/* CLOSE */}
            <button
              className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/30 text-xl text-gray-800 dark:text-white transition hover:bg-black/50"
              onClick={() => {
                setSelectedEvent(null)
                setIsEditMode(false)
              }}
            >
              ×
            </button>

            {/* HEADER */}
            <div className="border-b dark:border-slate-800 dark:bg-indigo-500 p-6">
              <h2 className="text-2xl font-bold text-gray-700 dark:text-white">
                Editar Cita
              </h2>
            </div>

            {/* FORM */}
            <form
              onSubmit={handleUpdateCita}
              className="space-y-6 p-6"
            >

              {/* FECHA */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">
                  Fecha
                </label>
                <input required type="date" value={editCitaForm.fecha}
                  onChange={e =>
                    setEditCitaForm({
                      ...editCitaForm,
                      fecha: e.target.value,
                    })
                  }
                  onClick={(e) => e.target.showPicker()}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-gray-900 dark:text-white outline-none transition focus:border-indigo-500 dark:[color-scheme:dark]"
                />
              </div>

              {/* SERVICIO */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">
                  Servicio
                </label>

                <select
                  value={editCitaForm.servicio_id}
                  onChange={e =>
                    setEditCitaForm({
                      ...editCitaForm,
                      servicio_id: e.target.value,
                    })
                  }
                  required
                  className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-gray-900 dark:text-white outline-none transition focus:border-indigo-500 dark:[color-scheme:dark]"
                >
                  <option value="">Seleccionar servicio</option>

                  {servicios.map(servicio => (
                    <option
                      key={servicio.id}
                      value={servicio.id}
                    >
                      {servicio.name} - $
                      {formatPrice(servicio.precio)} (
                      {servicio.tiempo} min)
                    </option>
                  ))}
                </select>
              </div>

              {/* HORAS */}
              <div className="grid gap-4 md:grid-cols-2">

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Hora
                  </label>

                  <input required type="time" value={editCitaForm.hora}
                    onChange={e =>
                      setEditCitaForm({
                        ...editCitaForm,
                        hora: e.target.value,
                      })
                    }
                  className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-gray-900 dark:text-white outline-none transition focus:border-indigo-500 dark:[color-scheme:dark]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Hora Fin
                  </label>

                  <input
                    type="time"
                    value={editHoraFin}
                    onChange={e =>
                      setEditHoraFin(e.target.value)
                    }
                    className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-gray-900 dark:text-white outline-none transition focus:border-indigo-500 dark:[color-scheme:dark]"
                  />
                </div>

              </div>

              {/* CLIENTE */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">
                  Cliente
                </label>

                <select
                  value={editCitaForm.cliente_id}
                  onChange={e =>
                    setEditCitaForm({
                      ...editCitaForm,
                      cliente_id: e.target.value,
                    })
                  }
                  required
                  className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-gray-900 dark:text-white outline-none transition focus:border-indigo-500 dark:[color-scheme:dark]"
                >
                  <option value="">
                    Seleccionar cliente
                  </option>

                  {clientes.map(cliente => (
                    <option
                      key={cliente.id}
                      value={cliente.id}
                    >
                      {cliente.name}{' '}
                      {cliente.celular
                        ? `(${cliente.celular})`
                        : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* EMPLEADO */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">
                  Empleado
                </label>

                <select
                  value={editCitaForm.empleado_id}
                  onChange={e =>
                    setEditCitaForm({
                      ...editCitaForm,
                      empleado_id: e.target.value,
                    })
                  }
                  disabled={user.rol === 'Empleado'}
                  required
                  className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-gray-900 dark:text-white outline-none transition focus:border-indigo-500 dark:[color-scheme:dark]"
                >
                  <option value="">
                    Seleccionar empleado
                  </option>

                  {empleados.map(empleado => (
                    <option
                      key={empleado.id}
                      value={empleado.id}
                    >
                      {empleado.name} (
                      {empleado.sucursal})
                    </option>
                  ))}
                </select>
              </div>

              {/* TIPO SERVICIO */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">
                  Tipo de servicio
                </label>

                <select
                  value={editCitaForm.tipo_servicio}
                  onChange={e =>
                    setEditCitaForm(prev => ({
                      ...prev,
                      tipo_servicio: e.target.value,
                      cobertura_id:
                        e.target.value === 'domicilio'
                          ? prev.cobertura_id
                          : '',
                      direccion:
                        e.target.value === 'domicilio'
                          ? prev.direccion
                          : '',
                    }))
                  }
                  className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-gray-900 dark:text-white outline-none transition focus:border-indigo-500 dark:[color-scheme:dark]"
                >
                  <option value="local">
                    En local
                  </option>


                  <option value="domicilio">
                    A domicilio
                  </option>
                </select>
              </div>

              {/* DOMICILIO */}
              {editCitaForm.tipo_servicio ===
                'domicilio' && (
                <>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">
                      Cobertura
                    </label>

                    <select
                      value={editCitaForm.cobertura_id}
                      onChange={e =>
                        setEditCitaForm({
                          ...editCitaForm,
                          cobertura_id:
                            e.target.value,
                        })
                      }
                      required
                      className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-gray-900 dark:text-white outline-none transition focus:border-indigo-500 dark:[color-scheme:dark]"
                    >
                      <option value="">
                        Seleccionar cobertura
                      </option>

                      {coberturas.map(cobertura => (
                        <option
                          key={cobertura.id}
                          value={cobertura.id}
                        >
                          {cobertura.barrio} - +$
                          {formatPrice(
                            cobertura.costo_extra
                          )}{' '}
                          (
                          {
                            cobertura.tiempo_estimado
                          }{' '}
                          min)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">
                      Dirección
                    </label>

                    <input
                      type="text"
                      value={editCitaForm.direccion}
                      onChange={e =>
                        setEditCitaForm({
                          ...editCitaForm,
                          direccion:
                            e.target.value,
                        })
                      }
                      placeholder="Dirección para domicilio"
                      required
                      className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-gray-900 dark:text-white outline-none transition focus:border-indigo-500 dark:[color-scheme:dark]"
                    />
                  </div>
                </>
              )}

              {/* ESTADO */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">
                  Estado
                </label>

                <select
                  value={editCitaForm.estado}
                  onChange={e =>
                    setEditCitaForm({
                      ...editCitaForm,
                      estado: e.target.value,
                    })
                  }
                  required
                  className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-gray-900 dark:text-white outline-none transition focus:border-indigo-500 dark:[color-scheme:dark]"
                >
                  <option value="pendiente">
                    Pendiente
                  </option>

                  <option value="confirmada">
                    Confirmada
                  </option>

                  <option value="cancelada">
                    Cancelada
                  </option>

                  <option value="completada">
                    Completada
                  </option>
                </select>
              </div>

              {/* NOTAS */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300">
                  Notas (opcional)
                </label>

                <textarea
                  value={editCitaForm.notas}
                  onChange={e =>
                    setEditCitaForm({
                      ...editCitaForm,
                      notas: e.target.value,
                    })
                  }
                  rows="4"
                  className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-gray-900 dark:text-white outline-none transition focus:border-indigo-500 dark:[color-scheme:dark]"
                />
              </div>

              {/* ACTIONS */}
              <div className="flex flex-wrap justify-end gap-3 border-t dark:border-slate-800 pt-6">

                <button
                  type="button"
                  onClick={() => {
                    setSelectedEvent(null)
                    setIsEditMode(false)
                  }}
                  className="rounded-xl border dark:border-slate-700 dark:bg-slate-800 px-5 py-3 text-sm text-gray-700 font-medium dark:text-white transition dark:hover:bg-slate-700"
                  disabled={updatingCita}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="rounded-xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white transition dark:hover:bg-indigo-600 disabled:opacity-60"
                  disabled={updatingCita}
                >
                  {updatingCita
                    ? 'Actualizando...'
                    : 'Guardar Cambios'}
                </button>

              </div>

            </form>

          </div>
        </div>
      )}

      <div className="mt-8 grid gap-6 xl:grid-cols-12">
        {/* CITAS HOY */}
        <div className="xl:col-span-8">

        <div className="overflow-hidden rounded-3xl border dark:border-slate-800 dark:bg-gray-900 shadow-xl">

          {/* HEADER */}
          <div className="border-b dark:border-slate-800 px-6 py-5">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Citas de Hoy
            </h2>

            <p className="mt-1 text-sm text-gray-900 dark:text-slate-400">
              {new Date().toLocaleDateString('es-EN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>

          {/* BODY */}
          <div className="p-6">

            {getCitasToday().length === 0 ? (

              <div className="rounded-2xl border border-dashed dark:border-slate-700 dark:bg-slate-950/40 px-6 py-16 text-center">
                <p className="text-slate-400">
                  No hay citas para hoy
                </p>
              </div>

            ) : (

              <div className="space-y-4">

                {getCitasToday().map(cita => (

                  <div
                    key={cita.id}
                    onClick={() => setSelectedEvent(cita)}
                    className="group cursor-pointer rounded-2xl border dark:border-slate-800 dark:bg-slate-950/40 p-5 transition hover:border-slate-200 hover:bg-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-900"
                    style={{
                      borderLeft: `4px solid ${cita.empleado_color || '#4ECDC4'}`,
                    }}
                  >

                    <div className="flex items-start justify-between gap-4">

                      <div className="flex-1">

                        {/* TOP */}
                        <div className="mb-3 flex flex-wrap items-center gap-3">

                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {cita.servicio}
                          </h3>

                          <span
                            className={`
                              rounded-full px-3 py-1 text-xs font-semibold
                              ${
                                cita.estado === 'confirmada'
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : cita.estado === 'cancelada'
                                  ? 'bg-red-500/20 text-red-400'
                                  : cita.estado === 'completada'
                                  ? 'bg-blue-500/20 text-blue-400'
                                  : 'bg-yellow-500/20 text-yellow-400'
                              }
                            `}
                          >
                            {cita.estado}
                          </span>

                        </div>

                        {/* EMPLEADO */}
                        <div className="mb-2 text-sm text-slate-400">
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {cita.empleado}
                          </span>{' '}
                          → {cita.cliente}
                        </div>

                        {/* HORA */}
                        <div className="text-sm text-slate-700 dark:text-slate-300">
                          ⏰{' '}
                          {new Date(
                            cita.fecha_hora
                          ).toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                          -{' '}
                          {cita.hora_fin
                            ? new Date(
                                cita.hora_fin
                              ).toLocaleTimeString(
                                'es-EN',
                                {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                }
                              )
                            : 'N/A'}
                        </div>

                        {/* NOTAS */}
                        {cita.notas && (
                          <div className="mt-3 rounded-xl border border-slate-800 dark:bg-slate-900/60 p-3 text-sm italic text-slate-400">
                            📝 {cita.notas}
                          </div>
                        )}

                      </div>

                    </div>

                  </div>

                ))}

              </div>

            )}

          </div>

        </div>

        </div>

        {/* LEYENDA */}
        <div className="xl:col-span-4">

        <div className="overflow-hidden rounded-3xl border dark:border-slate-800 dark:bg-gray-900 shadow-xl">

          {/* HEADER */}
          <div className="border-b dark:border-slate-800 px-6 py-5">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Leyenda de Colores
            </h2>

            <p className="mt-1 text-sm text-gray-900 dark:text-slate-400">
              Empleados asignados
            </p>
          </div>

          {/* BODY */}
          <div className="space-y-4 p-6">

            {Object.values(
              citas.reduce((acc, c) => {
                if (!acc[c.empleado_id]) {
                  acc[c.empleado_id] = {
                    color: c.empleado_color || '#4ECDC4',
                    name: c.empleado,
                    id: c.empleado_id,
                  }
                }

                return acc
              }, {})
            ).map(({ color, name, id }) => (

              <div
                key={id}
                className="flex items-center gap-4 rounded-2xl border dark:border-slate-800 dar:bg-slate-950/40 p-4"
              >

                <div
                  className="h-5 w-5 rounded-md"
                  style={{
                    backgroundColor: color,
                  }}
                />

                <span className="font-medium text-gray-900 dark:text-white">
                  {name}
                </span>

              </div>

            ))}

          </div>

        </div>

        </div>
      </div>

      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setShowCreateModal(false)}
        >

          <div
            className="relative max-h-[95vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-gray-100 border border-slate-800 dark:bg-gray-900 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >

            {/* CLOSE */}
            <button
              className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/30 text-xl text-white transition hover:bg-black/50"
              onClick={() => setShowCreateModal(false)}
            >
              ×
            </button>

            {/* HEADER */}
            <div className="border-b border-slate-800 bg-indigo-500 p-6">
              <h2 className="text-2xl font-bold text-white">
                Nueva Cita
              </h2>
            </div>

            {/* FORM */}
            <form
              onSubmit={handleCreateCita}
              className="space-y-6 p-6"
            >

              {/* FECHA */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Fecha
                </label>

                <input required type="date" value={citaForm.fecha}
                  onChange={e =>
                    setCitaForm({
                      ...citaForm,
                      fecha: e.target.value,
                    })
                  }
                  onClick={(e) => e.target.showPicker()}
                  min={user?.rol === 'Administrador' ? undefined : new Date().toISOString().split('T')[0]}
                  className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-gray-900 dark:text-white outline-none transition focus:border-indigo-500 dark:[color-scheme:dark]"
                />
              </div>

              {/* SERVICIO */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Servicio
                  </label>

                  <select
                    value={citaForm.servicio_id}
                    onChange={e =>
                      setCitaForm({
                        ...citaForm,
                        servicio_id: e.target.value,
                      })
                    }
                    required
                    className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-gray-900 dark:text-white outline-none transition focus:border-indigo-500 dark:[color-scheme:dark]"
                  >
                    <option value="">
                      Seleccionar servicio
                    </option>

                    {servicios.map(servicio => (
                      <option
                        key={servicio.id}
                        value={servicio.id}
                      >
                        {servicio.name} - $
                        {formatPrice(servicio.precio)} (
                        {servicio.tiempo} min)
                      </option>
                    ))}
                  </select>

                </div>
                <div className="md:col-span-1">
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Precio <span>{formatPrice(servicioSeleccionado?.precio) || 0}</span>
                  </label>
                  <input
                    type="number"
                    onChange={e =>
                      setCitaForm({
                        ...citaForm,
                        precio_final: Number(e.target.value),
                      })
                    }
                    placeholder='precio diferente'
                    className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-gray-900 dark:text-white outline-none transition focus:border-indigo-500 dark:[color-scheme:dark]"
                  />
                </div>
              </div>

              {/* HORAS */}
              <div className="grid gap-4 md:grid-cols-2">

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Hora
                  </label>

                  <input required type="time" value={citaForm.hora}
                    onChange={e =>
                      setCitaForm({
                        ...citaForm,
                        hora: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-gray-900 dark:text-white outline-none transition focus:border-indigo-500 dark:[color-scheme:dark]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Hora Fin
                  </label>

                  <input
                    type="time"
                    value={horaFin}
                    onChange={e =>
                      setHoraFin(e.target.value)
                    }
                    className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-gray-900 dark:text-white outline-none transition focus:border-indigo-500 dark:[color-scheme:dark]"
                  />
                </div>

              </div>

              {/* CLIENTE */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Cliente
                </label>

                <div className="grid gap-3 lg:grid-cols-4">

                  <div className="lg:col-span-2 relative">
                  <input
                    type="text"
                    placeholder="Buscar o seleccionar cliente..."
                    value={searchCliente}
                    onChange={(e) => {
                      setSearchCliente(e.target.value);
                      setCitaForm({ ...citaForm, cliente_id: '' });
                    }}
                    className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-gray-900 dark:text-white outline-none transition focus:border-indigo-500"
                  />
                  
                  {searchCliente && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow-lg max-h-60 overflow-auto">
                      {clientes.filter(cliente =>
                        cliente.name.toLowerCase().includes(searchCliente.toLowerCase()) ||
                        (cliente.celular && cliente.celular.includes(searchCliente))
                      ).map(cliente => (
                        <button
                          key={cliente.id}
                          type="button"
                          onClick={() => {
                            setCitaForm({ ...citaForm, cliente_id: cliente.id });
                            setSearchCliente(`${cliente.name} ${cliente.celular ? `(${cliente.celular})` : ''}`);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-800 transition"
                        >
                          {cliente.name} {cliente.celular && `(${cliente.celular})`}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                  <input
                    type="text"
                    placeholder="Nombre nuevo"
                    value={newClientName}
                    onChange={e =>
                      setNewClientName(
                        e.target.value
                      )
                    }
                    className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-gray-900 dark:text-white outline-none transition focus:border-indigo-500 dark:[color-scheme:dark]"
                  />

                  <div className="flex gap-2">
                    <input
                      type="tel"
                      placeholder="WhatsApp"
                      value={newClientCelular}
                      onChange={e =>
                        setNewClientCelular(
                          e.target.value
                        )
                      }
                      className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-gray-900 dark:text-white outline-none transition focus:border-indigo-500 dark:[color-scheme:dark]"
                    />

                    <button
                      type="button"
                      onClick={handleCreateCliente}
                      className="rounded-xl bg-emerald-500 px-4 py-3 font-bold text-white transition hover:bg-emerald-600"
                    >
                      +
                    </button>
                  </div>

                </div>
              </div>

              {/* EMPLEADO */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Empleado
                </label>

                <select
                  value={citaForm.empleado_id}
                  onChange={e =>
                    setCitaForm({
                      ...citaForm,
                      empleado_id: e.target.value,
                    })
                  }
                  disabled={user.rol === 'Empleado'}
                  required
                  className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-gray-900 dark:text-white outline-none transition focus:border-indigo-500 dark:[color-scheme:dark]"
                >
                  <option value="">
                    Seleccionar empleado
                  </option>

                  {empleados.map(empleado => (
                    <option
                      key={empleado.id}
                      value={empleado.id}
                    >
                      {empleado.name} - (
                      {empleado.sucursal})
                    </option>
                  ))}
                </select>
              </div>

              {/* TIPO SERVICIO */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Tipo de servicio
                </label>

                <select
                  value={citaForm.tipo_servicio}
                  onChange={e =>
                    setCitaForm(prev => ({
                      ...prev,
                      tipo_servicio: e.target.value,
                      cobertura_id:
                        e.target.value ===
                        'domicilio'
                          ? prev.cobertura_id
                          : '',
                      direccion:
                        e.target.value ===
                        'domicilio'
                          ? prev.direccion
                          : '',
                    }))
                  }
                  required
                  className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-gray-900 dark:text-white outline-none transition focus:border-indigo-500 dark:[color-scheme:dark]"
                >
                  <option value="local">
                    En local
                  </option>

                  <option value="domicilio">
                    A domicilio
                  </option>

                  <option value="virtual">
                    Virtual
                  </option>
                </select>
              </div>

              {/* DOMICILIO */}
              {citaForm.tipo_servicio ===
                'domicilio' && (
                <>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Cobertura
                    </label>

                    <select
                      value={citaForm.cobertura_id}
                      onChange={e =>
                        setCitaForm({
                          ...citaForm,
                          cobertura_id:
                            e.target.value,
                        })
                      }
                      required
                      className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-gray-900 dark:text-white outline-none transition focus:border-indigo-500 dark:[color-scheme:dark]"
                    >
                      <option value="">
                        Seleccionar cobertura
                      </option>

                      {coberturas.map(cobertura => (
                        <option
                          key={cobertura.id}
                          value={cobertura.id}
                        >
                          {cobertura.barrio} - +$
                          {formatPrice(
                            cobertura.costo_extra
                          )}{' '}
                          (
                          {
                            cobertura.tiempo_estimado
                          }{' '}
                          min)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Dirección
                    </label>

                    <input
                      type="text"
                      value={citaForm.direccion}
                      onChange={e =>
                        setCitaForm({
                          ...citaForm,
                          direccion:
                            e.target.value,
                        })
                      }
                      placeholder="Dirección para domicilio"
                      required
                      className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-gray-900 dark:text-white outline-none transition focus:border-indigo-500 dark:[color-scheme:dark]"
                    />
                  </div>
                </>
              )}

              {/* NOTAS */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Notas (opcional)
                </label>

                <textarea
                  value={citaForm.notas}
                  onChange={e =>
                    setCitaForm({
                      ...citaForm,
                      notas: e.target.value,
                    })
                  }
                  rows="4"
                  className="w-full rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-3 text-gray-900 dark:text-white outline-none transition focus:border-indigo-500 dark:[color-scheme:dark]"
                />
              </div>

              {/* ACTIONS */}
              <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 dark:border-slate-800 pt-6">

                <button
                  type="button"
                  onClick={() =>
                    setShowCreateModal(false)
                  }
                  className="rounded-xl border border-slate-700 dark:bg-slate-800 px-5 py-3 text-sm font-medium text-gray-700 dark:text-white transition hover:bg-slate-700"
                  disabled={creatingCita}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="rounded-xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-600 disabled:opacity-60"
                  disabled={creatingCita}
                >
                  {creatingCita
                    ? 'Creando...'
                    : 'Crear Cita'}
                </button>

              </div>

            </form>

          </div>
        </div>
      )}
    </div>
  )
}

export default AgendaPage
