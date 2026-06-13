import { useNavigate } from 'react-router-dom'

function HomePage() {
  const navigate = useNavigate()

  return (
    <div className="public-app">
      <header className="bg-white rounded-2xl shadow-sm px-4 py-3 mb-4 border border-gray-100">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Kelzo</h1>
            <p className="text-sm text-gray-500">
              Reserva tu cita en el negocio de tu preferencia
            </p>
          </div>
          <button onClick={() => navigate('/negocios')} 
            className="bg-gray-100 hover:bg-gray-200 transition px-3 py-2 rounded-xl text-sm font-medium text-gray-700"
          > Ver Negocios
          </button>

        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-10 space-y-16">
        {/* HERO / INFO */}
        <section className="text-center space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            ¿Qué es Kelzo?
          </h2>

          <p className="text-gray-600 text-base md:text-lg max-w-3xl mx-auto leading-relaxed">
            Kelzo es una plataforma de reservas de citas en línea que conecta a personas con negocios y servicios de su ciudad.
            Permite agendar citas de forma rápida, sencilla y sin llamadas, ayudando a los negocios a organizar su agenda y a los clientes a encontrar disponibilidad en segundos.
          </p>
        </section>

        {/* FEATURES */}
        <section className="space-y-6">
          <h3 className="text-2xl font-bold text-center text-gray-900">
            Características principales
          </h3>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            {[
              ["🔍", "Encuentra negocios", "Busca y filtra por ciudad y barrio"],
              ["📅", "Agenda citas", "Selecciona servicio y empleado"],
              ["⏰", "Fácil y rápido", "Reserva en minutos sin complicaciones"],
              ["💼", "Profesionales", "Conecta con expertos certificados"],
            ].map((item, i) => (
              <div
                key={i}
                className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition"
              >
                <div className="text-2xl mb-2">{item[0]}</div>
                <h4 className="font-semibold text-gray-900 mb-1">
                  {item[1]}
                </h4>
                <p className="text-sm text-gray-600">
                  {item[2]}
                </p>
              </div>
            ))}

          </div>
        </section>

        {/* PLANS */}
        <section className="space-y-10">

          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">
              Nuestros Planes
            </h2>
            <p className="text-gray-600 mt-2">
              Elige el plan ideal para impulsar tu negocio
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 justify-center">

            {/* BASIC */}
            <div className="border border-gray-200 rounded-2xl p-6 bg-white shadow-sm hover:shadow-md transition">

              <h3 className="text-xl font-bold text-blue-600 text-center">
                Básico
              </h3>

              <p className="text-center text-2xl font-bold mt-2">
                $25.000 <span className="text-sm text-gray-500">/mes</span>
              </p>

              <p className="text-center text-gray-600 mt-2 mb-4">
                Ideal para negocios pequeños
              </p>

              <ul className="space-y-2 text-sm text-gray-700">
                <li>✅ Hasta 1000 citas mensuales</li>
                <li>✅ Hasta 20 servicios</li>
                <li>✅ 6 usuarios</li>
                <li>✅ 1 sucursal</li>
                <li>✅ Agenda integrada</li>
                <li>✅ Página de reservas</li>
                <li>✅ Gestión de clientes</li>
                <li>✅ Soporte estándar</li>
              </ul>

            </div>

            {/* PREMIUM */}
            <div className="border-2 border-black rounded-2xl p-6 bg-white shadow-lg hover:shadow-xl transition">

              <h3 className="text-xl font-bold text-black text-center">
                Premium
              </h3>

              <p className="text-center text-2xl font-bold mt-2">
                $50.000 <span className="text-sm text-gray-500">/mes</span>
              </p>

              <p className="text-center text-gray-600 mt-2 mb-4">
                Para negocios en crecimiento
              </p>

              <ul className="space-y-2 text-sm text-gray-700">
                <li>🚀 Citas ilimitadas</li>
                <li>🚀 Hasta 50 servicios</li>
                <li>🚀 15 usuarios</li>
                <li>🚀 3 sucursales</li>
                <li>🚀 Agenda completa</li>
                <li>🚀 Reservas online</li>
                <li>🚀 Clientes ilimitados</li>
                <li>🚀 Estadísticas</li>
                <li>🚀 Soporte prioritario</li>
              </ul>

            </div>

          </div>
        </section>

        {/* CTA */}
        <section className="text-center bg-black text-white rounded-2xl p-10 space-y-6">

          <h3 className="text-2xl md:text-3xl font-bold">
            ¿Tienes un negocio?
          </h3>

          <p className="text-gray-300 max-w-2xl mx-auto">
            Empieza a recibir reservas en línea, organiza tu agenda y automatiza tus citas con Kelzo.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-3">

            <a
              href="https://www.instagram.com/kelzo_app/"
              target="_blank"
              className="bg-white text-black px-5 py-2 rounded-full font-medium hover:bg-gray-200 transition"
            >
              📷 Instagram
            </a>

            {/* <a
              href="https://wa.me/573123456789"
              target="_blank"
              className="bg-green-500 text-white px-5 py-2 rounded-full font-medium hover:bg-green-600 transition"
            >
              📞 WhatsApp
            </a> */}

          </div>

        </section>

      </div>
    </div>
  )
}

export default HomePage
