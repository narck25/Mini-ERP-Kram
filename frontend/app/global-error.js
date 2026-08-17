'use client'

import ErrorPage from '@/components/ErrorPage'

export default function GlobalError({ error, reset }) {
  return (
    <html lang="es">
      <body className="bg-stone-100">
        <ErrorPage
          icon="⚠️"
          title="Error crítico"
          message="Ocurrió un error grave en la aplicación."
        >
          <button
            onClick={reset}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
          >
            Reintentar
          </button>
        </ErrorPage>
      </body>
    </html>
  )
}
