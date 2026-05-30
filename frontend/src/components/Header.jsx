import { Menu, X, Bell, Sun, Moon } from 'lucide-react'
import NotificationsMenu from './NotificationsMenu'
import { useState, useEffect } from 'react'
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/'



export default function Header({ setSidebarOpen, handleLogout, user}) {

   const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);


  return (
    <header className="sticky top-0 z-30 border-b dark:border-gray-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl transition-colors">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">

        <button
          className="lg:hidden text-white"
          onClick={() => setSidebarOpen(true)}
        > <Menu size={24} />
        </button>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {user.name}
          </h2>
        </div>

        <div className="flex items-center gap-4">
          
           <button onClick={() => setDarkMode(!darkMode)}
              className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-100
              dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 transition-colors"
            >
            {!darkMode ? (
              <Sun className="w-5 h-5 text-gray-400 hover:text-yellow-400 transition-colors"/>
            ) : (
              <Moon className="w-5 h-5 text-gray-500 hover:text-gray-800 transition-colors"/>
            )}
          </button>
          {/* <NotificationsMenu /> */}
          <button onClick={handleLogout} className="
              flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white transition-allhover:bg-red-600"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </header>
  );
}