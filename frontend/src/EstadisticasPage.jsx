import { useEffect, useMemo, useRef, useState } from 'react'

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/'

const periodOptions = [
  { value: 'diario', label: 'Diario' },
  { value: 'semanal', label: 'Semanal' },
  { value: 'mensual', label: 'Mensual' },
]

const formatDateLabel = (date) => {
  return date.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: '2-digit' })
}

const formatMonthLabel = (date) => {
  return date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })
}

const getDateKey = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getWeekStart = (date) => {
  const copy = new Date(date)
  const day = copy.getDay()
  const diff = (day + 6) % 7
  copy.setDate(copy.getDate() - diff)
  copy.setHours(0, 0, 0, 0)
  return copy
}

const getGroupKey = (date, period) => {
  if (period === 'diario') {
    return getDateKey(date)
  }
  if (period === 'semanal') {
    const weekStart = getWeekStart(date)
    return getDateKey(weekStart)
  }
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

const parseLocalDate = (dateString) => {
  const [year, month, day] = dateString.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  date.setHours(0, 0, 0, 0)
  return date
}

const buildLabels = (period) => {
  const today = new Date()
  const labels = []

  if (period === 'diario') {
    for (let i = 6; i >= 0; i -= 1) {
      const day = new Date(today)
      day.setDate(today.getDate() - i)
      day.setHours(0, 0, 0, 0)
      labels.push({ key: getDateKey(day), label: formatDateLabel(day), date: day })
    }
    return labels
  }

  if (period === 'semanal') {
    const currentWeekStart = getWeekStart(today)
    for (let i = 7; i >= 0; i -= 1) {
      const week = new Date(currentWeekStart)
      week.setDate(currentWeekStart.getDate() - i * 7)
      const end = new Date(week)
      end.setDate(week.getDate() + 6)
      const label = `${week.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })} - ${end.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}`
      labels.push({ key: getDateKey(week), label, date: week })
    }
    return labels
  }

  if (period === 'mensual') {
    for (let i = 11; i >= 0; i -= 1) {
      const month = new Date(today.getFullYear(), today.getMonth() - i, 1)
      labels.push({ key: `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`, label: formatMonthLabel(month), date: month })
    }
    return labels
  }

  return labels
}

const pieChartColors = ['#ef4444', '#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899']

function EstadisticasPage({ user }) {
  const [loading, setLoading] = useState(true)
  const [citas, setCitas] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [period, setPeriod] = useState('diario')
  const [selectedUserId, setSelectedUserId] = useState('')
  const [useDateRange, setUseDateRange] = useState(false)
  const [dateStart, setDateStart] = useState('')
  const [dateEnd, setDateEnd] = useState('')
  const chartRef = useRef(null)
  const chartRefPrecios = useRef(null)
  const chartInstanceRef = useRef(null)
  const chartInstanceRefPrecios = useRef(null)
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
      const [usuariosResponse, citasResponse] = await Promise.all([
        fetch(`${apiUrl}usuarios/`, { credentials: 'include' }),
        fetch(`${apiUrl}citas/`, { credentials: 'include' }),
      ])

      if (usuariosResponse.ok) {
        const usuariosData = await usuariosResponse.json()
        setUsuarios(usuariosData.usuarios || [])
        if (user?.rol === 'Empleado') {
          setSelectedUserId(user.id)
        }
      }

      if (citasResponse.ok) {
        const citasData = await citasResponse.json()
        setCitas(citasData.citas || [])
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

  const filteredCitas = useMemo(() => {
    return citas.filter((cita) => {
      if (selectedUserId && Number(cita.empleado_id) !== Number(selectedUserId)) {
        return false
      }

      if (useDateRange && (dateStart || dateEnd)) {
        const citaDate = new Date(cita.fecha_hora)
        if (dateStart) {
          const startDate = parseLocalDate(dateStart)
          if (citaDate < startDate) {
            return false
          }
        }
        if (dateEnd) {
          const endDate = parseLocalDate(dateEnd)
          endDate.setHours(23, 59, 59, 999)
          if (citaDate > endDate) {
            return false
          }
        }
      }

      return true
    })
  }, [citas, selectedUserId, useDateRange, dateStart, dateEnd])

  const labels = useMemo(() => buildLabels(period), [period])

  const chartData = useMemo(() => {
    const grouped = labels.reduce((acc, item) => {
      acc[item.key] = { ...item, completadas: 0, canceladas: 0 }
      return acc
    }, {})

    filteredCitas.forEach((cita) => {
      const fecha = new Date(cita.fecha_hora)
      const key = getGroupKey(fecha, period)
      if (!grouped[key]) return
      if (cita.estado === 'completada') {
        grouped[key].completadas += 1
      } else if (cita.estado === 'cancelada') {
        grouped[key].canceladas += 1
      }
    })

    // Si no hay datos reales, mostrar datos de ejemplo para demostración
    const hasRealData = Object.values(grouped).some(item => item.completadas > 0 || item.canceladas > 0)
      if (!hasRealData) {
        // Datos de ejemplo para mostrar la gráfica
        const exampleData = [
          { key: labels[0]?.key, completadas: 5, canceladas: 2 },
          { key: labels[1]?.key, completadas: 8, canceladas: 1 },
          { key: labels[2]?.key, completadas: 3, canceladas: 4 },
          { key: labels[3]?.key, completadas: 7, canceladas: 0 },
          { key: labels[4]?.key, completadas: 4, canceladas: 3 },
          { key: labels[5]?.key, completadas: 6, canceladas: 1 },
          { key: labels[6]?.key, completadas: 2, canceladas: 2 },
        ]
        
        exampleData.forEach((item, index) => {
          if (grouped[item.key]) {
            grouped[item.key].completadas = item.completadas
            grouped[item.key].canceladas = item.canceladas
          }
        })
      }

      return Object.values(grouped)
  }, [filteredCitas, labels, period])

  const chartDataPrecios = useMemo(() => {
    const grouped = {}
    const visibleKeys = labels.map((item) => item.key)

    filteredCitas.forEach((cita) => {
      if (cita.estado !== 'completada') return
      const fecha = new Date(cita.fecha_hora)
      const key = getGroupKey(fecha, period)
      if (!visibleKeys.includes(key)) return

      const servicio = cita.servicio || 'Sin servicio'
      const precio = Number(cita.precio_final || 0)
      grouped[servicio] = (grouped[servicio] || 0) + precio
    })

    return Object.entries(grouped).map(([label, value], index) => ({
      label,
      value,
      backgroundColor: pieChartColors[index % pieChartColors.length],
    }))
  }, [filteredCitas, labels, period])

  useEffect(() => {
    if (!chartRef.current || typeof window.Chart !== 'function') {
      return
    }

    const labels = chartData.map((item) => item.label)
    const completadas = chartData.map((item) => item.completadas)
    const canceladas = chartData.map((item) => item.canceladas)

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy()
    }

    chartInstanceRef.current = new window.Chart(chartRef.current, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Completadas',
            data: completadas,
            backgroundColor: '#22c55e',
            borderRadius: 10,
            barThickness: 24,
          },
          {
            label: 'Canceladas',
            data: canceladas,
            backgroundColor: '#ef4444',
            borderRadius: 10,
            barThickness: 24,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#475569' },
          },
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0,
              stepSize: 1,
              color: '#475569',
            },
            grid: {
              color: 'rgba(148, 163, 184, 0.18)',
            },
          },
        },
      },
    })

    return () => {
      chartInstanceRef.current?.destroy()
      chartInstanceRef.current = null
    }
  }, [chartData])

  const totalCompletadas = chartData.reduce((sum, item) => sum + item.completadas, 0)
  const totalCanceladas = chartData.reduce((sum, item) => sum + item.canceladas, 0)

  useEffect(() => {
    if (!chartRefPrecios.current || typeof window.Chart !== 'function') return

    if (chartInstanceRefPrecios.current) {
      chartInstanceRefPrecios.current.destroy()
    }

    const labelsPie = chartDataPrecios.map((item) => item.label)
    const dataPie = chartDataPrecios.map((item) => item.value)
    const backgroundColorPie = chartDataPrecios.map((item) => item.backgroundColor)

    chartInstanceRefPrecios.current = new window.Chart(chartRefPrecios.current, {
      type: 'pie',
      data: {
        labels: labelsPie,
        datasets: [
          {
            data: dataPie,
            backgroundColor: backgroundColorPie,
            borderWidth: 2,
            borderColor: '#0f172a',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (tooltipItem) => {
                const label = tooltipItem.label || ''
                const value = tooltipItem.parsed || 0
                return `${label}: $${value.toFixed(2)}`
              },
            },
          },
        },
      },
    })

    return () => {
      chartInstanceRefPrecios.current?.destroy()
      chartInstanceRefPrecios.current = null
    }
  }, [chartDataPrecios])
  

  if (loading) {
    return <div className="loading">Cargando Estadísticas...</div>
  }

  return (
    <section className="min-h-screen rounded-2xl border dark:border-slate-800 dark:bg-gray-800 p-6">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">
            Estadísticas
          </h1>
        </div>
      </div>

      <div className='rounded-3xl bg-white border dark:border-slate-800 dark:bg-[#111827] p-5 shadow-2xl '>
        <div className="flex flex-col lg:flex-row lg:items-end gap-5">
          <div className="flex-1">
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

          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Periodo
            </label>

            <select
              value={period}
              onChange={(event) => setPeriod(event.target.value)}
              className="w-full h-12 rounded-2xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
            >
              {periodOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-4">
          <label className="inline-flex items-center gap-3 text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={useDateRange}
              onChange={(event) => setUseDateRange(event.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Filtrar por rango de fechas max 1 semana
          </label>

          <div className="grid gap-5 lg:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Fecha inicio
            </label>
            <input
              type="date"
              value={dateStart}
              onChange={(event) => setDateStart(event.target.value)}
              disabled={!useDateRange}
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
              disabled={!useDateRange}
              className="w-full h-12 rounded-2xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>
        </div>
        </div><br/>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* LEFT */}
        <div className="space-y-6">

  

          {/* CHART */}
          <section className="rounded-3xl border bg-white dark:border-slate-800 dark:bg-[#111827] p-5 shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              
              <div className="rounded-2xl border bg-white dark:border-slate-800 dark:bg-slate-900 p-4">
                <span className="text-sm  text-slate-700 dark:text-slate-400">
                  Total completadas
                </span>

                <strong className="block mt-2 text-3xl font-bold text-green-400">
                  {totalCompletadas}
                </strong>
              </div>

              <div className="rounded-2xl border bg-white dark:border-slate-800 dark:bg-slate-900 p-4">
                <span className="text-sm text-slate-700 dark:text-slate-400">
                  Total canceladas
                </span>

                <strong className="block mt-2 text-3xl font-bold text-red-400">
                  {totalCanceladas}
                </strong>
              </div>

              <div className="rounded-2xl border bg-white dark:border-slate-800 dark:bg-slate-900 p-4">
                <span className="text-sm text-slate-700 dark:text-slate-400">
                  Periodo
                </span>

                <strong className="block mt-2 text-lg font-semibold text-slate-700 dark:text-white">
                  {periodOptions.find((opt) => opt.value === period)?.label}
                </strong>
              </div>

            </div> <br />
            
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-900 dark:text-slate-500 font-semibold">
                  Reportes
                </p>

                <h2 className="text-xl font-bold text-slate-500 dark:text-white">
                  Rendimiento de Citas
                </h2>
              </div>

              <div className="flex items-center gap-5 text-sm">
                
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <span className="w-3 h-3 rounded-full bg-green-400" />
                  Completadas
                </div>

                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <span className="w-3 h-3 rounded-full bg-red-400" />
                  Canceladas
                </div>
              </div>
            </div>

            {chartData.every((item) => item.completadas === 0 && item.canceladas === 0) ? (
              <div className="flex items-center justify-center h-[320px] rounded-2xl border border-dashed border-gray-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 text-gray-500 dark:text-slate-500 text-center px-6">
                No hay datos de citas completadas o canceladas para este periodo.
              </div>
            ) : (
              <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
                <div className="chart-container h-[320px]">
                  <canvas ref={chartRef} />
                </div>
              </div>
            )}

            {filteredCitas.length === 0 && (
              <div className="mt-4 text-center text-sm text-slate-500">
                Mostrando datos de ejemplo para demostración
              </div>
            )}
          </section>
        </div>

        {/* RIGHT */}
        <div className="rounded-3xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 shadow-2xl min-h-[300px]">
          <div className="mb-6">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500 font-semibold">
              Información
            </p>

            <h2 className="text-2xl font-bold text-white">
              Resumen General
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              Periodo: {periodOptions.find((opt) => opt.value === period)?.label}
            </p>
          </div>

          {chartDataPrecios.length === 0 ? (
            <div className="flex items-center justify-center h-[300px] rounded-2xl border border-dashed border-slate-700 bg-slate-900 text-slate-500">
              No hay datos de precios para mostrar.
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center justify-center h-[300px] rounded-2xl border border-dashed border-slate-700 bg-slate-900 text-slate-500">
                <div className="w-full h-full p-4">
                  <div className="chart-container h-full">
                    <canvas ref={chartRefPrecios} />
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-3">
                {chartDataPrecios.map((item) => (
                  <div key={item.label} className="flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-800 p-3 text-sm text-slate-200">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.backgroundColor }} />
                    <span>{item.label}</span>
                    <span className="ml-auto font-semibold text-white">${item.value.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </>
          )}

        </div>
      </div>
    </section>
  )
}

export default EstadisticasPage


