import { useEffect, useState } from 'react'

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
  })
  const [newClientName, setNewClientName] = useState('')
  const [newClientCelular, setNewClientCelular] = useState('')
  const [creatingCita, setCreatingCita] = useState(false)
  const [horaFin, setHoraFin] = useState('')
  
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
  })
  const [editHoraFin, setEditHoraFin] = useState('')
  const [updatingCita, setUpdatingCita] = useState(false)

  useEffect(() => {
    loadCitas()
  }, [currentDate, user])

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
        fetch(`${apiUrl}clientes/`,),
        fetch(`${apiUrl}usuarios/`,),
        fetch(`${apiUrl}servicios/`,),
        fetch(`${apiUrl}coberturas/?negocio_id=${user.negocio_id}`,),
      ])
      
      const clientesData = await clientesRes.json()
      const empleadosData = await empleadosRes.json()
      const serviciosData = await serviciosRes.json()
      const coberturasData = await coberturasRes.json()
      
      setClientes(clientesData.clientes || [])
      // Filtrar solo usuarios del negocio actual
      const empleadosFiltrados = (empleadosData.usuarios || []).filter(
        u => u.negocio_id === user.negocio_id
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
      const mes = currentDate.getMonth() + 1
      const ano = currentDate.getFullYear()
      const params = new URLSearchParams({
        mes: mes.toString().padStart(2, '0'),
        ano: ano.toString(),
        negocio_id: user.negocio_id,
      })
      const response = await fetch(`${apiUrl}citas/?${params}`)
      const data = await response.json()
      setCitas(data.citas || [])
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

    // Validar que la fecha no sea anterior a hoy
    const today = new Date().toISOString().split('T')[0]
    if (editCitaForm.fecha < today) {
      alert('No se puede agendar citas en fechas anteriores a hoy')
      return
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

    // Validar que la fecha no sea anterior a hoy
    const today = new Date().toISOString().split('T')[0]
    if (citaForm.fecha < today) {
      alert('No se puede agendar citas en fechas anteriores a hoy')
      return
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
          estado: 'confirmada',
          tipo_servicio: citaForm.tipo_servicio,
          cobertura_id: citaForm.cobertura_id ? parseInt(citaForm.cobertura_id) : null,
          direccion: citaForm.direccion,
          notas: citaForm.notas,
        }),
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
    <div className="agenda-page">
      <div className="dashboard-topbar">
        <div>
          <p className="eyebrow">Calendario</p>
          <h1>Agenda</h1>
        </div>
        <div className="topbar-actions">
          <div style={{ display: 'flex', gap: '0.5rem', marginRight: '1rem' }}>
            <button 
              onClick={() => setViewMode('monthly')}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: viewMode === 'monthly' ? '#3b82f6' : '#e5e7eb',
                color: viewMode === 'monthly' ? '#fff' : '#374151',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: viewMode === 'monthly' ? '600' : '500',
              }}
            >
              Mes
            </button>
            <button 
              onClick={() => setViewMode('weekly')}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: viewMode === 'weekly' ? '#3b82f6' : '#e5e7eb',
                color: viewMode === 'weekly' ? '#fff' : '#374151',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: viewMode === 'weekly' ? '600' : '500',
              }}
            >
              Semana
            </button>
          </div>
          
          <button onClick={viewMode === 'monthly' ? previousMonth : previousWeek} className="nav-button">← Anterior</button>
          <span className="month-year">
            {viewMode === 'monthly' 
              ? `${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`
              : `Semana del ${getWeekDays(currentDate)[0].toLocaleDateString('es-ES')} al ${getWeekDays(currentDate)[6].toLocaleDateString('es-ES')}`
            }
          </span>
          <button onClick={viewMode === 'monthly' ? nextMonth : nextWeek} className="nav-button">Siguiente →</button>
          <button onClick={() => openCreateCitaModal(new Date().getDate())} className="btn-primary">
            + Nueva Cita
          </button>
        </div>
      </div>

      {viewMode === 'monthly' && (
      <div className="calendar-container">
        <table className="calendar">
          <thead>
            <tr>
              {weekDays.map(day => (
                <th key={day}>{day}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array(Math.ceil(days.length / 7))
              .fill(0)
              .map((_, weekIndex) => (
                <tr key={weekIndex}>
                  {days.slice(weekIndex * 7, (weekIndex + 1) * 7).map((day, dayIndex) => {
                    const citasDelDia = day ? getCitasForDay(day) : []
                    return (
                      <td
                        key={dayIndex}
                        className={`calendar-day ${!day ? 'empty' : ''} ${
                          day === new Date().getDate() &&
                          currentDate.getMonth() === new Date().getMonth() &&
                          currentDate.getFullYear() === new Date().getFullYear()
                            ? 'today'
                            : ''
                        }`}
                        onClick={() => day && openCreateCitaModal(day)}
                        style={{ cursor: day ? 'pointer' : 'default' }}
                      >
                        {day && (
                          <div className="day-content">
                            <div className="day-number">{day}</div>
                            <div className="events-list">
                              {citasDelDia.map(cita => (
                                <div
                                  key={cita.id}
                                  className="event"
                                  style={{
                                    backgroundColor: cita.empleado_color,
                                    color: '#fff',
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setSelectedEvent(cita)
                                  }}
                                  title={`${cita.servicio} - ${cita.empleado} (${cita.servicio_tiempo} min)`}
                                >
                                  <strong>{cita.servicio.substring(0, 10)}</strong>
                                  <small>{cita.empleado}</small>
                                  <div style={{ fontSize: '0.7em', marginTop: '2px' }}>
                                    {new Date(cita.fecha_hora).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} - {cita.hora_fin ? new Date(cita.hora_fin).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
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
        <div className="calendar-container" style={{ overflowX: 'auto' }}>
          <table className="calendar" style={{ minWidth: '100%' }}>
            <thead>
              <tr>
                {getWeekDays(currentDate).map((day, idx) => (
                  <th key={idx} style={{ minWidth: '120px' }}>
                    <div>{weekDays[day.getDay()]}</div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      {day.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {getWeekDays(currentDate).map((day, idx) => {
                  const dateStr = day.toISOString().split('T')[0]
                  const citasDelDia = citas.filter(cita => cita.fecha_hora.startsWith(dateStr)).sort((a, b) => a.fecha_hora.localeCompare(b.fecha_hora))
                  return (
                    <td
                      key={idx}
                      style={{
                        minWidth: '120px',
                        verticalAlign: 'top',
                        padding: '0.5rem',
                        backgroundColor: day.toDateString() === new Date().toDateString() ? '#fef3c7' : '#fff',
                        borderRight: '1px solid #e5e7eb',
                      }}
                      onClick={() => openCreateCitaModal(day.getDate())}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {citasDelDia.map(cita => (
                          <div
                            key={cita.id}
                            style={{
                              padding: '0.5rem',
                              backgroundColor: cita.empleado_color,
                              color: '#fff',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                            }}
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedEvent(cita)
                            }}
                          >
                            <strong>{cita.servicio.substring(0, 8)}</strong>
                            <div>{cita.empleado}</div>
                            <div>
                              {new Date(cita.fecha_hora).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} - {cita.hora_fin ? new Date(cita.hora_fin).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
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
        <div className="event-modal" onClick={() => setSelectedEvent(null)}>
          <div className="event-modal-content" onClick={e => e.stopPropagation()}>
            <button className="close-button" onClick={() => setSelectedEvent(null)}>×</button>
            <div
              className="event-modal-header"
              style={{ backgroundColor: selectedEvent.empleado_color }}
            >
              <h2>{selectedEvent.servicio}</h2>
            </div>
            <div className="event-modal-body">
              <div className="event-detail">
                <label>Empleado:</label>
                <p>{selectedEvent.empleado}</p>
              </div>
              <div className="event-detail">
                <label>Cliente:</label>
                <p>{selectedEvent.cliente}</p>
              </div>
              <div className="event-detail">
                <label>Servicio:</label>
                <p>{selectedEvent.servicio} ({selectedEvent.servicio_tiempo} minutos)</p>
              </div>
              <div className="event-detail">
                <label>Horario:</label>
                <p>
                  {new Date(selectedEvent.fecha_hora).toLocaleString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })} - {selectedEvent.hora_fin ? new Date(selectedEvent.hora_fin).toLocaleString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit',
                  }) : 'N/A'}
                </p>
              </div>
              <div className="event-detail">
                <label>Estado:</label>
                <p className={`status-badge status-${selectedEvent.estado}`}>
                  {selectedEvent.estado}
                </p>
              </div>
              {selectedEvent.notas && (
                <div className="event-detail">
                  <label>Notas:</label>
                  <p>{selectedEvent.notas}</p>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
              <button 
                onClick={() => setSelectedEvent(null)}
                className="btn-secondary"
              >
                Cerrar
              </button>
              <button 
                onClick={() => initializeEditForm(selectedEvent)}
                className="btn-primary"
              >
                Editar
              </button>
              <button 
                onClick={handleDeleteCita}
                className="btn-secondary"
                style={{ backgroundColor: '#ef4444' }}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedEvent && isEditMode && (
        <div className="event-modal" onClick={() => { setSelectedEvent(null); setIsEditMode(false) }}>
          <div className="event-modal-content" onClick={e => e.stopPropagation()}>
            <button className="close-button" onClick={() => { setSelectedEvent(null); setIsEditMode(false) }}>×</button>
            <div className="event-modal-header" style={{ backgroundColor: '#3b82f6' }}>
              <h2>Editar Cita</h2>
            </div>
            <form onSubmit={handleUpdateCita} className="cita-form">
              <div className="form-group">
                <label>Fecha:</label>
                <input
                  type="date"
                  value={editCitaForm.fecha}
                  onChange={e => setEditCitaForm({...editCitaForm, fecha: e.target.value})}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div className="form-group">
                <label>Servicio:</label>
                <select
                  value={editCitaForm.servicio_id}
                  onChange={e => setEditCitaForm({...editCitaForm, servicio_id: e.target.value})}
                  required
                >
                  <option value="">Seleccionar servicio</option>
                  {servicios.map(servicio => (
                    <option key={servicio.id} value={servicio.id}>
                      {servicio.name} - ${formatPrice(servicio.precio)} ({servicio.tiempo} min)
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Hora:</label>
                  <input
                    type="time"
                    value={editCitaForm.hora}
                    onChange={e => setEditCitaForm({...editCitaForm, hora: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group" style={{ flex: 1 }}>
                  <label>Hora Fin:</label>
                  <input
                    type="time"
                    value={editHoraFin}
                    onChange={e => setEditHoraFin(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Cliente:</label>
                <select
                  value={editCitaForm.cliente_id}
                  onChange={e => setEditCitaForm({...editCitaForm, cliente_id: e.target.value})}
                  required
                >
                  <option value="">Seleccionar cliente</option>
                  {clientes.map(cliente => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.name} {cliente.celular ? `(${cliente.celular})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Empleado:</label>
                <select
                  value={editCitaForm.empleado_id}
                  onChange={e => setEditCitaForm({...editCitaForm, empleado_id: e.target.value})}
                  disabled={user.rol === 'Empleado'}
                  required
                >
                  <option value="">Seleccionar empleado</option>
                  {empleados.map(empleado => (
                    <option key={empleado.id} value={empleado.id}>
                      {empleado.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Tipo de servicio:</label>
                <select
                  value={editCitaForm.tipo_servicio}
                  onChange={e => setEditCitaForm(prev => ({
                    ...prev,
                    tipo_servicio: e.target.value,
                    cobertura_id: e.target.value === 'domicilio' ? prev.cobertura_id : '',
                    direccion: e.target.value === 'domicilio' ? prev.direccion : '',
                  }))}
                >
                  <option value="local">En local</option>
                  <option value="domicilio">A domicilio</option>
                  <option value="virtual">Virtual</option>
                </select>
              </div>

              {editCitaForm.tipo_servicio === 'domicilio' && (
                <>
                  <div className="form-group">
                    <label>Cobertura:</label>
                    <select
                      value={editCitaForm.cobertura_id}
                      onChange={e => setEditCitaForm({...editCitaForm, cobertura_id: e.target.value})}
                      required
                    >
                      <option value="">Seleccionar cobertura</option>
                      {coberturas.map(cobertura => (
                        <option key={cobertura.id} value={cobertura.id}>
                          {cobertura.barrio} - +${formatPrice(cobertura.costo_extra)} ({cobertura.tiempo_estimado} min)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Dirección:</label>
                    <input
                      type="text"
                      value={editCitaForm.direccion}
                      onChange={e => setEditCitaForm({...editCitaForm, direccion: e.target.value})}
                      placeholder="Dirección para domicilio"
                      required
                    />
                  </div>
                </>
              )}

              <div className="form-group">
                <label>Estado:</label>
                <select
                  value={editCitaForm.estado}
                  onChange={e => setEditCitaForm({...editCitaForm, estado: e.target.value})}
                  required
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="confirmada">Confirmada</option>
                  <option value="cancelada">Cancelada</option>
                  <option value="completada">Completada</option>
                </select>
              </div>

              <div className="form-group">
                <label>Notas (opcional):</label>
                <textarea
                  value={editCitaForm.notas}
                  onChange={e => setEditCitaForm({...editCitaForm, notas: e.target.value})}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db', fontFamily: 'inherit' }}
                  rows="3"
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => { setSelectedEvent(null); setIsEditMode(false) }}
                  className="btn-secondary"
                  disabled={updatingCita}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={updatingCita}
                >
                  {updatingCita ? 'Actualizando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '2rem', marginTop: '2rem', paddingBottom: '2rem' }}>
        {/* Columna izquierda - Citas del día actual */}
        <div style={{ flex: 1 }}>
          <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: '600' }}>
            Citas de Hoy ({new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })})
          </h2>
          
          {getCitasToday().length === 0 ? (
            <div style={{ padding: '2rem', backgroundColor: '#f3f4f6', borderRadius: '8px', textAlign: 'center', color: '#6b7280' }}>
              <p>No hay citas para hoy</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {getCitasToday().map(cita => (
                <div
                  key={cita.id}
                  style={{
                    padding: '1rem',
                    border: '1px solid #e5e7eb',
                    borderLeft: `4px solid ${cita.empleado_color}`,
                    borderRadius: '6px',
                    backgroundColor: '#fff',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onClick={() => setSelectedEvent(cita)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f9fafb'
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#fff'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <strong style={{ fontSize: '1rem' }}>{cita.servicio}</strong>
                        <span className={`status-badge status-${cita.estado}`} style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
                          {cita.estado}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                        <strong>{cita.empleado}</strong> → {cita.cliente}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#4b5563' }}>
                        ⏰ {new Date(cita.fecha_hora).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} - {cita.hora_fin ? new Date(cita.hora_fin).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                      </div>
                      {cita.notas && (
                        <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem', fontStyle: 'italic' }}>
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

        {/* Columna derecha - Leyenda de colores */}
        <div style={{ flex: 0.4 }}>
          <div className="calendar-legend">
            <p><strong>Leyenda de Colores:</strong></p>
            <div className="legend-items">
              {Object.values(
                citas.reduce((acc, c) => {
                  if (!acc[c.empleado_id]) {
                    acc[c.empleado_id] = { color: c.empleado_color, name: c.empleado, id: c.empleado_id }
                  }
                  return acc
                }, {})
              ).map(({ color, name, id }) => (
                  <div key={id} className="legend-item">
                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        backgroundColor: color,
                        borderRadius: '4px',
                      }}
                    />
                    <span>{name}</span>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {showCreateModal && (
        <div className="event-modal" onClick={() => setShowCreateModal(false)}>
          <div className="event-modal-content" onClick={e => e.stopPropagation()}>
            <button className="close-button" onClick={() => setShowCreateModal(false)}>×</button>
            <div className="event-modal-header" style={{ backgroundColor: '#3b82f6' }}>
              <h2>Nueva Cita</h2>
            </div>
            <form onSubmit={handleCreateCita} className="cita-form">
              <div className="form-group">
                <label>Fecha:</label>
                <input
                  type="date"
                  value={citaForm.fecha}
                  onChange={e => setCitaForm({...citaForm, fecha: e.target.value})}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div className="form-group">
                <label>Servicio:</label>
                <select
                  value={citaForm.servicio_id}
                  onChange={e => setCitaForm({...citaForm, servicio_id: e.target.value})}
                  required
                >
                  <option value="">Seleccionar servicio</option>
                  {servicios.map(servicio => (
                    <option key={servicio.id} value={servicio.id}>
                      {servicio.name} - ${formatPrice(servicio.precio)} ({servicio.tiempo} min)
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Hora:</label>
                  <input
                    type="time"
                    value={citaForm.hora}
                    onChange={e => setCitaForm({...citaForm, hora: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group" style={{ flex: 1 }}>
                  <label>Hora Fin:</label>
                  <input
                    type="time"
                    value={horaFin}
                    onChange={e => setHoraFin(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Cliente:</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <select
                    value={citaForm.cliente_id}
                    onChange={e => setCitaForm({...citaForm, cliente_id: e.target.value})}
                    required
                    style={{ flex: 1 }}
                  >
                    <option value="">Seleccionar cliente</option>
                    {clientes.map(cliente => (
                      <option key={cliente.id} value={cliente.id}>
                        {cliente.name} {cliente.celular ? `(${cliente.celular})` : ''}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Nombre nuevo"
                    value={newClientName}
                    onChange={e => setNewClientName(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <input
                    type="tel"
                    placeholder="Celular/WhatsApp"
                    value={newClientCelular}
                    onChange={e => setNewClientCelular(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={handleCreateCliente}
                    className="btn-primary"
                    style={{ minWidth: 'auto' }}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Empleado:</label>
                <select
                  value={citaForm.empleado_id}
                  onChange={e => setCitaForm({...citaForm, empleado_id: e.target.value})}
                  disabled={user.rol === 'Empleado'}
                  required
                >
                  <option value="">Seleccionar empleado</option>
                  {empleados.map(empleado => (
                    <option key={empleado.id} value={empleado.id}>
                      {empleado.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Tipo de servicio:</label>
                <select
                  value={citaForm.tipo_servicio}
                  onChange={e => setCitaForm(prev => ({
                    ...prev,
                    tipo_servicio: e.target.value,
                    cobertura_id: e.target.value === 'domicilio' ? prev.cobertura_id : '',
                    direccion: e.target.value === 'domicilio' ? prev.direccion : '',
                  }))}
                  required
                >
                  <option value="local">En local</option>
                  <option value="domicilio">A domicilio</option>
                  <option value="virtual">Virtual</option>
                </select>
              </div>

              {citaForm.tipo_servicio === 'domicilio' && (
                <>
                  <div className="form-group">
                    <label>Cobertura:</label>
                    <select
                      value={citaForm.cobertura_id}
                      onChange={e => setCitaForm({...citaForm, cobertura_id: e.target.value})}
                      required
                    >
                      <option value="">Seleccionar cobertura</option>
                      {coberturas.map(cobertura => (
                        <option key={cobertura.id} value={cobertura.id}>
                          {cobertura.barrio} - +${formatPrice(cobertura.costo_extra)} ({cobertura.tiempo_estimado} min)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Dirección:</label>
                    <input
                      type="text"
                      value={citaForm.direccion}
                      onChange={e => setCitaForm({...citaForm, direccion: e.target.value})}
                      placeholder="Dirección para domicilio"
                      required
                    />
                  </div>
                </>
              )}

              <div className="form-group">
                <label>Notas (opcional):</label>
                <textarea
                  value={citaForm.notas}
                  onChange={e => setCitaForm({...citaForm, notas: e.target.value})}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #d1d5db', fontFamily: 'inherit' }}
                  rows="3"
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary"
                  disabled={creatingCita}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={creatingCita}
                >
                  {creatingCita ? 'Creando...' : 'Crear Cita'}
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
