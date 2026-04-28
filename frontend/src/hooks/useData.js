import { useEffect, useState } from 'react'


const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/'


// Sucursales
export const useSucursales = (user) => {
  const [sucursales, setSucursales] = useState([])
  const [loadingSucursales, setLoadingSucursales] = useState(true)

 const loadSucursales = async () => {
    try {
      const response = await fetch(`${apiUrl}sucursales/?negocio_id=${user.negocio_id}`)
      const data = await response.json()
      setSucursales(data.sucursales || [])
    } catch (error) {
      console.error('Error loading sucursales:', error)
    }
  }
  useEffect(() => {
    loadSucursales()
  }, [user])

  return { sucursales, loadingSucursales, loadSucursales }
}
