import { Routes, Route } from 'react-router-dom'
import HomePage from './HomePage'
import NegociosPage from './NegociosPage'
import NegocioDetailPage from './NegocioDetailPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/negocios" element={<NegociosPage />} />
      <Route path="/negocio/:negocioId/:nombreNegocio" element={<NegocioDetailPage />} />
    </Routes>
  )
}

export default App