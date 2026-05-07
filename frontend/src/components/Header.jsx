// components/Header.jsx

export default function Header({ setSidebarOpen }) {
  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">

        <button
          className="lg:hidden"
          onClick={() => setSidebarOpen(true)}
        >
        </button>

        <div>
          <h2 className="text-lg font-semibold">
            Dashboard
          </h2>
        </div>

        <div className="flex items-center gap-4">
          <div className="h-9 w-9 rounded-full bg-gray-300" />
        </div>
      </div>
    </header>
  );
}