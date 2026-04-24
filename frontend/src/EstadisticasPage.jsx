import { useEffect, useState } from 'react'

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/'

function EstadisticasPage({ user }) { 
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadCitas()
    }, [])

    const loadCitas = async () => {
        setLoading(false)
    }

    if (loading) {
        return <div className="loading">Cargando Estadisticas...</div>
    }
    return (
       

        <div className="estadisticas-page">
            <div className="dashboard-topbar">
                <h1>Estadísticas</h1>
                <p>Bienvenido, {user.nombre}!</p>
            </div>
        </div>
    )
}

export default EstadisticasPage