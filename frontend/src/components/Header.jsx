// components/Header.jsx
import { Menu, X, Bell } from 'lucide-react'
import NotificationsMenu from './NotificationsMenu'

import { useState } from 'react'
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/'



export default function Header({ setSidebarOpen, handleLogout, user}) {


  return (
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-900/95 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">

        <button
          className="lg:hidden"
          onClick={() => setSidebarOpen(true)}
        > <Menu size={24} />
        </button>

        <div>
          <h2 className="text-lg font-semibold text-white">
            {user.name}
          </h2>
        </div>

        <div className="flex items-center gap-4">
          <NotificationsMenu />
          <button onClick={handleLogout} className="
              flex items-center gap-2 rounded-xl
              bg-red-500 px-4 py-2 text-sm font-medium text-white
              transition-allhover:bg-red-600"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </header>
  );
}