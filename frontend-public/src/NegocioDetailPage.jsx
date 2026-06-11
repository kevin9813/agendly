import { useEffect, useState, useRef } from 'react'
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
  const hasInitialized = useRef(false)


  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      loadNegocioDetail()
    }
  }, [negocioId])

  const loadNegocioDetail = async () => {
    try {
      // Cargar negocio
      const negociosResponse = await fetch(`${apiUrl}negocio-sucursales/${negocioId}/`)
      const negocioData = await negociosResponse.json()
      const negocioEncontrado = negocioId
      
      if (negocioData) {
        setNegocio(negocioData)
        // Cargar servicios del negocio
        loadServicios(negocioData)
        // Cargar empleados del negocio
        loadEmpleados(negocioData)
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
    // Por ahora 
    // solo cerramos el modal
  }

  // Estado para controlar qué empleados tienen sus servicios visibles
  const [empleadosAbiertos, setEmpleadosAbiertos] = useState([]);

  // Función para toggle (abrir/cerrar) los servicios de un empleado
  const toggleEmpleado = (empleadoId) => {
    setEmpleadosAbiertos(prev => 
      prev.includes(empleadoId)
        ? prev.filter(id => id !== empleadoId)
        : [...prev, empleadoId]
    );
  };

  if (loading) {
    return <div className="loading">Cargando...</div>
  }

  if (!negocio) {
    return <div className="error">Negocio no encontrado</div>
  }

  return (
    <div className="public-app">
      <header className="bg-white rounded-2xl shadow-sm px-4 py-3 mb-4 border border-gray-100">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Kelzo</h1>
            <p className="text-sm text-gray-500">
              Reserva fácil y rápido
            </p>
          </div>
          <button onClick={() => navigate('/negocios')} 
            className="bg-gray-100 hover:bg-gray-200 transition px-3 py-2 rounded-xl text-sm font-medium text-gray-700"
          >
            ← Negocios
          </button>

        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-5">
          {negocio.name}
        </h2>

        {negocio.sucursales && negocio.sucursales.length > 0 ? (
          <div className="space-y-4">
            
            {negocio.sucursales.map((sucursal, index) => (
              <details
                key={sucursal.id}
                className="group border border-gray-200 rounded-2xl overflow-hidden"
                open={index === 0}
              >
                
                <summary className="flex items-center justify-between cursor-pointer list-none px-4 py-4 bg-gray-50 hover:bg-gray-100 transition">
                  
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {sucursal.name}
                    </h3>

                    <p className="text-sm text-gray-500">
                      {sucursal.ciudad} / {sucursal.barrio}
                    </p>
                  </div>

                  <div className="text-gray-400 transition-transform duration-300 group-open:rotate-180">
                    ▼
                  </div>

                </summary>

                <div className="p-4 space-y-5">

                  <div className="grid gap-3 sm:grid-cols-2">
                    
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-500 mb-1">
                        Dirección
                      </p>

                      <p className="text-sm font-medium text-gray-800">
                        {sucursal.direccion}
                      </p>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-500 mb-1">
                        Teléfono
                      </p>

                      <p className="text-sm font-medium text-gray-800">
                        {sucursal.tel}
                      </p>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-3 sm:col-span-2">
                      <p className="text-xs text-gray-500 mb-1">
                        WhatsApp
                      </p>

                      <p className="text-sm font-medium text-gray-800">
                        {sucursal.whatsapp}
                      </p>
                    </div>

                  </div>

                  <div>
                    
                    <div className="mb-3">
                      <h3 className="text-sm font-semibold text-gray-900">
                        Horarios de Atención
                      </h3>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2">
                      
                      {sucursal.horarios?.map((horario) => (
                        <div
                          key={horario.id || horario.dia_semana}
                          className={`
                            flex items-center justify-between rounded-xl border px-3 py-2 text-sm
                            ${
                              horario.activo
                                ? 'border-gray-200 bg-gray-50'
                                : 'border-gray-100 bg-gray-100 opacity-60'
                            }
                          `}
                        >
                          
                          <span className="font-medium text-gray-700">
                            {horario.nombre}
                          </span>

                          {horario.activo ? (
                            <span className="text-gray-600">
                              {horario.hora_inicio} - {horario.hora_fin}
                            </span>
                          ) : (
                            <span className="text-red-500">
                              Cerrado
                            </span>
                          )}

                        </div>
                      ))}

                    </div>

                  </div>

                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                    
                    <p className="text-sm font-semibold text-amber-700 mb-1">
                      Notas
                    </p>

                    <p className="text-sm text-amber-800">
                      {sucursal.horario}
                    </p>

                  </div>

                </div>

              </details>
            ))}

          </div>
        ) : (
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <p className="text-gray-500">
              No hay sucursales disponibles.
            </p>
          </div>
        )}

      </div>

        <div className="max-w-6xl mx-auto px-4 py-6">
          <h3 className="text-xl font-bold text-gray-900 mb-5">Colaboradores y sus servicios</h3>
          
          {empleados.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              
              {empleados.map(empleado => {
                // Filtrar servicios que pertenecen a este empleado y sucursal permite agendar
                const sucursalesPermitidas = negocio.sucursales
                  .filter(sucursal => sucursal.permite_agendar)
                  .map(sucursal => sucursal.id);
                
                const serviciosDelEmpleado = servicios.filter(servicio =>
                  empleado.servicios_ids &&
                  empleado.servicios_ids.includes(servicio.id) &&
                  sucursalesPermitidas.includes(empleado.sucursal_id)
                );
                
                return (
                  <div
                    key={empleado.id}
                    className="border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md transition"
                  >
                    {/* Botón/Banner del colaborador - al hacer click toggle servicios */}
                    <button
                      onClick={() => toggleEmpleado(empleado.id)}
                      className="w-full text-left p-4 bg-gray-50 hover:bg-gray-100 transition"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">
                            {empleado.name} <small>{empleado.sucursal}</small>
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {empleado.description}
                          </p>
                        </div>
                        <span className="text-gray-500">
                          {empleadosAbiertos.includes(empleado.id) ? '▲' : '▼'}
                        </span>
                      </div>
                    </button>
                    
                    {/* Servicios del colaborador (desplegable) */}
                    {empleadosAbiertos.includes(empleado.id) && (
                      <div className="p-4 border-t border-gray-200">
                        {serviciosDelEmpleado.length > 0 ? (
                          <div className="space-y-3">
                            <h5 className="text-sm font-semibold text-gray-700 mb-2">
                              Servicios que ofrece:
                            </h5>
                            {serviciosDelEmpleado.map(servicio => (
                              <div
                                key={servicio.id}
                                className="bg-white border border-gray-100 rounded-xl p-3 hover:shadow-sm transition"
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <h6 className="font-semibold text-gray-900">
                                    {servicio.nombre}
                                  </h6>
                                  <button
                                    onClick={() => handleAgendar(servicio, empleado)}
                                    className="bg-black text-white text-xs px-3 py-1.5 rounded-lg hover:bg-gray-800 transition ml-2"
                                  >
                                    Agendar
                                  </button>
                                </div>
                                <div className="space-y-1 text-xs text-gray-600">
                                  <p>
                                    <span className="font-medium">Precio:</span> $
                                    {formatPrice(servicio.precio)}
                                  </p>
                                  <p>
                                    <span className="font-medium">Duración:</span>{" "}
                                    {servicio.tiempo} minutos
                                  </p>
                                  {servicio.notas && (
                                    <p>
                                      <span className="font-medium">Notas:</span>{" "}
                                      {servicio.notas}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 text-center py-4">
                            Este colaborador no tiene servicios disponibles
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-gray-500">
                No hay colaboradores disponibles en este momento
              </p>
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
