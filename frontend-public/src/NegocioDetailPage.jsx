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
          <center>
            <img src={negocio.photo} alt="" />
            {negocio.name}
          </center>
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
      

      <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-gray-900">Nuestros Especialistas</h3>
            <p className="text-gray-600 mt-2">Selecciona un profesional para ver los servicios que ofrece</p>
          </div>
          
          {empleados.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              
              {empleados.map(empleado => {
                // Primero obtenemos las sucursales que permiten agendar
                const sucursalesPermitidas = negocio.sucursales
                  .filter(sucursal => sucursal.permite_agendar)
                  .map(sucursal => sucursal.id);
                
                // Verificar si la sucursal del empleado permite agendar
                const sucursalPermiteAgendar = sucursalesPermitidas.includes(empleado.sucursal_id);
                
                // Filtrar servicios que pertenecen a este empleado (sin importar si permite agendar o no)
                const serviciosDelEmpleado = servicios.filter(servicio =>
                  empleado.servicios_ids &&
                  empleado.servicios_ids.includes(servicio.id)
                );
                
                const estaAbierto = empleadosAbiertos.includes(empleado.id);
                
                return (
                  <div
                    key={empleado.id}
                    className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
                  >
                    {/* Header del colaborador */}
                    <button
                      onClick={() => toggleEmpleado(empleado.id)}
                      className="w-full text-left p-5 hover:bg-gray-50 transition-colors duration-200"
                    >
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="text-lg font-semibold text-gray-900">
                              {empleado.name}
                            </h4>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {empleado.sucursal}
                            </span>
                          </div>
                          
                          {empleado.description && (
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {empleado.description}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex-shrink-0">
                          <div className={`w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center transition-transform duration-300 ${estaAbierto ? 'rotate-180' : ''}`}>
                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      
                      {/* Indicador de servicios disponibles */}
                      <div className="mt-3">
                        <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          {serviciosDelEmpleado.length} {serviciosDelEmpleado.length === 1 ? 'servicio' : 'servicios'} disponible{serviciosDelEmpleado.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </button>
                    
                    {/* Servicios del colaborador */}
                    <div className={`transition-all duration-300 overflow-hidden ${estaAbierto ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                      {estaAbierto && (
                        <div className="border-t border-gray-100 bg-gray-50 p-5">
                          <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                            Servicios ofrecidos
                          </h5>
                          
                          {serviciosDelEmpleado.length > 0 ? (
                            <div className="space-y-3">
                              {serviciosDelEmpleado.map(servicio => (
                                <div
                                  key={servicio.id}
                                  className="bg-white rounded-xl p-4 hover:shadow-md transition-all duration-200 border border-gray-200 group"
                                >
                                  <div className="flex justify-between items-start mb-3">
                                    <div className="flex-1">
                                      <h6 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                        {servicio.nombre}
                                      </h6>
                                    </div>
                                    
                                    {/* Botón Agendar - SOLO se muestra si la sucursal PERMITE agendar */}
                                    {sucursalPermiteAgendar && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleAgendar(servicio, empleado);
                                        }}
                                        className="ml-3 bg-black text-white text-xs px-4 py-2 rounded-lg hover:bg-gray-800 transition-all duration-200 hover:shadow-md hover:scale-105 transform"
                                      >
                                        Agendar
                                      </button>
                                    )}
                                    
                                    {/* Si no permite agendar, mostrar mensaje */}
                                    {!sucursalPermiteAgendar && (
                                      <span className="ml-3 text-xs text-gray-400 px-4 py-2 bg-gray-100 rounded-lg">
                                        No disponible para agendar
                                      </span>
                                    )}
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-2 mb-2">
                                    <div className="flex items-center gap-1 text-sm text-gray-600">
                                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      <span className="font-medium">${formatPrice(servicio.precio)}</span>
                                    </div>
                                    
                                    <div className="flex items-center gap-1 text-sm text-gray-600">
                                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      <span>{servicio.tiempo} min</span>
                                    </div>
                                  </div>
                                  
                                  {servicio.notas && (
                                    <div className="mt-2 pt-2 border-t border-gray-100">
                                      <p className="text-xs text-gray-500 flex items-start gap-1">
                                        <svg className="w-3 h-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        {servicio.notas}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 bg-white rounded-xl">
                              <svg className="w-12 h-12 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <p className="text-sm text-gray-500">
                                Este profesional no tiene servicios disponibles
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              
            </div>
          ) : (
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-12 text-center border-2 border-dashed border-gray-200">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-gray-500 text-lg">
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
