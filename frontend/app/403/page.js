'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ErrorPage from '@/components/ErrorPage'

export default function ForbiddenPage() {
  const router = useRouter()

  return (
    <ErrorPage
      code="403"
      title="Acceso denegado"
      message="No tienes permisos para acceder a esta sección. Contacta a un administrador si necesitas acceso."
    >
      <div className="flex gap-3 justify-center">
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md font-medium"
        >
          Volver atrás
        </button>
        <Link href="/" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium">
          Volver al inicio
        </Link>
      </div>
    </ErrorPage>
  )
}
