import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import CitaFormModal from './CitaFormModal'

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/'

// Función para formatear precios con puntos de miles
const formatPrice = (price) => {
  return parseFloat(price).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

function NegocioDetailPage() {
  const navigate = useNavigate()
  const { negocioId } = useParams()
  const [negocio, setNegocio] = useState(null)
  const [servicios, setServicios] = useState([])
  const [empleados, setEmpleados] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCitaModal, setShowCitaModal] = useState(false)
  const [selectedServicio, setSelectedServicio] = useState(null)
  const [selectedEmpleado, setSelectedEmpleado] = useState(null)

  useEffect(() => {
    loadNegocioDetail()
  }, [negocioId])

  const loadNegocioDetail = async () => {
    try {
      // Cargar negocio
      const negociosResponse = await fetch(`${apiUrl}negocios/`)
      const negociosData = await negociosResponse.json()
      const negocioEncontrado = negociosData.negocios.find(n => n.id === parseInt(negocioId))
      
      if (negocioEncontrado) {
        setNegocio(negocioEncontrado)
        
        // Cargar servicios del negocio
        loadServicios(negocioEncontrado)
        
        // Cargar empleados del negocio
        loadEmpleados(negocioEncontrado)
      }
    } catch (error) {
      console.error('Error loading negocio detail:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadServicios = async (negocioData) => {
    try {
      const response = await fetch(`${apiUrl}negocio/${negocioData.id}/servicios/`)
      const data = await response.json()
      const serviciosFiltrados = data.servicios.filter(
        s => s.negocio === negocioData.name
      )
      setServicios(serviciosFiltrados)
    } catch (error) {
      console.error('Error loading servicios:', error)
    }
  }

  const loadEmpleados = async (negocioData) => {
    try {
      const response = await fetch(`${apiUrl}usuarios/`)
      const data = await response.json()
      const empleadosFiltrados = data.usuarios.filter(
        u => u.negocio === negocioData.name && u.rol === 'Empleado'
      )
      setEmpleados(empleadosFiltrados)
    } catch (error) {
      console.error('Error loading empleados:', error)
    }
  }

  const handleAgendar = (servicio, empleado) => {
    setSelectedServicio(servicio)
    setSelectedEmpleado(empleado)
    setShowCitaModal(true)
  }

  const handleCitaSuccess = () => {
    // Aquí podríamos recargar datos si fuera necesario
    // Por ahora solo cerramos el modal
  }

  if (loading) {
    return <div className="loading">Cargando...</div>
  }

  if (!negocio) {
    return <div className="error">Negocio no encontrado</div>
  }

  return (
    <div className="public-app">
      <header className="public-header">
        <h1>Agendly</h1>
        <p>Reserva tu cita en el negocio de tu preferencia</p>
        <button 
          className="back-to-negocios"
          onClick={() => navigate('/negocios')}
        >
          ← Volver a negocios
        </button>
      </header>

      <div className="negocio-detail">
        <div className="negocio-info">
          <h2>{negocio.name}</h2>
          <div className="info-details">
            <p><strong>Dirección:</strong> {negocio.direccion}</p>
            <p><strong>Ciudad:</strong> {negocio.ciudad}</p>
            <p><strong>Barrio:</strong> {negocio.barrio}</p>
            <p><strong>Teléfono:</strong> {negocio.tel}</p>
            <p><strong>Whatsapp:</strong> {negocio.whatsapp}</p>
          </div>
            <div className="horario">
              <strong>Horario-Notas:</strong>
              <p>{negocio.horario}</p>
            </div>
        </div>

        <div className="servicios-section">
          <h3>Servicios disponibles</h3>
          {servicios.length > 0 ? (
            <div className="servicios-grid">
              {servicios.map(servicio => (
                <div key={servicio.id} className="servicio-card">
                  <h4>{servicio.nombre}</h4>
                  <p><strong>Precio:</strong> ${formatPrice(servicio.precio)}</p>
                  <p><strong>Duración:</strong> {servicio.tiempo} minutos</p>
                  {negocio.permite_agendar && (
                    <div className="empleados-list">
                      <h5>Colaboradores:</h5>
                      {(() => {
                        const empleadosParaServicio = empleados.filter(empleado => 
                          empleado.servicios_ids && empleado.servicios_ids.includes(servicio.id)
                        )
                        return empleadosParaServicio.length > 0 ? (
                          empleadosParaServicio.map(empleado => (
                            <button
                              key={empleado.id}
                              className="agendar-button"
                              onClick={() => handleAgendar(servicio, empleado)}
                            >
                              Agendar con {empleado.name}
                            </button>
                          ))
                        ) : (
                          <p className="no-empleados">No hay colaboradores disponibles para este servicio</p>
                        )
                      })()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="no-servicios">
              <p>No hay servicios disponibles en este momento</p>
            </div>
          )}
        </div>
      </div>

      {showCitaModal && selectedServicio && selectedEmpleado && negocio && (
        <CitaFormModal
          servicio={selectedServicio}
          empleado={selectedEmpleado}
          negocio={negocio}
          onClose={() => setShowCitaModal(false)}
          onSuccess={handleCitaSuccess}
        />
      )}
    </div>
  )
}

export default NegocioDetailPage
