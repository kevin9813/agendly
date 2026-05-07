import { Menu, X } from 'lucide-react'

export default function Sidebar({
  user,
  suscripcion,
  currentPage,
  setCurrentPage,
  sidebarOpen,
  setSidebarOpen
}) {

  const menuItems = [
    {
      key: 'dashboard',
      label: 'Inicio',
      roles: ['Admin', 'Empleado']
    },
    {
      key: 'agenda',
      label: 'Agenda',
      roles: ['Admin', 'Empleado']
    },
    {
      key: 'usuarios',
      label: 'Usuarios',
      roles: ['Admin']
    },
    {
      key: 'negocio',
      label: 'Negocio',
      roles: ['Admin']
    },
    {
      key: 'servicios',
      label: 'Servicios',
      roles: ['Admin']
    },
    {
      key: 'clientes',
      label: 'Clientes',
      roles: ['Admin', 'Empleado']
    },
    {
      key: 'estadisticas',
      label: 'Estadísticas',
      roles: ['Admin']
    }
  ]

  return (
    <>
      {/* MOBILE OVERLAY */}
      <div
        className={`
          fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity
          ${sidebarOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}
        `}
        onClick={() => setSidebarOpen(false)}
      />

      {/* SIDEBAR */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-72 bg-slate-900 border-r border-slate-800
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0
          h-[100dvh] bg-white dark:bg-gray-800
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >

        {/* HEADER */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center text-white font-bold">
              K
            </div>

            <div>
              <h1 className="text-white font-semibold">
                Kelzo
              </h1>

              <p className="text-xs text-slate-400">
                Dashboard
              </p>
            </div>
          </div>

          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-slate-400"
          >
            <X size={22} />
          </button>
        </div>

        {/* NAV */}
        <div className="p-4 overflow-y-auto h-[calc(100vh-64px)]">

          <p className="text-xs uppercase text-slate-500 font-semibold px-3 mb-3">
            Menú
          </p>

          <nav className="space-y-1">

            {suscripcion.estado !== 'vencida' &&
              menuItems.map((item) => {

                const canView =
                  item.roles.includes(user.rol === 'Empleado' ? 'Empleado' : 'Admin')

                if (!canView) return null

                return (

                  <button
                    key={item.key}
                    onClick={() => {
                      setCurrentPage(item.key)
                      setSidebarOpen(false)
                    }}
                    className={`
                      w-full flex items-center gap-3
                      px-4 py-3 rounded-xl
                      text-sm font-medium
                      transition-all duration-200
                      
                      ${
                        currentPage === item.key
                          ? 'bg-violet-500 text-white'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }
                    `}
                  >
                    <div className="w-2 h-2 rounded-full bg-current opacity-70" />

                    {item.label}
                  </button>
                )
              })}
          </nav>
        </div>
      </aside>
    </>
  )
}