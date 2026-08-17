'use client'

import Link from 'next/link'
import ErrorPage from '@/components/ErrorPage'

export default function Error({ error, reset }) {
  return (
    <ErrorPage
      icon="⚠️"
      title="Algo salió mal"
      message="Ocurrió un error inesperado. Intenta de nuevo."
    >
      <div className="flex gap-3 justify-center">
        <button
          onClick={reset}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
        >
          Reintentar
        </button>
        <Link href="/" className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md font-medium">
          Volver al inicio
        </Link>
      </div>
    </ErrorPage>
  )
}
