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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>

        <div className="modal-header">
          <h2>Agendar Cita</h2>
          <div className="cita-info">
            <p><strong>Servicio:</strong> {servicio.nombre}</p>
            <p><strong>Empleado:</strong> {empleado.name}</p>
            <p><strong>Precio:</strong> ${formatPrice(servicio.precio)}</p>
            <p><strong>Duración:</strong> {servicio.tiempo} minutos</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="cita-form">
          <div className="form-section">
            <h3>Datos del Cliente</h3>

            <div className="form-group">
              <label>Nombre completo:</label>
              <input
                type="text"
                value={formData.cliente_name}
                onChange={e => setFormData({...formData, cliente_name: e.target.value})}
                placeholder="Ingresa tu nombre completo"
                required
              />
              {errors.cliente_name && <span className="error-text">{errors.cliente_name}</span>}
            </div>

            <div className="form-group">
              <label>Celular/WhatsApp:</label>
              <input
                type="tel"
                value={formData.cliente_celular}
                onChange={e => setFormData({...formData, cliente_celular: e.target.value})}
                placeholder="Ingresa tu número de celular"
                required
              />
              {errors.cliente_celular && <span className="error-text">{errors.cliente_celular}</span>}
            </div>
          </div>

          <div className="form-section">
            <h3>Fecha y Hora</h3>

            <div className="form-row">
              <div className="form-group">
                <label>Fecha:</label>
                <input
                  type="date"
                  value={formData.fecha}
                  onChange={e => setFormData({...formData, fecha: e.target.value})}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
                {errors.fecha && <span className="error-text">{errors.fecha}</span>}
              </div>

              <div className="form-group">
                <label>Hora de inicio:</label>
                <input
                  type="time"
                  value={formData.hora}
                  onChange={e => setFormData({...formData, hora: e.target.value})}
                  required
                />
                {errors.hora && <span className="error-text">{errors.hora}</span>}
              </div>

              <div className="form-group">
                <label>Hora de fin:</label>
                <input
                  type="time"
                  value={horaFin}
                  readOnly
                  className="readonly-input"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Tipo de Servicio</h3>

            <div className="form-group">
              <label>¿Dónde quieres el servicio?</label>
              <select
                value={formData.tipo_servicio}
                onChange={e => {
                  const selected = e.target.value
                  if (selected === 'domicilio' && !servicioPermiteDomicilio) {
                    setFormData(prev => ({
                      ...prev,
                      tipo_servicio: 'local',
                      cobertura_id: '',
                      direccion: '',
                    }))
                    setErrors(prev => ({ ...prev, tipo_servicio: 'Este servicio no está disponible a domicilio' }))
                  } else {
                    setFormData(prev => ({
                      ...prev,
                      tipo_servicio: selected,
                      cobertura_id: selected === 'domicilio' ? prev.cobertura_id : '',
                      direccion: selected === 'domicilio' ? prev.direccion : '',
                    }))
                    setErrors(prev => ({ ...prev, tipo_servicio: undefined }))
                  }
                }}
                required
              >
                <option value="local">En el local</option>
                <option value="domicilio" disabled={!servicioPermiteDomicilio}>
                  A domicilio{!servicioPermiteDomicilio ? ' (no disponible para este servicio)' : ''}
                </option>
                <option value="virtual">Virtual</option>
              </select>
              {errors.tipo_servicio && <span className="error-text">{errors.tipo_servicio}</span>}
            </div>

            {formData.tipo_servicio === 'domicilio' && (
              <>
                <div className="form-group">
                  <label>Zona de cobertura:</label>
                  <select
                    value={formData.cobertura_id}
                    onChange={e => setFormData({...formData, cobertura_id: e.target.value})}
                    required
                  >
                    <option value="">Seleccionar zona</option>
                    {coberturas.map(cobertura => (
                      <option key={cobertura.id} value={cobertura.id}>
                        {cobertura.barrio} - +${formatPrice(cobertura.costo_extra)} ({cobertura.tiempo_estimado} min adicionales)
                      </option>
                    ))}
                  </select>
                  {errors.cobertura_id && <span className="error-text">{errors.cobertura_id}</span>}
                </div>

                <div className="form-group">
                  <label>Dirección completa:</label>
                  <input
                    type="text"
                    value={formData.direccion}
                    onChange={e => setFormData({...formData, direccion: e.target.value})}
                    placeholder="Ingresa la dirección exacta del servicio"
                    required
                  />
                  {errors.direccion && <span className="error-text">{errors.direccion}</span>}
                </div>
              </>
            )}
          </div>

          <div className="form-section">
            <h3>Notas adicionales (opcional)</h3>
            <div className="form-group">
              <textarea
                value={formData.notas}
                onChange={e => setFormData({...formData, notas: e.target.value})}
                placeholder="Alguna petición especial o información adicional..."
                rows="3"
              />
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={creating}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={creating}
            >
              {creating ? 'Agendando...' : 'Agendar Cita'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CitaFormModal