import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth'

export default async function HomePage() {
  const session = await getServerSession()
  
  // Si el usuario ya está autenticado, redirigir al dashboard
  if (session) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-[#0d1b2a] to-slate-900 relative overflow-hidden">
      {/* Blobs de fondo para profundidad */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-400/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute top-3/4 left-1/3 w-64 h-64 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Contenedor principal con grid */}
      <div className="container mx-auto px-4 py-16 min-h-screen flex items-center justify-center pb-32">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
          
          {/* Columna Izquierda - Módulos de Compras */}
          <div className="md:col-start-1 space-y-6">
            {/* Tarjeta 1: Mis Solicitudes */}
            <div 
              className="block bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 transition-all duration-300 hover:bg-white/10 hover:border-teal-400/50 hover:scale-105 hover:shadow-[0_0_30px_rgba(45,212,191,0.2)] group"
            >
              <div className="flex items-start space-x-4">
                <div className="text-3xl text-teal-400 group-hover:scale-110 transition-transform duration-300">
                  📋
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-1">Mis Solicitudes</h3>
                  <p className="text-slate-400 text-sm">Portal de solicitantes</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-slate-300 text-sm">Gestiona y da seguimiento a tus solicitudes de compra</p>
              </div>
            </div>

            {/* Tarjeta 2: Gestión de Compras */}
            <div 
              className="block bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 transition-all duration-300 hover:bg-white/10 hover:border-teal-400/50 hover:scale-105 hover:shadow-[0_0_30px_rgba(45,212,191,0.2)] group"
            >
              <div className="flex items-start space-x-4">
                <div className="text-3xl text-teal-400 group-hover:scale-110 transition-transform duration-300">
                  🛒
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-1">Gestión de Compras</h3>
                  <p className="text-slate-400 text-sm">Panel de administración y cotizaciones</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-slate-300 text-sm">Administra todas las solicitudes y cotizaciones del sistema</p>
              </div>
            </div>
          </div>

          {/* Columna Central - Logo KRAM */}
          <div className="md:col-start-2 flex flex-col items-center justify-center space-y-8">
            <div className="relative">
              {/* Logo KRAM con efectos */}
              <div className="relative">
                <Image 
                  src="/Kram-logo-web.png" 
                  width={300} 
                  height={120} 
                  alt="KRAM Logo" 
                  className="drop-shadow-[0_0_40px_rgba(255,255,255,0.4)]"
                />
                <div className="absolute inset-0 bg-white/15 blur-xl rounded-full -z-10"></div>
              </div>
              
              {/* Título */}
              <div className="text-center mt-8">
                <h1 className="text-4xl font-bold text-white mb-2">
                  Centro de Mando
                </h1>
                <p className="text-slate-400 text-lg">
                  ERP KRAM - Sistema de Gestión Empresarial
                </p>
              </div>

              {/* Botones de acceso */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                <Link 
                  href="/login" 
                  className="bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(45,212,191,0.4)] text-center"
                >
                  Iniciar Sesión
                </Link>
                <Link 
                  href="/register" 
                  className="bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-8 rounded-xl border border-white/20 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] text-center"
                >
                  Registrarse
                </Link>
              </div>
            </div>
          </div>

          {/* Columna Derecha - Módulos de Recursos Humanos */}
          <div className="md:col-start-3 space-y-6">
            {/* Tarjeta 3: Incidencias ZKTeco */}
            <div 
              className="block bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 transition-all duration-300 hover:bg-white/10 hover:border-teal-400/50 hover:scale-105 hover:shadow-[0_0_30px_rgba(45,212,191,0.2)] group"
            >
              <div className="flex items-start space-x-4">
                <div className="text-3xl text-teal-400 group-hover:scale-110 transition-transform duration-300">
                  ⏰
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-1">Incidencias</h3>
                  <p className="text-slate-400 text-sm">Control de asistencia y reportes</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-slate-300 text-sm">Monitorea y gestiona incidencias de asistencia</p>
              </div>
            </div>

            {/* Tarjeta 4: Reclutamiento */}
            <div 
              className="block bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 transition-all duration-300 hover:bg-white/10 hover:border-teal-400/50 hover:scale-105 hover:shadow-[0_0_30px_rgba(45,212,191,0.2)] group"
            >
              <div className="flex items-start space-x-4">
                <div className="text-3xl text-teal-400 group-hover:scale-110 transition-transform duration-300">
                  👥
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-1">Reclutamiento</h3>
                  <p className="text-slate-400 text-sm">Solicitud de nuevas vacantes</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-slate-300 text-sm">Gestiona el proceso de reclutamiento y selección</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Información de usuarios de prueba */}
      <div className="absolute bottom-4 left-0 right-0 text-center">
        <div className="inline-block bg-black/40 backdrop-blur-sm border border-white/10 rounded-2xl px-6 py-3 max-w-2xl mx-auto">
          <p className="text-slate-300 text-xs md:text-sm">
            Usuarios de prueba: admin@kram.com (password123), rh@kram.com (password123), 
            sistemas@kram.com (password123), compras@kram.com (password123)
          </p>
        </div>
      </div>
    </div>
  )
}