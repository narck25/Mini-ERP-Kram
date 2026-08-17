import Link from 'next/link'

/**
 * Componente base para páginas de error (404, 403, 500).
 * Mantiene un estilo consistente con el dashboard (tema claro).
 */
export default function ErrorPage({ code, icon, title, message, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-100 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        {code ? (
          <div className="text-6xl font-bold text-blue-600 mb-3">{code}</div>
        ) : icon ? (
          <div className="text-5xl mb-3">{icon}</div>
        ) : null}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
        <p className="text-gray-600 mb-6">{message}</p>
        {children || (
          <Link href="/" className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium">
            Volver al inicio
          </Link>
        )}
      </div>
    </div>
  )
}
