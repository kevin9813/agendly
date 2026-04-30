import { useNavigate } from 'react-router-dom'

function HomePage() {
  const navigate = useNavigate()

  return (
    <div className="public-app">
      <header className="public-header">
        <h1>Agendly</h1>
        <p>Reserva tu cita en el negocio de tu preferencia</p>
        <button 
          className="ver-negocios-btn"
          onClick={() => navigate('/negocios')}
        >
          Ver Negocios
        </button>
      </header>

      <div className="home-content">
        <section className="info-section">
          <h2>¿Qué es Agendly?</h2>
          <p>
            Agendly es una plataforma de reservas de citas en línea que conecta a personas con negocios y servicios de su ciudad.
            Permite agendar citas de forma rápida, sencilla y sin llamadas, ayudando a los negocios a organizar su agenda y a los clientes a encontrar disponibilidad en segundos.
          </p>
        </section>

        <section className="features-section">
          <h3>Características principales</h3>
          <div className="features-grid">
            <div className="feature-card">
              <h4>🔍 Encuentra negocios</h4>
              <p>Busca y filtra negocios por ciudad y barrio</p>
            </div>
            <div className="feature-card">
              <h4>📅 Agenda citas</h4>
              <p>Selecciona el servicio y empleado que necesitas</p>
            </div>
            <div className="feature-card">
              <h4>⏰ Fácil y rápido</h4>
              <p>Reserva tu cita en minutos sin complicaciones</p>
            </div>
            <div className="feature-card">
              <h4>💼 Profesionales</h4>
              <p>Conecta con profesionales certificados</p>
            </div>
          </div>
        </section>

        <section className="py-5 bg-light">
        <div className="container">
        <div className="text-center mb-5">
        <h2 className="fw-bold display-5">Nuestros Planes</h2>
        <p className="text-muted fs-5">
        Elige el plan ideal para impulsar tu negocio
        </p>
        </div>

        <div className="row g-4 justify-content-center">

        {/* Plan Básico */}
        <div className="col-md-6 col-lg-5">
        <div className="card h-100 shadow border-0 rounded-4">
          <div className="card-body p-4">
            <div className="text-center mb-4">
              <h3 className="fw-bold text-primary">Básico</h3>
              <h2 className="fw-bold">
                $24.900
                <span className="fs-6 text-muted">/mes</span>
              </h2>
              <p className="text-muted">
                Ideal para negocios pequeños o independientes.
              </p>
              <br />
            </div>

            <ul className="list-group list-group-flush mb-4">
              <li className="list-group-item">✅ Hasta 100 citas mensuales</li>
              <li className="list-group-item">✅ Hasta 10 servicios disponibles</li>
              <li className="list-group-item">✅ Hasta 3 usuarios registrados</li>
              <li className="list-group-item">✅ 1 sucursal incluida</li>
              <li className="list-group-item">✅ Agenda y calendario integrados</li>
              <li className="list-group-item">✅ Página pública para reservas online</li>
              <li className="list-group-item">✅ Gestión completa de clientes</li>
              <li className="list-group-item">✅ Soporte estándar</li>
            </ul>
          </div>
        </div>
        </div>

        {/* Plan Premium */}
        <div className="col-md-6 col-lg-5">
        <div className="card h-100 shadow-lg border-0 rounded-4">
          
          <div className="card-body p-4">
            <div className="text-center mb-4 mt-3">
              <h3 className="fw-bold text-primary">Premium</h3>
              <h2 className="fw-bold">
                $49.900
                <span className="fs-6 text-muted">/mes</span>
              </h2>
              <p className="text-muted">
                Perfecto para negocios en crecimiento que buscan automatización.
              </p>
            </div>

            <ul className="list-group list-group-flush mb-4">
              <li className="list-group-item">🚀 Citas mensuales ilimitadas</li>
              <li className="list-group-item">🚀 Hasta 50 servicios disponibles</li>
              <li className="list-group-item">🚀 Hasta 15 usuarios registrados</li>
              <li className="list-group-item">🚀 Hasta 3 sucursales incluidas</li>
              <li className="list-group-item">🚀 Agenda y calendario integrados</li>
              <li className="list-group-item">🚀 Página pública para reservas online</li>
              <li className="list-group-item">🚀 Gestión completa de clientes</li>
              <li className="list-group-item">🚀 Estadísticas y reportes</li>
              <li className="list-group-item">🚀 Soporte prioritario</li>
            </ul>
          </div>
        </div>
        </div>

        </div>
        </div>
        </section>
    

        <section className="cta-section">
          <h3>¿Tienes un negocio?</h3>
          <p>
            Empieza a recibir reservas en línea, organiza tu agenda y deja de perder clientes.
            Con Agendly puedes automatizar tus citas y hacer crecer tu negocio.
          </p>
            <div className="d-flex flex-column flex-md-row justify-content-center gap-3">
              <a href="https://www.instagram.com/agendly_app/" target="_blank" rel="noopener noreferrer"
                className="btn btn-light btn-lg rounded-pill px-4 shadow-sm"
              > 📷 @agendly_app </a>

              <a href="https://wa.me/573123456789" target="_blank" rel="noopener noreferrer"
                className="btn btn-success btn-lg rounded-pill px-4 shadow-sm"
              > 📞 WhatsApp </a>
            </div>
        </section>
      </div>
    </div>
  )
}

export default HomePage
