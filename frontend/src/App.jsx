import { useState, useEffect } from 'react'
import ServiciosPage from './ServiciosPage'
import UsuariosPage from './UsuariosPage'
import NegocioPage from './NegocioPage'
import AgendaPage from './AgendaPage'
import ClientesPage from './ClientesPage'
import EstadisticasPage from './EstadisticasPage'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import { Menu,Sun, Moon } from 'lucide-react'

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/'
const Swal = window.Swal

function App() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState('Introduzca sus datos para iniciar sesión.')
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(() => {
    return localStorage.getItem('agendly_current_page') || 'dashboard'
  })
  const [dashboardData, setDashboardData] = useState(null)
  const [upcomingCitas, setUpcomingCitas] = useState([])
  const [suscripcion, setSuscripcion] = useState({
    estado: null, // activa | engracia | vencida
    mensaje: '',
    plan: ''
  })

  const [citaSeleccionada, setCitaSeleccionada] = useState(null)
  const [horaConfirmacion, setHoraConfirmacion] = useState('')
  const [showConfirmModal, setShowConfirmModal] = useState(false)


  // Cargar sesión desde localStorage cuando el componente monta
  useEffect(() => {
    const savedUser = localStorage.getItem('agendly_user')
    if (savedUser) {
      const userData = JSON.parse(savedUser)
      setUser(userData)
      loadDashboardData()
      loadSuscripcionStatus(userData.negocio_id)
    }
  }, [])

  // Guardar página actual en localStorage cuando cambia
  useEffect(() => {
    localStorage.setItem('agendly_current_page', currentPage)
  }, [currentPage])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setStatus('Validando credenciales...')

    try {
      const response = await fetch(`${apiUrl}login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
        credentials: 'include',
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setUser(data.user)
        // Guardar sesión en localStorage
        localStorage.setItem('agendly_user', JSON.stringify(data.user))
        setStatus(`Bienvenido ${data.user.name}!`)
        // Load dashboard data
        loadDashboardData()
      } else {
        setStatus(data.detail || 'Credenciales inválidas')
      }
    } catch (error) {
      setStatus('Error de conexión con el backend')
    } finally {
      setLoading(false)
    }
  }

  const loadDashboardData = async () => {
    try {
      const response = await fetch(`${apiUrl}dashboard/`, { credentials: 'include' })
      const data = await response.json()
      setDashboardData(data.stats)

      // Fetch upcoming citas for the week
      const upcomingResponse = await fetch(`${apiUrl}citas/`, { credentials: 'include' })
      const upcomingData = await upcomingResponse.json()
      setUpcomingCitas(upcomingData.citas || [])
    } catch (error) {
      console.error('Error loading dashboard:', error)
    }
  }

  const loadSuscripcionStatus = async (negocioId) => {
    try {
      const response = await fetch(`${apiUrl}negocio-suscripcion/${negocioId}/`, { credentials: 'include' })
      const data = await response.json()
      if (data) {
        if (data.activa) {
          setSuscripcion({
            estado: 'activa',
            mensaje: `Suscripción activa.`,
            plan: data.plan
          })
        } else {
          setSuscripcion({
            estado: 'vencida',
            mensaje: `Su suscripción ha expirado y el acceso está bloqueado.`,
            plan: data.plan
          })
          if (data?.fecha_fin) {
            const fechaFin = new Date(data.fecha_fin + 'T00:00:00')
            const hoy = new Date()
            const diferenciaDias = Math.floor((hoy - fechaFin) / (1000 * 60 * 60 * 24))
            if (diferenciaDias <= 5) {
              setSuscripcion({
                estado: 'engracia',
                mensaje: `Su suscripción venció el ${fechaFin.toLocaleDateString()}, tiene ${5 - diferenciaDias} días para renovar.`,
                plan: data.plan
              })
            }
          }
        }

      } else {
        setSuscripcion({
          estado: 'vencida',
          mensaje: `Suscripción vencida.`
        })
      }
    } catch (error) {
      console.error('Error loading dashboard:', error)
    }
  }

  const normalizePhoneForWhatsApp = (phone) => {
    if (!phone) return ''
    return phone.replace(/[^0-9]/g, '').replace(/^0+/, '')
  }

  const sendWhatsAppConfirmation = (telefono, nombreCliente, fechaHora, servicio) => {
    const number = normalizePhoneForWhatsApp(telefono)
    if (!number) return

    const date = new Date(fechaHora)
    const fecha = date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    const hora = date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    })

    const text = `Hola ${nombreCliente}, tu cita ha sido confirmada para el ${fecha} a las ${hora} para el servicio ${servicio}.`
    const url = `https://wa.me/+57${number}?text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
  }

  const updateCitaEstado = async (citaId, nuevoEstado, fechaConfirmar = null) => {
    try {
      const response = await fetch(`${apiUrl}citas/${citaId}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ estado: nuevoEstado, fecha_hora_confirmada: fechaConfirmar }),
        credentials: 'include',
      })
      if (response.ok) {
        if (nuevoEstado === 'confirmada') {
          const citaResponse = await fetch(`${apiUrl}citas/${citaId}/`, { credentials: 'include' })
          if (citaResponse.ok) {
            const citaData = await citaResponse.json()
            if (citaData.cliente_celular) {
              sendWhatsAppConfirmation(
                citaData.cliente_celular,
                citaData.cliente,
                citaData.fecha_hora,
                citaData.servicio,
              )
            }
          }
        }
        // Recargar datos del dashboard
        loadDashboardData()
      } else {
        console.error('Error updating cita:', response.statusText)
      }
    } catch (error) {
      console.error('Error updating cita:', error)
    }
  }
  const handleConfirmarCita = (cita) => {
    if (cita.tipo_reserva === 'rango') {
      setCitaSeleccionada(cita)
      setHoraConfirmacion('')
      setShowConfirmModal(true)
      return
    }
    handleCitaEstadoChange(cita.id, 'confirmada')
  }

  const handleCitaEstadoChange = async (citaId, nuevoEstado, fechaConfirmar = null) => {
    const estados = {
      completada: {
        accion: 'completar',titulo: 'Completar Cita',icono: 'success'
      },
      confirmada: {
        accion: 'confirmar',titulo: 'Confirmar Cita',icono: 'info'
      },
      cancelada: {
        accion: 'cancelar',titulo: 'Cancelar Cita',icono: 'warning'
      }
    }
    const { accion, titulo, icono } = estados[nuevoEstado]
    
    const result = await Swal.fire({
      title: titulo,
      text: `¿Está seguro de ${accion} esta cita?`,
      icon: icono,
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, continuar',
      cancelButtonText: 'Cancelar'
    })
    
    if (result.isConfirmed) {
      updateCitaEstado(citaId, nuevoEstado, fechaConfirmar)
    }
  }

  const handleLogout = async () => {
    try {
      // Hacer logout en el servidor para limpiar la sesión
      await fetch(`${apiUrl}logout/`, {
        method: 'POST',
        credentials: 'include',
      })
    } catch (error) {
      console.error('Error during logout:', error)
    }
    
    setUser(null)
    setUsername('')
    setPassword('')
    setStatus('Introduzca sus datos para iniciar sesión.')
    setCurrentPage('dashboard')
    setDashboardData(null)
    // Limpiar localStorage
    localStorage.removeItem('agendly_user')
    localStorage.removeItem('agendly_current_page')
  }

  const generarOpcionesHoraRango = () => {
    if (!citaSeleccionada?.rango_inicio || !citaSeleccionada?.rango_fin) {
      return []
    }

    const opciones = []

    const inicio = new Date(citaSeleccionada.rango_inicio)
    const fin = new Date(citaSeleccionada.rango_fin)

    const actual = new Date(inicio)

    while (actual <= fin) {
      opciones.push(
        actual.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
      )

      actual.setMinutes(actual.getMinutes() + 30)
    }

    return opciones
  }

  const confirmarCitaConHora = async () => {
    if (!citaSeleccionada || !horaConfirmacion) return

    try {
      const fecha = new Date(citaSeleccionada.rango_inicio)
      const [hora, minutos] = horaConfirmacion.split(':')
      fecha.setHours(Number(hora))
      fecha.setMinutes(Number(minutos))
      fecha.setSeconds(0)
      fecha.setMilliseconds(0)

      const fechaHoraCompleta = fecha.toISOString()

      await handleCitaEstadoChange(
        citaSeleccionada.id,
        'confirmada',
        fechaHoraCompleta
      )

      setShowConfirmModal(false)
      setHoraConfirmacion('')
      setCitaSeleccionada(null)

    } catch (error) {
      console.error('Error al confirmar cita:', error)
    }
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <div>            
            {suscripcion.estado !== 'activa' && (
              <div className="dashboard-topbar">
                <strong style={{ color: 'red' }}>{suscripcion.mensaje}</strong>
              </div>
            )}

            {suscripcion.estado !== 'vencida' && (
            
            <section className="grid grid-cols-12 gap-6">
              {/* TOTAL USUARIOS */}
              {user.rol !== 'Empleado' && (
                <div className="col-span-12 lg:col-span-4 relative overflow-hidden rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-gray-800 p-6">

                  {/* TOP */}
                  <div className="mb-8 flex items-start justify-between">
                    <div>
                      <h3 className="text-2xl font-bold dark:text-white">
                        Total Usuarios
                      </h3>
                    </div>
                  </div>

                  {/* VALUE */}
                  <div className="mb-6 flex items-center gap-3">
                    <strong className="text-5xl font-bold dark:text-white">
                      {dashboardData?.total_users || 0}
                    </strong>
                  </div>
                  {/* FOOTER */}
                  <p className="text-slate-400 dark:text-white">
                    Registrados
                  </p>
                </div>
              )}
              {/* TOTAL CLIENTES */}
              {user.rol !== 'Empleado' && (
                <div className="col-span-12 lg:col-span-4 relative overflow-hidden rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-gray-800 p-6">
                  <div className="mb-8 flex items-start justify-between">
                    <div>
                      <h3 className="text-2xl font-bold dark:text-white">
                        Total Clientes
                      </h3>
                    </div>
                  </div>

                  <div className="mb-6 flex items-center gap-3">
                    <strong className="text-5xl font-bold dark:text-white">
                      {dashboardData?.total_clientes || 0}
                    </strong>
                  </div>

                  <p className="text-slate-400 dark:text-white">
                    Registrados
                  </p>
                </div>
              )}
              {/* TOTAL CITAS */}
              <div className="col-span-12 lg:col-span-4 relative overflow-hidden rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-gray-800 p-6">
                <div className="mb-8 flex items-start justify-between">
                  <div>
                    <h3 className="text-2xl font-bold dark:text-white">
                      Total Citas
                    </h3>
                  </div>
                </div>

                <div className="mb-6 flex items-center gap-3">
                  <strong className="text-5xl font-bold dark:text-white">
                    {dashboardData?.total_citas || 0}
                  </strong>
                </div>

                <p className="text-slate-400 dark:text-white">
                  Agendadas
                </p>
              </div>

              {/* PROXIMAS CITAS */}
              <div className="col-span-12 xl:col-span-8 bg-white dark:bg-gray-800 shadow-xs rounded-xl">
                <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
                  <h2 className="font-semibold text-gray-800 dark:text-gray-100">
                    Próximas Citas
                  </h2>
                </header>

                <div className="p-4">
                  {upcomingCitas
                    .filter(cita => cita.estado === 'confirmada')
                    .sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora))
                    .length > 0 ? (
                    <div className="space-y-3">
                      {upcomingCitas
                        .filter(cita => cita.estado === 'confirmada')
                        .sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora))
                        .map(cita => (
                          <div
                            key={cita.id}
                            className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-700 p-4"
                          >
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-900 dark:text-white">
                                {cita.cliente}
                              </span>

                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                {cita.servicio}
                              </span>

                              <span className="text-xs text-gray-400">
                                {new Date(cita.fecha_hora).toLocaleString()}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              {new Date(cita.fecha_hora) < new Date() && (
                              <button
                                className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition"
                                onClick={() =>
                                  handleCitaEstadoChange(cita.id, 'completada')
                                }
                                title="Marcar como completada"
                              >
                                ✓
                              </button>
                               )}

                              <button
                                className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500 text-white hover:bg-red-600 transition"
                                onClick={() =>
                                  handleCitaEstadoChange(cita.id, 'cancelada')
                                }
                                title="Cancelar cita"
                              >
                                ✗
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No hay citas próximas en la semana
                    </p>
                  )}
                </div>
              </div>

              {/* CITAS PENDIENTES */}
              <div className="col-span-12 xl:col-span-4 bg-white dark:bg-gray-800 shadow-xs rounded-xl">
                <header className="px-5 py-4 border-b border-gray-100 dark:border-gray-700/60">
                  <h2 className="font-semibold text-gray-800 dark:text-gray-100">
                    Citas Pendientes
                  </h2>
                </header>

                <div className="p-4">
                  {dashboardData?.citas_pendientes?.length > 0 ? (
                    <div className="space-y-3">
                      {dashboardData.citas_pendientes.map(cita => (
                        <div
                          key={cita.id}
                          className="rounded-xl border border-gray-200 dark:border-gray-700 p-4"
                        >
                          <div className="mb-3">
                            <span className="block font-medium text-gray-900 dark:text-white">
                              {cita.cliente}
                            </span>

                            <span className="block text-sm text-gray-500 dark:text-gray-400">
                              {cita.servicio}
                            </span>

                            <span className="block text-xs text-gray-400">
                              {cita.tipo_reserva === 'rango' ? (
                                <>
                                  Disponible entre{' '}
                                  {new Date(cita.rango_inicio).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                  {' - '}
                                  {new Date(cita.rango_fin).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </>
                              ) : (
                                new Date(cita.fecha_hora).toLocaleString()
                              )}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              className="flex-1 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600 transition"
                              onClick={() => handleConfirmarCita(cita)}
                            >
                              Confirmar
                            </button>

                            <button
                              className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 transition"
                              onClick={() =>
                                handleCitaEstadoChange(cita.id, 'cancelada')
                              }
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No hay citas pendientes
                    </p>
                  )}
                </div>
              </div>
            </section>
            )}
            
            {showConfirmModal && (
              <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
                <div className="bg-white rounded-2xl p-6 w-full max-w-md">
                  <h3 className="text-lg font-semibold mb-4">
                    Confirmar cita
                  </h3>

                  <p className="text-sm text-gray-500 mb-4">
                    Selecciona la hora exacta para confirmar esta cita
                  </p>

                  <select
                    value={horaConfirmacion}
                    onChange={(e) =>
                      setHoraConfirmacion(e.target.value)
                    }
                    className="w-full border rounded-xl px-3 py-2"
                  >
                    <option value="">
                      Seleccionar hora
                    </option>

                    {generarOpcionesHoraRango().map((hora) => (
                      <option
                        key={hora}
                        value={hora}
                      >
                        {hora}
                      </option>
                    ))}
                  </select>

                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() =>
                        setShowConfirmModal(false)
                      }
                      className="flex-1 border rounded-xl py-2"
                    >
                      Cancelar
                    </button>

                    <button
                      onClick={confirmarCitaConHora}
                      className="flex-1 bg-indigo-500 text-white rounded-xl py-2"
                    >
                      Confirmar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          
        )      
      case 'agenda':
        return <AgendaPage user={user} />
      case 'usuarios':
        return <UsuariosPage user={user} />
      case 'negocio':
        return <NegocioPage user={user} />
      case 'servicios':
        return <ServiciosPage user={user} />
      case 'clientes':
        return <ClientesPage user={user}/>
      case 'estadisticas':
        return <EstadisticasPage user={user}/>
      default:
        return <div>Página no encontrada</div>
   
    }
  }

  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div>
      {user ? (
      <div className="min-h-screen bg-slate-100">

      <div className="flex">

        <Sidebar
          user={user} suscripcion={suscripcion} currentPage={currentPage}
          setCurrentPage={setCurrentPage} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}
        />

        {/* CONTENT */}
         <div className="flex-1 min-w-0 dark:bg-slate-900/95 ">

          {/* TOPBAR */}
          <Header setSidebarOpen={setSidebarOpen} handleLogout={handleLogout} user={user}/>

          {/* PAGE */}
          <main className="p-6">
            {renderPage()}
          </main>

        </div>

      </div>
    </div>
      ) : (
        <div className="min-h-screen dbg-[#0f172a] flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-md">
            
            {/* CARD */}
            <div className="rounded-3xl border border-slate-800 bg-[#111827] shadow-2xl overflow-hidden">
              
              {/* HEADER */}
              <div className="px-8 pt-8 pb-6 border-b border-slate-800">
                <div className="flex items-center justify-center mb-5">
                  <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/20 flex items-center justify-center">
                    <span className="text-2xl font-bold text-blue-400">
                      K
                    </span>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-500 font-semibold mb-2">
                    Bienvenido
                  </p>

                  <h1 className="text-3xl font-bold text-white">
                    Login Kelzo
                  </h1>

                  <p className="mt-3 text-sm text-slate-400">
                    {status}
                  </p>
                </div>
              </div>

              {/* FORM */}
              <div className="p-8">
                <form onSubmit={handleSubmit} className="space-y-5">
                  
                  <div>
                    <label className="block mb-2 text-sm font-medium text-slate-300">
                      Usuario
                    </label>

                    <input
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="usuario"
                      className="w-full h-12 rounded-2xl border border-slate-700 bg-slate-900 px-4 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-medium text-slate-300">
                      Contraseña
                    </label>

                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="contraseña"
                      className="w-full h-12 rounded-2xl border border-slate-700 bg-slate-900 px-4 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold shadow-lg shadow-blue-600/20 transition-all duration-200"
                  >
                    {loading ? 'Entrando...' : 'Iniciar sesión'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
