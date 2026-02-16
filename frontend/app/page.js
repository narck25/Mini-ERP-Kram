import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth'

export default async function HomePage() {
  const session = await getServerSession()
  
  // Si el usuario ya está autenticado, redirigir al dashboard
  if (session) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Bienvenido al <span className="text-primary-600">ERP KRAM</span>
          </h1>
          <p className="text-xl text-gray-600 mb-10">
            Sistema de gestión empresarial integral para optimizar todos los procesos de tu empresa
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="text-primary-600 text-3xl mb-4">📊</div>
              <h3 className="text-xl font-semibold mb-3">Gestión Completa</h3>
              <p className="text-gray-600">
                Controla inventarios, compras, ventas y recursos humanos en una sola plataforma
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="text-primary-600 text-3xl mb-4">🔐</div>
              <h3 className="text-xl font-semibold mb-3">Roles y Permisos</h3>
              <p className="text-gray-600">
                Sistema de autenticación con roles específicos (Admin, RH, Sistemas, Compras)
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="text-primary-600 text-3xl mb-4">🚀</div>
              <h3 className="text-xl font-semibold mb-3">Tecnología Moderna</h3>
              <p className="text-gray-600">
                Desarrollado con Next.js, Node.js, Prisma y PostgreSQL para máximo rendimiento
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/login" 
              className="btn-primary text-lg px-8 py-3 inline-block"
            >
              Iniciar Sesión
            </Link>
            <Link 
              href="/register" 
              className="btn-secondary text-lg px-8 py-3 inline-block"
            >
              Registrarse
            </Link>
          </div>
          
          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-gray-500">
              Usuarios de prueba disponibles: admin@kram.com (admin123), rh@kram.com (rh123), 
              sistemas@kram.com (sistemas123), compras@kram.com (compras123)
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}