import { useState, useEffect } from 'react'
import ServiciosPage from './ServiciosPage'
import UsuariosPage from './UsuariosPage'
import NegocioPage from './NegocioPage'
import AgendaPage from './AgendaPage'
import ClientesPage from './ClientesPage'
import EstadisticasPage from './EstadisticasPage'

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

  const updateCitaEstado = async (citaId, nuevoEstado) => {
    try {
      const response = await fetch(`${apiUrl}citas/${citaId}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ estado: nuevoEstado }),
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

  const handleCitaEstadoChange = async (citaId, nuevoEstado) => {
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
      updateCitaEstado(citaId, nuevoEstado)
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

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <div>
            <div className="dashboard-topbar">
              <div>
                <p className="eyebrow">Bienvenido: {user.name}</p>
              </div>
              <div className="topbar-actions">
                <button className="logout-button" onClick={handleLogout}>
                  Cerrar sesión
                </button>
              </div>
            </div>
            
            {suscripcion.estado !== 'activa' && (
              <div className="dashboard-topbar">
                <strong style={{ color: 'red' }}>{suscripcion.mensaje}</strong>
              </div>
            )}

            {suscripcion.estado !== 'vencida' && (
            <section className="top-cards">
              <article className="card summary-card" style={{ display: user.rol === 'Empleado' ? 'none' : 'block' }}>
                <span className="card-title">Total Usuarios </span>
                <strong>{dashboardData?.total_users || 0} </strong>
                <small>Registrados</small>
              </article>
              <article className="card summary-card" style={{ display: user.rol === 'Empleado' ? 'none' : 'block' }}>
                <span className="card-title">Total Clientes </span>
                <strong>{dashboardData?.total_clientes || 0} </strong>
                <small>Registrados</small>
              </article>
              <article className="card summary-card" style={{ display: user.rol === 'Empleado' ? 'block' : 'block' }}>
                <span className="card-title">Total Citas </span>
                <strong>{dashboardData?.total_citas || 0} </strong>
                <small>Agendadas</small>
              </article>
            </section>
            )}
            
            {suscripcion.estado !== 'vencida' && (
            <section className="dashboard-grid">
              <article className="card">
                <div className="card-title-row">
                  <span>Próximas Citas </span>
                </div>
                <div>
                  {upcomingCitas.filter(cita => cita.estado === 'confirmada').sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora)).length > 0 ? (
                    <ul className="citas-pendientes-list">
                      {upcomingCitas.filter(cita => cita.estado === 'confirmada').sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora)).map(cita => (
                        <li key={cita.id} className="cita-item">
                          <span>{cita.cliente} - {cita.servicio} - {new Date(cita.fecha_hora).toLocaleString()}</span>
                          <div className="cita-actions">
                            <button 
                              className="btn-confirm" 
                              onClick={() => handleCitaEstadoChange(cita.id, 'completada')}
                              title="Marcar como completada"
                            >
                              ✓
                            </button>
                            <button 
                              className="btn-cancel" 
                              onClick={() => handleCitaEstadoChange(cita.id, 'cancelada')}
                              title="Cancelar cita"
                            >
                              ✗
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>No hay citas próximas en la semana</p>
                  )}
                </div>
              </article>

              <article className="card">
                <div className="card-title-row">
                  <span>Citas Pendientes </span>
                </div>
                <div>
                  {dashboardData?.citas_pendientes?.length > 0 ? (
                    <ul className="citas-pendientes-list">
                      {dashboardData.citas_pendientes.map(cita => (
                        <li key={cita.id} className="cita-item">
                          <span>{cita.cliente} - {cita.servicio} - {new Date(cita.fecha_hora).toLocaleString()}</span>
                          <div className="cita-actions">
                            <button 
                              className="btn-update" 
                              onClick={() => handleCitaEstadoChange(cita.id, 'confirmada')}
                              title="Confirmar cita"
                            >
                              ✓
                            </button>
                            <button 
                              className="btn-cancel" 
                              onClick={() => handleCitaEstadoChange(cita.id, 'cancelada')}
                              title="Cancelar cita"
                            >
                              ✗
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>No hay citas pendientes</p>
                  )}
                </div>
              </article>
            </section>
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

  return (
    <div className="app-shell">
      {user ? (
        <div className="dashboard-shell">
          <aside className="sidebar">
            <div className="brand">Agendly</div>
            {suscripcion.estado !== 'vencida' && (
            <nav >
              <a 
                className={currentPage === 'dashboard' ? 'active' : ''}
                onClick={() => setCurrentPage('dashboard')}
              >Inicio</a>

              <a
                className={currentPage === 'agenda' ? 'active' : ''}
                onClick={() => setCurrentPage('agenda')}
              >Agenda</a>

              <a style={{ display: user.rol === 'Empleado' ? 'none' : 'block' }}
                className={currentPage === 'usuarios' ? 'active' : ''}
                onClick={() => setCurrentPage('usuarios')}
              >Usuarios</a>

              <a style={{ display: user.rol === 'Empleado' ? 'none' : 'block' }}
                className={currentPage === 'negocio' ? 'active' : ''}
                onClick={() => setCurrentPage('negocio')}
              >Negocio</a>

              <a style={{ display: user.rol === 'Empleado' ? 'none' : 'block' }}
                className={currentPage === 'servicios' ? 'active' : ''}
                onClick={() => setCurrentPage('servicios')}
              >Servicios</a>

              <a
                className={currentPage === 'clientes' ? 'active' : ''}
                onClick={() => setCurrentPage('clientes')}
              >Clientes</a>
              <a style={{ display: user.rol === 'Empleado' ? 'none' : 'block' }}
                className={currentPage === 'estadisticas' ? 'active' : ''}
                onClick={() => setCurrentPage('estadisticas')}
              >Estadisticas</a>
            </nav>
            )}
          </aside>

          <main className="dashboard-content">
            {renderPage()}
          </main>
        </div>
      ) : (
        <div className="login-page">
          <div className="login-card">
            <h1>Login Agendly</h1>
            <p className="login-text">{status}</p>
            <form onSubmit={handleSubmit} className="login-form">
              <label>
                Usuario
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="usuario"
                />
              </label>
              <label>
                Contraseña
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="contraseña"
                />
              </label>
              <button type="submit" disabled={loading}>
                {loading ? 'Entrando...' : 'Iniciar sesión'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
