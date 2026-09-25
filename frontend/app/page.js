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

      {/* Contenedor principal */}
      <div className="container mx-auto px-4 py-16 min-h-screen flex items-center justify-center">
        <div className="relative flex flex-col items-center">
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

          {/* Botón de acceso */}
          <div className="flex justify-center mt-8">
            <Link
              href="/login"
              className="bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(45,212,191,0.4)] text-center"
            >
              Iniciar Sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
