import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 3000,
    allowedHosts: [
      'kelzo.local',
      'localhost',
      '.local'  // Permite todos los dominios .local
    ],
  },

  base: '/app/',
})
