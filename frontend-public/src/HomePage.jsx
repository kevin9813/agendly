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

        <section className="features-section">
          <h3>Planes</h3>
          <div className="features-grid">
            <div className="feature-card">
              <h4>Basico</h4>
              <span className="price">$20.000/mes</span>
              <ul>
                <li>Hasta 100 citas al mes</li>
                <li>Hasta 10 Servicios</li>
                <li>Hasta 3 Usuarios</li>
                <li>Agenda y calendario</li>
                <li>Página pública para reservas</li>
                <li>Gestión de clientes</li>
                <li>Soporte estándar</li>
              </ul>
              <p>Ideal para negocios pequeños o independientes.</p>
            </div>
            <div className="feature-card">
              <h4>Premium</h4>
              <span className="price">$45.000/mes</span>
              <ul>
                <li>Citas ilimitadas</li>
                <li>Hasta 50 Servicios</li>
                <li>Hasta 15 Usuarios</li>
                <li>Agenda y calendario</li>
                <li>Página pública para reservas</li>
                <li>Gestión de clientes</li>
                <li>Estadísticas</li>
                <li>Prioridad en soporte</li>
              </ul>
              <p>Perfecto para negocios en crecimiento que buscan automatización.</p>
            </div>
          </div>
        </section>

    

        <section className="cta-section">
          <h3>¿Tienes un negocio?</h3>
          <p>
            Empieza a recibir reservas en línea, organiza tu agenda y deja de perder clientes.
            Con Agendly puedes automatizar tus citas y hacer crecer tu negocio.
          </p>

          <div className="cta-buttons">
            <a href="https://instagram.com/TU_USUARIO" target="_blank" className="cta-btn">
              📷 agendly_app
            </a>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            <a href="https://wa.me/573123456789" target="_blank" className="cta-btn">
              📞 +573123456789
            </a>
          </div>
        </section>
      </div>
    </div>
  )
}

export default HomePage
