'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

export default function LoginPage() {
  const { login } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (data) => {
    setIsLoading(true)
    const result = await login(data.email, data.password)
    setIsLoading(false)
    
    if (!result.success) {
      // El error ya se muestra en el toast desde el contexto
      return
    }
  }

  const handleDemoLogin = (role) => {
    const demoUsers = {
      admin: { email: 'admin@kram.com', password: 'password123' },
      rh: { email: 'rh@kram.com', password: 'password123' },
      sistemas: { email: 'sistemas@kram.com', password: 'password123' },
      compras: { email: 'compras@kram.com', password: 'password123' },
    }
    
    const user = demoUsers[role]
    if (user) {
      login(user.email, user.password)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-[#0d1b2a] to-slate-900 relative overflow-hidden">
      {/* Blobs de fondo para profundidad */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-400/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute top-3/4 left-1/3 w-64 h-64 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Logo en esquina superior izquierda */}
      <div className="absolute top-6 left-6 z-10">
        <div className="relative">
          <Image 
            src="/Kram-logo-web.png" 
            width={120} 
            height={48} 
            alt="KRAM Logo" 
            className="drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]"
          />
          <div className="absolute inset-0 bg-white/5 blur-lg rounded-full -z-10"></div>
        </div>
      </div>

      {/* Contenedor principal */}
      <div className="container mx-auto px-4 py-16 min-h-screen flex items-center justify-center">
        <div className="w-full max-w-md">
          {/* Título */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              Iniciar Sesión
            </h1>
            <p className="text-slate-400">
              Accede a tu cuenta del ERP KRAM
            </p>
          </div>

          {/* Formulario de login */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                    Email
                  </label>
                  <input
                    {...register('email')}
                    id="email"
                    type="email"
                    autoComplete="email"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-300"
                    placeholder="email@ejemplo.com"
                  />
                  {errors.email && (
                    <p className="mt-2 text-sm text-red-400">{errors.email.message}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                    Contraseña
                  </label>
                  <input
                    {...register('password')}
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-300"
                    placeholder="••••••••"
                  />
                  {errors.password && (
                    <p className="mt-2 text-sm text-red-400">{errors.password.message}</p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(45,212,191,0.4)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </button>
            </form>

            {/* Enlace a registro */}
            <div className="mt-6 text-center">
              <p className="text-slate-400 text-sm">
                ¿No tienes una cuenta?{' '}
                <Link href="/register" className="font-medium text-teal-400 hover:text-teal-300 transition-colors">
                  Crear cuenta
                </Link>
              </p>
            </div>

            {/* Separador */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white/5 text-slate-400">Usuarios de prueba</span>
              </div>
            </div>

            {/* Botones de usuarios demo */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleDemoLogin('admin')}
                className="py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-300 hover:text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_10px_rgba(255,255,255,0.1)]"
              >
                <span className="font-medium">Admin</span>
              </button>
              <button
                onClick={() => handleDemoLogin('rh')}
                className="py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-300 hover:text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_10px_rgba(255,255,255,0.1)]"
              >
                <span className="font-medium">RH</span>
              </button>
              <button
                onClick={() => handleDemoLogin('sistemas')}
                className="py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-300 hover:text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_10px_rgba(255,255,255,0.1)]"
              >
                <span className="font-medium">Sistemas</span>
              </button>
              <button
                onClick={() => handleDemoLogin('compras')}
                className="py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-300 hover:text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_10px_rgba(255,255,255,0.1)]"
              >
                <span className="font-medium">Compras</span>
              </button>
            </div>

            {/* Enlace de regreso */}
            <div className="mt-8 text-center">
              <Link 
                href="/" 
                className="inline-flex items-center text-slate-400 hover:text-white transition-colors group"
              >
                <svg className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                </svg>
                Volver al inicio
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}