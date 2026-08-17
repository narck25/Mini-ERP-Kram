import ErrorPage from '@/components/ErrorPage'

export default function NotFound() {
  return (
    <ErrorPage
      code="404"
      title="Página no encontrada"
      message="La página que buscas no existe o fue movida."
    />
  )
}
