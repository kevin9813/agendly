import { useEffect, useMemo, useRef, useState } from 'react'
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/'

function ContabilidadPage({ user }) {
  const [loading, setLoading] = useState(true)
  const [usuarios, setUsuarios] = useState([])
  const [selectedUserId, setSelectedUserId] = useState('')
  const [dateStart, setDateStart] = useState('')
  const [dateEnd, setDateEnd] = useState('')
  const [reportData, setReportData] = useState(null)
  const hasInitialized = useRef(false)

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      loadData()
    }
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [usuariosResponse] = await Promise.all([
        fetch(`${apiUrl}usuarios/`, { credentials: 'include' }),
      ])

      if (usuariosResponse.ok) {
        const usuariosData = await usuariosResponse.json()
        setUsuarios(usuariosData.usuarios || [])
        if (user?.rol === 'Empleado') {
          setSelectedUserId(user.id)
        }
      }
    } catch (error) {
      console.error('Error cargando datos de estadísticas:', error)
    } finally {
      setLoading(false)
    }
  }

  const usuariosFiltrables = useMemo(() => {
    if (user?.rol === 'Empleado') {
      return usuarios.filter((u) => u.id === user.id)
    }
    return usuarios.filter((u) => u.rol === 'Empleado')
  }, [usuarios, user])

  if (loading) {
    return <div className="loading">Cargando Contabilidad...</div>
  }

    const handleSearch =  async (e) => {
        e.preventDefault()
        try {
            const response = await fetch(`${apiUrl}citas/filter/`, {
                method: 'POST',
                headers: {
                'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    fecha_inicio: dateStart,
                    fecha_fin: dateEnd,
                    empleado_id: selectedUserId,
                    estado: 'completada',
                    negocio_id: user.negocio_id,
                }),
            })
            if (response.ok) {
                const data = await response.json()
                // Procesar los datos del reporte
                setReportData(data)
            }
        } catch (error) {
        console.error('Error cargando reporte:', error)
        alert('Error al cargar el reporte. Por favor, intenta nuevamente.')
        }
    }

    const calcularTotalIngresos = () => {
        if (!reportData?.citas || reportData.citas.length === 0) return 0
        
        const total = reportData.citas.reduce((sum, cita) => {
            return sum + (cita.precio_final || 0)
        }, 0)
        
        return total
    }

    // Agrega esta función dentro de tu componente
    const getEstadisticasPorEmpleado = () => {
        if (!reportData?.citas || reportData.citas.length === 0) {
            return []
        }        
        // Agrupar por empleado
        const empleadosMap = new Map()
        
        reportData.citas.forEach(cita => {
            const empleadoNombre = cita.empleado
            const empleadoId = cita.empleado_id
            const precio = cita.precio_final || 0
            
            if (!empleadosMap.has(empleadoId)) {
                empleadosMap.set(empleadoId, {
                    id: empleadoId,
                    nombre: empleadoNombre,
                    totalCitas: 0,
                    totalIngresos: 0
                })
            }
            
            const empleado = empleadosMap.get(empleadoId)
            empleado.totalCitas += 1
            empleado.totalIngresos += precio
        })
        
        // Convertir a array y calcular ranking
        let empleadosArray = Array.from(empleadosMap.values())
        
        // Ordenar por ingresos (mayor a menor)
        empleadosArray.sort((a, b) => b.totalIngresos - a.totalIngresos)
        
        // Agregar ranking
        empleadosArray = empleadosArray.map((emp, index) => ({
            ...emp,
            ranking: index + 1,
            rankingIcon: getRankingIcon(index + 1)
        }))
        
        return empleadosArray
    }

    // Función para el ícono del ranking
    const getRankingIcon = (ranking) => {
        if (ranking === 1) return '⭐⭐⭐'
        if (ranking === 2) return '⭐⭐'
        if (ranking === 3) return '⭐'
        return `#${ranking}`
    }

    // Top Clientes - Agrupar por cliente
    const getTopClientes = () => {
        if (!reportData?.citas || reportData.citas.length === 0) {
            return []
        }
        
        const clientesMap = new Map()
        
        reportData.citas.forEach(cita => {
            const clienteNombre = cita.cliente
            const clienteId = cita.cliente_id
            const precio = cita.precio_final || 0
            
            if (!clientesMap.has(clienteId)) {
                clientesMap.set(clienteId, {
                    id: clienteId,
                    nombre: clienteNombre,
                    totalCitas: 0,
                    totalGastado: 0
                })
            }
            
            const cliente = clientesMap.get(clienteId)
            cliente.totalCitas += 1
            cliente.totalGastado += precio
        })
        
        // Convertir a array y ordenar por total gastado
        let clientesArray = Array.from(clientesMap.values())
        clientesArray.sort((a, b) => b.totalGastado - a.totalGastado)
        
        // Tomar top 5
        return clientesArray.slice(0, 5).map((cliente, index) => ({
            ...cliente,
            ranking: index + 1,
            rankingIcon: getRankingIcon(index + 1)
        }))
    }

    // Servicios Más Populares
    const getServiciosPopulares = () => {
        if (!reportData?.citas || reportData.citas.length === 0) {
            return []
        }
        
        const serviciosMap = new Map()
        const totalCitas = reportData.citas.length
        
        reportData.citas.forEach(cita => {
            const servicioNombre = cita.servicio
            const servicioId = cita.servicio_id
            const precio = cita.precio_final || 0
            

            if (!serviciosMap.has(servicioId)) {
                serviciosMap.set(servicioId, {
                    id: servicioId,
                    nombre: servicioNombre,
                    totalCitas: 0,
                    totalIngresos: 0
                })
            }
            
            const servicio = serviciosMap.get(servicioId)
            servicio.totalCitas += 1
            servicio.totalIngresos += precio
        })
        
        // Convertir a array y ordenar por cantidad de citas
        let serviciosArray = Array.from(serviciosMap.values())
        serviciosArray.sort((a, b) => b.totalCitas - a.totalCitas)
        
        // Calcular porcentaje y tomar top 5
        return serviciosArray.slice(0, 5).map(servicio => ({
            ...servicio,
            porcentaje: Math.round((servicio.totalCitas / totalCitas) * 100),
            ingresosFormateados: `$${servicio.totalIngresos.toLocaleString()}`
        }))
    }

  return (
    <section className="min-h-screen rounded-2xl border dark:border-slate-800 dark:bg-gray-800 p-6">
        <div className="flex justify-between items-center mb-8 gap-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Contabilidad y Reportes
            </h2>
            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl transition-all duration-200 text-sm font-medium shadow-lg shadow-indigo-500/20">
                Exportar PDF (Proximamente)
            </button>
        </div>

        <div className='rounded-3xl bg-white border dark:border-slate-800 dark:bg-[#111827] p-6 shadow-2xl'>
            <div className="flex flex-col gap-5">
                
                {/* Filtros */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-2">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Fecha inicio
                        </label>
                        <input 
                        type="date" 
                        value={dateStart}
                        onChange={(event) => setDateStart(event.target.value)}
                        onClick={(e) => e.target.showPicker()} 
                        className="w-full h-12 rounded-2xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all disabled:cursor-not-allowed disabled:opacity-60"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Fecha fin
                        </label>
                        <input 
                        type="date" 
                        value={dateEnd}
                        onChange={(event) => setDateEnd(event.target.value)}
                        onClick={(e) => e.target.showPicker()} 
                        className="w-full h-12 rounded-2xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all disabled:cursor-not-allowed disabled:opacity-60"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Usuario
                        </label>
                        <select
                            value={selectedUserId}
                            onChange={(event) => setSelectedUserId(event.target.value)}
                            disabled={user?.rol === 'Empleado'}
                            className="w-full h-12 rounded-2xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                            >
                            <option value="">Todos</option>

                            {usuariosFiltrables.map((usuario) => (
                                <option key={usuario.id} value={usuario.id}>
                                {usuario.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">&nbsp;</label>
                        <button  onClick={handleSearch}className="w-full h-12 rounded-2xl border border-blue-500 bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                            Buscar
                        </button>
                    </div>
                </div>
            </div>
        </div>


        
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 mt-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xl font-bold text-slate-500 dark:text-white">
                    Total Citas <small className="text-lg font-normal text-slate-500 dark:text-slate-400">(completadas)</small>
                </p>
                <h2 className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
                    {reportData?.total || 0}
                </h2>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xl font-bold text-slate-500 dark:text-white">
                    Total Ingresos
                </p>
                <h2 className="mt-3 text-4xl font-bold text-slate-900 dark:text-white">
                    $ {calcularTotalIngresos()?.toLocaleString() || 0}
                </h2>
            </div>
        </div>

        <div className="grid grid-cols-1 gap-6 mt-2">
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                <thead className="bg-slate-50 dark:bg-slate-800/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Empleado
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Citas
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Ingresos
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Ranking
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {getEstadisticasPorEmpleado().map((empleado) => (
                        <tr key={empleado.id} className="transition hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">
                                {empleado.nombre}
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                                {empleado.totalCitas}
                            </td>
                            <td className="px-6 py-4 text-sm font-semibold text-green-600 dark:text-green-400">
                                ${empleado.totalIngresos.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 text-xl">
                                {empleado.rankingIcon}
                            </td>
                        </tr>
                    ))}
                </tbody>

            </table>
            {/* Mensaje si no hay datos */}
            {getEstadisticasPorEmpleado().length === 0 && (
                <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                    No hay datos de empleados para mostrar
                </div>
            )}

            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* TOP CLIENTES - Estilo como la imagen */}
            <div className="rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-amber-50 to-transparent dark:from-amber-900/10">
                    <div className="flex items-center gap-2">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Top Clientes</h3>
                            <p className="text-xs text-slate-500">Por volumen de gasto</p>
                        </div>
                    </div>
                </div>
                
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {getTopClientes().map((cliente, idx) => (
                        <div key={cliente.id} className="px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition group">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                   
                                    <div>
                                        <p className="font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                                            {cliente.nombre} {cliente.rankingIcon}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            {cliente.totalCitas} citas realizadas
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-bold text-green-600 dark:text-green-400">
                                        ${cliente.totalGastado.toLocaleString()}
                                    </p>
                                    <p className="text-xs text-slate-400">total gastado</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* SERVICIOS POPULARES - Estilo como la imagen */}
            <div className="rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-purple-50 to-transparent dark:from-purple-900/10">
                    <div className="flex items-center gap-2">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Servicios Más Populares</h3>
                            <p className="text-xs text-slate-500">Los más reservados</p>
                        </div>
                    </div>
                </div>
                
                <div className="p-6 space-y-6">
                    {getServiciosPopulares().map((servicio, idx) => (
                        <div key={servicio.id} className="group">
                            <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center gap-2">
                                    <span className={`
                                        w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                                        ${idx === 0 ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-400' :
                                        'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}
                                    `}>
                                        {idx + 1}
                                    </span>
                                    <span className="font-medium text-slate-900 dark:text-white">
                                        {servicio.nombre}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                                        {servicio.totalCitas} citas
                                    </span>
                                    <span className="text-xs text-slate-400">
                                        ${servicio.totalIngresos.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                            <div className="relative">
                                <div className="overflow-hidden h-2 text-xs flex rounded-full bg-slate-100 dark:bg-slate-700">
                                    <div
                                        style={{ width: `${servicio.porcentaje}%` }}
                                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 rounded-full"
                                    />
                                </div>
                                <div className="flex justify-end mt-1">
                                    <span className="text-xs font-medium text-slate-400">
                                        {servicio.porcentaje}% del total
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
        

    </section>

  )
}

export default ContabilidadPage