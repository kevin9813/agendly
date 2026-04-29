import { useEffect, useState } from 'react'
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

  useEffect(() => {
    loadNegocios()
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
      <header className="public-header">
        <h1>Agendly</h1>
        <p>Reserva tu cita en el negocio de tu preferencia</p>
        <button 
          className="back-to-home"
          onClick={() => navigate('/')}
        >
          ← Volver al inicio
        </button>
      </header>

      <div className="negocios-container">
        <div className="filters-section">
          <h3>Filtrar por:</h3>
          
          <div className="filters-row">
            <div className="filter-group">
              <label htmlFor="ciudad-filter">Ciudad:</label>
              <select 
                id="ciudad-filter"
                value={selectedCiudad}
                onChange={(e) => handleCiudadChange(e.target.value)}
                className="filter-select"
              >
                <option value="">Todas las ciudades</option>
                {ciudades.map(ciudad => (
                  <option key={ciudad} value={ciudad}>
                    {ciudad}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="barrio-filter">Barrio:</label>
              <select 
                id="barrio-filter"
                value={selectedBarrio}
                onChange={(e) => setSelectedBarrio(e.target.value)}
                className="filter-select"
                disabled={!selectedCiudad}
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

        <div className="negocios-grid">
          <h2>Negocios disponibles {negociosFiltrados.length}</h2>
          {negociosFiltrados.length > 0 ? (
            <div className="grid">
              {negociosFiltrados.map((negocio) => (
                <div
                  key={negocio.id}
                  className="negocio-card"
                  onClick={() => handleNegocioSelect(negocio)}
                >
                  <h3>{negocio.name}</h3>

                  {negocio.sucursales && negocio.sucursales.length > 0 && (
                    <div className="sucursales-list">
                      {negocio.sucursales.map((sucursal) => (
                        <div key={sucursal.id} className="sucursal-item">
                          <p className="sucursal-name">{sucursal.name}</p>
                          <span className="sucursal-location">
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
            <div className="no-results">
              <p>No se encontraron negocios con los filtros seleccionados</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default NegociosPage
