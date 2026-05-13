import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/'

// Función para formatear precios con puntos de miles
const formatPrice = (price) => {
  return parseFloat(price).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

function CitaFormModal({ servicio, empleado, negocio, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    cliente_name: '',
    cliente_celular: '',
    fecha: '',
    hora: '09:00',
    tipo_servicio: 'local',
    cobertura_id: '',
    direccion: '',
    notas: '',
  })
  const servicioPermiteDomicilio = !!servicio.permite_domicilio

  const [horaFin, setHoraFin] = useState('')
  const [coberturas, setCoberturas] = useState([])
  const [creating, setCreating] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    // Calcular hora fin cuando cambien fecha u hora
    if (formData.hora) {
      const [horas, minutos] = formData.hora.split(':').map(Number)
      const inicio = new Date(2024, 0, 1, horas, minutos)
      const fin = new Date(inicio.getTime() + servicio.tiempo * 60000)
      const horaFinStr = String(fin.getHours()).padStart(2, '0') + ':' + String(fin.getMinutes()).padStart(2, '0')
      setHoraFin(horaFinStr)
    }

    // Cargar coberturas si es necesario
    if (formData.tipo_servicio === 'domicilio') {
      loadCoberturas()
    }
  }, [formData.hora, formData.tipo_servicio, servicio.tiempo])

  const loadCoberturas = async () => {
    try {
      const response = await fetch(`${apiUrl}coberturas/?negocio_id=${negocio.id}`)
      const data = await response.json()
      setCoberturas(data.coberturas || [])
    } catch (error) {
      console.error('Error loading coberturas:', error)
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.cliente_name.trim()) {
      newErrors.cliente_name = 'El nombre del cliente es requerido'
    }

    if (!formData.cliente_celular.trim()) {
      newErrors.cliente_celular = 'El celular es requerido'
    }

    if (!formData.fecha) {
      newErrors.fecha = 'La fecha es requerida'
    } else {
      const today = new Date().toISOString().split('T')[0]
      if (formData.fecha < today) {
        newErrors.fecha = 'No se puede agendar citas en fechas anteriores a hoy'
      }
    }

    if (!formData.hora) {
      newErrors.hora = 'La hora es requerida'
    }

    if (formData.tipo_servicio === 'domicilio') {
      if (!servicioPermiteDomicilio) {
        newErrors.tipo_servicio = 'Este servicio no está disponible a domicilio'
      }
      if (!formData.cobertura_id) {
        newErrors.cobertura_id = 'La cobertura es requerida para citas a domicilio'
      }
      if (!formData.direccion.trim()) {
        newErrors.direccion = 'La dirección es requerida para citas a domicilio'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setCreating(true)

    try {
      // Primero crear o buscar el cliente
      let clienteId = null

      // Buscar cliente existente por celular si está disponible
      if (formData.cliente_celular.trim()) {
        const clientesResponse = await fetch(`${apiUrl}clientes/?celular=${formData.cliente_celular}&negocio_id=${negocio.id}`)
        const clientesData = await clientesResponse.json()
        const clienteExistente = clientesData.clientes?.find(c => c.celular === formData.cliente_celular)

        if (clienteExistente) {
          clienteId = clienteExistente.id
        }
      }

      // Si no existe, crear nuevo cliente
      if (!clienteId) {
        const clienteResponse = await fetch(`${apiUrl}clientes/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.cliente_name,
            celular: formData.cliente_celular,
            negocio_id: negocio.id,
          }),
        })

        if (!clienteResponse.ok) {
          throw new Error('Error al crear cliente')
        }

        const clienteData = await clienteResponse.json()
        clienteId = clienteData.cliente.id
      }

      // Crear la cita
      const fechaHora = `${formData.fecha}T${formData.hora}:00`
      const citaResponse = await fetch(`${apiUrl}citas/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente_id: clienteId,
          empleado_id: empleado.id,
          servicio_id: servicio.id,
          fecha_hora: fechaHora,
          estado: 'pendiente', // La cita queda pendiente para que el negocio la confirme
          tipo_servicio: formData.tipo_servicio,
          cobertura_id: formData.cobertura_id ? parseInt(formData.cobertura_id) : null,
          direccion: formData.direccion,
          notas: formData.notas,
        }),
      })

      if (citaResponse.ok) {
        const citaData = await citaResponse.json()
        alert('¡Cita agendada correctamente! El negocio revisará y confirmará tu cita pronto.')
        onSuccess()
        onClose()
      } else {
        const errorData = await citaResponse.json()
        if (errorData.detail && errorData.detail.includes('solapamiento')) {
          alert('Error: El empleado ya tiene una cita programada en este horario. Por favor selecciona otro horario.')
        } else {
          alert(`Error: ${errorData.detail || 'Error al crear la cita'}`)
        }
      }
    } catch (error) {
      console.error('Error creating cita:', error)
      alert('Error al agendar la cita. Por favor intenta nuevamente.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      
      <div
        className="bg-white w-full max-w-2xl rounded-2xl shadow-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >

        {/* HEADER */}
        <div className="sticky top-0 bg-white border-b px-5 py-4 flex justify-between items-center rounded-t-2xl">
          <h2 className="text-lg font-bold text-gray-900">
            Agendar Cita
          </h2>

          <button
            onClick={onClose}
            className="text-gray-500 hover:text-black text-2xl"
          >
            ×
          </button>
        </div>

        {/* INFO SERVICIO */}
        <div className="px-5 pt-4">
          <div className="bg-gray-50 rounded-xl p-3 text-sm space-y-1">
            <p><b>Servicio:</b> {servicio.nombre}</p>
            <p><b>Empleado:</b> {empleado.name}</p>
            <p><b>Precio:</b> ${formatPrice(servicio.precio)}</p>
            <p><b>Duración:</b> {servicio.tiempo} min</p>
          </div>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="p-5 space-y-6">

          {/* CLIENTE */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">
              Datos del Cliente
            </h3>

            <div className="space-y-3">

              <input
                type="text"
                value={formData.cliente_name}
                onChange={e => setFormData({...formData, cliente_name: e.target.value})}
                placeholder="Nombre completo"
                className="w-full border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-black"
              />
              {errors.cliente_name && (
                <p className="text-red-500 text-sm">{errors.cliente_name}</p>
              )}

              <input
                type="tel"
                value={formData.cliente_celular}
                onChange={e => setFormData({...formData, cliente_celular: e.target.value})}
                placeholder="Celular / WhatsApp"
                className="w-full border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-black"
              />
              {errors.cliente_celular && (
                <p className="text-red-500 text-sm">{errors.cliente_celular}</p>
              )}

            </div>
          </div>

          {/* FECHA Y HORA */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">
              Fecha y Hora
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

              <input
                type="date"
                value={formData.fecha}
                onChange={e => setFormData({...formData, fecha: e.target.value})}
                min={new Date().toISOString().split('T')[0]}
                className="border rounded-xl px-3 py-2"
              />

              <input
                type="time"
                value={formData.hora}
                onChange={e => setFormData({...formData, hora: e.target.value})}
                className="border rounded-xl px-3 py-2"
              />

              <input
                type="time"
                value={horaFin}
                readOnly
                className="border rounded-xl px-3 py-2 bg-gray-100"
              />

            </div>
          </div>

          {/* SERVICIO */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">
              Tipo de Servicio
            </h3>

            <select
              value={formData.tipo_servicio}
              onChange={e => {
                const selected = e.target.value;

                if (selected === 'domicilio' && !servicioPermiteDomicilio) {
                  setFormData(prev => ({
                    ...prev,
                    tipo_servicio: 'local',
                    cobertura_id: '',
                    direccion: '',
                  }));
                  return;
                }

                setFormData(prev => ({
                  ...prev,
                  tipo_servicio: selected,
                }));
              }}
              className="w-full border rounded-xl px-3 py-2"
            >
              <option value="local">En el local</option>
              <option value="domicilio" disabled={!servicioPermiteDomicilio}>
                A domicilio
              </option>
            </select>

            {formData.tipo_servicio === 'domicilio' && (
              <div className="mt-3 space-y-3">

                <select
                  value={formData.cobertura_id}
                  onChange={e => setFormData({...formData, cobertura_id: e.target.value})}
                  className="w-full border rounded-xl px-3 py-2"
                >
                  <option value="">Seleccionar zona</option>
                  {coberturas.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.barrio} +${formatPrice(c.costo_extra)}
                    </option>
                  ))}
                </select>

                <input
                  type="text"
                  value={formData.direccion}
                  onChange={e => setFormData({...formData, direccion: e.target.value})}
                  placeholder="Dirección completa"
                  className="w-full border rounded-xl px-3 py-2"
                />

              </div>
            )}
          </div>

          {/* NOTAS */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">
              Notas (opcional)
            </h3>

            <textarea
              value={formData.notas}
              onChange={e => setFormData({...formData, notas: e.target.value})}
              rows="3"
              className="w-full border rounded-xl px-3 py-2"
            />
          </div>

          {/* BOTONES */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={creating}
              className="flex-1 bg-gray-200 hover:bg-gray-300 rounded-xl py-2"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={creating}
              className="flex-1 bg-black text-white rounded-xl py-2 hover:bg-gray-800"
            >
              {creating ? 'Agendando...' : 'Agendar'}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}

export default CitaFormModal