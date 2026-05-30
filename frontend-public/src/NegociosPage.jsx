import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/'

function NegociosPage() {
  const navigate = useNavigate()
  const [negocios, setNegocios] = useState([])
  const [loading, setLoading] = useState(true)
  const [ciudades, setCiudades] = useState([])
  const [barrios, setBarrios] = useState([])
  const [selectedCiudad, setSelectedCiudad] = useState('')
  const [selectedBarrio, setSelectedBarrio] = useState('')
  const hasInitialized = useRef(false)


  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      loadNegocios()
    }
  }, [])

  const loadNegocios = async () => {
    try {
      const response = await fetch(`${apiUrl}negocios-sucursales/`)
      const data = await response.json()
      const negociosList = data.negocios || []
      setNegocios(negociosList)
      
      // Extraer ciudades y barrios únicos
      const uniqueCiudades = [...new Set(negociosList.map(n => n.sucursales.map(s => s.ciudad)).flat().filter(Boolean))]
      setCiudades(uniqueCiudades)
      
      // Extraer todos los barrios inicialmente
      const uniqueBarrios = [...new Set(negociosList.map(n => n.sucursales.map(s => s.barrio)).flat().filter(Boolean))]
      setBarrios(uniqueBarrios)
    } catch (error) {
      console.error('Error loading negocios:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCiudadChange = (ciudad) => {
    setSelectedCiudad(ciudad)
    setSelectedBarrio('') // Reset barrio
    
    // Actualizar barrios basado en la ciudad seleccionada
    if (ciudad) {
      const negociosFiltrados = negocios.filter(n => n.sucursales.some(s => s.ciudad === ciudad))
      const uniqueBarrios = [...new Set(negociosFiltrados.map(n => n.sucursales.map(s => s.barrio)).flat().filter(Boolean))]
      setBarrios(uniqueBarrios)
    } else {
      const uniqueBarrios = [...new Set(negocios.map(n => n.sucursales.map(s => s.barrio)).flat().filter(Boolean))]
      setBarrios(uniqueBarrios)
    }
  }

  const getNegociosFiltrados = () => {
    return negocios.filter(negocio => {
      const matchCiudad = !selectedCiudad || negocio.sucursales.some(s => s.ciudad === selectedCiudad)
      const matchBarrio = !selectedBarrio || negocio.sucursales.some(s => s.barrio === selectedBarrio)
      return matchCiudad && matchBarrio
    })
  }

  const negociosFiltrados = getNegociosFiltrados()

  const handleNegocioSelect = (negocio) => {
    const nombreUrl = negocio.name.toLowerCase().replace(/\s+/g, '-')
    navigate(`/negocio/${negocio.id}/${nombreUrl}`)
  }

  if (loading) {
    return <div className="loading">Cargando...</div>
  }

  return (
    <div className="public-app">
       <header className="bg-white rounded-2xl shadow-sm px-4 py-3 mb-4 border border-gray-100">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Kelzo</h1>
            <p className="text-sm text-gray-500">
              Reserva tu cita en el negocio de tu preferencia
            </p>
          </div>
          <button onClick={() => navigate('/')} 
            className="bg-gray-100 hover:bg-gray-200 transition px-3 py-2 rounded-xl text-sm font-medium text-gray-700"
          >
            ← Volver al inicio
          </button>

        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            Filtrar por
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* CIUDAD */}
            <div>
              <label htmlFor="ciudad-filter"
                className="block text-xs font-medium text-gray-600 mb-1"
              >
                Ciudad
              </label>

              <select
                id="ciudad-filter"
                value={selectedCiudad}
                onChange={(e) => handleCiudadChange(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="">Todas las ciudades</option>
                {ciudades.map(ciudad => (
                  <option key={ciudad} value={ciudad}>
                    {ciudad}
                  </option>
                ))}
              </select>
            </div>

            {/* BARRIO */}
            <div>
              <label
                htmlFor="barrio-filter"
                className="block text-xs font-medium text-gray-600 mb-1"
              >
                Barrio
              </label>

              <select
                id="barrio-filter"
                value={selectedBarrio}
                onChange={(e) => setSelectedBarrio(e.target.value)}
                disabled={!selectedCiudad}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black disabled:bg-gray-100 disabled:text-gray-400"
              >
                <option value="">Todos los barrios</option>
                {barrios.map(barrio => (
                  <option key={barrio} value={barrio}>
                    {barrio}
                  </option>
                ))}
              </select>
            </div>

          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Negocios disponibles ({negociosFiltrados.length})
          </h2>

          {negociosFiltrados.length > 0 ? (
            
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

              {negociosFiltrados.map((negocio) => (
                <div
                  key={negocio.id}
                  onClick={() => handleNegocioSelect(negocio)}
                  className="cursor-pointer bg-gray-50 hover:bg-gray-100 transition border border-gray-200 rounded-2xl p-4"
                >

                  {/* NOMBRE */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    {negocio.name}
                  </h3>

                  {/* SUCURSALES */}
                  {negocio.sucursales?.length > 0 && (
                    <div className="space-y-2">

                      {negocio.sucursales.map((sucursal) => (
                        <div
                          key={sucursal.id}
                          className="bg-white border border-gray-100 rounded-xl px-3 py-2"
                        >

                          <p className="text-sm font-medium text-gray-800">
                            {sucursal.name}
                          </p>

                          <span className="text-xs text-gray-500">
                            {sucursal.ciudad} - {sucursal.barrio}
                          </span>

                        </div>
                      ))}

                    </div>
                  )}

                </div>
              ))}

            </div>

          ) : (
            
            <div className="bg-gray-50 rounded-xl p-6 text-center">
              <p className="text-gray-500">
                No se encontraron negocios con los filtros seleccionados
              </p>
            </div>

          )}

        </div>

      </div>
    </div>
  )
}

export default NegociosPage
