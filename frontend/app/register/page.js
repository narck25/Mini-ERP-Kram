'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/contexts/AuthContext'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

const registerSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
})

export default function RegisterPage() {
  const { register: registerUser } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (data) => {
    setIsLoading(true)
    
    // Remover confirmPassword antes de enviar
    const { confirmPassword, ...userData } = data
    
    const result = await registerUser(userData)
    setIsLoading(false)
    
    if (!result.success) {
      // El error ya se muestra en el toast desde el contexto
      return
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
              Crear Cuenta
            </h1>
            <p className="text-slate-400">
              Regístrate en el ERP KRAM
            </p>
          </div>

          {/* Formulario de registro */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
                    Nombre completo
                  </label>
                  <input
                    {...register('name')}
                    id="name"
                    type="text"
                    autoComplete="name"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-300"
                    placeholder="Juan Pérez"
                  />
                  {errors.name && (
                    <p className="mt-2 text-sm text-red-400">{errors.name.message}</p>
                  )}
                </div>
                
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
                    autoComplete="new-password"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-300"
                    placeholder="Mínimo 6 caracteres"
                  />
                  {errors.password && (
                    <p className="mt-2 text-sm text-red-400">{errors.password.message}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-2">
                    Confirmar Contraseña
                  </label>
                  <input
                    {...register('confirmPassword')}
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-300"
                    placeholder="Repite la contraseña"
                  />
                  {errors.confirmPassword && (
                    <p className="mt-2 text-sm text-red-400">{errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(45,212,191,0.4)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
              </button>
            </form>

            {/* Enlace a login */}
            <div className="mt-6 text-center">
              <p className="text-slate-400 text-sm">
                ¿Ya tienes una cuenta?{' '}
                <Link href="/login" className="font-medium text-teal-400 hover:text-teal-300 transition-colors">
                  Iniciar sesión
                </Link>
              </p>
            </div>

            {/* Información de usuarios de prueba */}
            <div className="mt-8 pt-8 border-t border-white/10">
              <div className="text-center">
                <p className="text-slate-400 text-sm mb-3">
                  ¿Quieres probar el sistema? Usa estos usuarios de prueba:
                </p>
                <div className="inline-block bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3">
                  <p className="text-slate-300 text-xs">
                    admin@kram.com (password123)<br />
                    rh@kram.com (password123)<br />
                    sistemas@kram.com (password123)<br />
                    compras@kram.com (password123)
                  </p>
                </div>
              </div>
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