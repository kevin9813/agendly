// components/Sidebar.jsx

export default function Sidebar({ sidebarOpen, setSidebarOpen }) {
  return (
    <>
      {/* Backdrop mobile */}
      <div
        className={`fixed inset-0 bg-black/30 z-40 lg:hidden transition-opacity ${
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside
        className={`
          fixed lg:static z-50
          left-0 top-0 h-screen w-64
          bg-slate-900 text-white
          transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >
        <div className="p-5 border-b border-slate-800">
          <h1 className="text-2xl font-bold">
            Agendly
          </h1>
        </div>

        <nav className="p-4 space-y-2">
          <a
            href="#"
            className="block rounded-lg px-4 py-3 hover:bg-slate-800 transition"
          >
            Dashboard
          </a>

          <a
            href="#"
            className="block rounded-lg px-4 py-3 hover:bg-slate-800 transition"
          >
            Citas
          </a>

          <a
            href="#"
            className="block rounded-lg px-4 py-3 hover:bg-slate-800 transition"
          >
            Clientes
          </a>
        </nav>
      </aside>
    </>
  );
}