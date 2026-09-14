'use client'

import { useState, useEffect } from 'react'
import { employeeApi, employeeDocumentApi } from '@/lib/api'
import DashboardLayout from '@/components/DashboardLayout'
import { toast } from 'react-hot-toast'

export default function MisDocumentosPage() {
  const [employeeId, setEmployeeId] = useState(null)
  const [documents, setDocuments] = useState([])
  const [allowedTypes, setAllowedTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [tipoDocumento, setTipoDocumento] = useState('')
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    init()
  }, [])

  const init = async () => {
    try {
      setLoading(true)
      const [meRes, typesRes] = await Promise.all([
        employeeApi.getCurrent(),
        employeeDocumentApi.getAllowedTypes()
      ])
      const id = meRes.data.employee.id
      setEmployeeId(id)
      setAllowedTypes(typesRes.data.allowedTypes || [])
      await loadDocuments(id)
    } catch (err) {
      console.error(err)
      setError('No se pudo cargar tu expediente. Contacta a RH si el problema continúa.')
    } finally {
      setLoading(false)
    }
  }

  const loadDocuments = async (id) => {
    const res = await employeeDocumentApi.getAll(id)
    setDocuments(res.data.documents || [])
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!tipoDocumento || !file) {
      toast.error('Selecciona el tipo de documento y un archivo')
      return
    }
    try {
      setUploading(true)
      const formData = new FormData()
      formData.append('tipo_documento', tipoDocumento)
      formData.append('document', file)
      await employeeDocumentApi.create(employeeId, formData)
      toast.success('Documento subido exitosamente')
      setTipoDocumento('')
      setFile(null)
      e.target.reset()
      await loadDocuments(employeeId)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al subir el documento')
    } finally {
      setUploading(false)
    }
  }

  const handleDownload = async (documentId, fileName) => {
    try {
      const response = await employeeDocumentApi.download(documentId)
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', fileName)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err) {
      toast.error('Error al descargar el documento')
    }
  }

  if (loading) return <DashboardLayout><div className="p-6 text-center">Cargando...</div></DashboardLayout>
  if (error) return <DashboardLayout><div className="p-6 text-red-600">{error}</div></DashboardLayout>

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Mis Documentos</h1>
          <p className="text-gray-600">Consulta y sube tus propios documentos (identificación, comprobante de domicilio, etc.)</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Subir nuevo documento</h2>
          <form onSubmit={handleUpload} className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de documento</label>
              <select
                value={tipoDocumento}
                onChange={(e) => setTipoDocumento(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Selecciona un tipo...</option>
                {allowedTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">Archivo</label>
              <input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                required
              />
            </div>
            <button
              type="submit"
              disabled={uploading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium disabled:opacity-50 whitespace-nowrap"
            >
              {uploading ? 'Subiendo...' : 'Subir documento'}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Documentos guardados</h2>
          </div>
          {documents.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Aún no has subido ningún documento.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Archivo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acción</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {documents.map(doc => (
                    <tr key={doc.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{doc.tipo_documento}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{doc.nombre_archivo}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(doc.uploaded_at || doc.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => handleDownload(doc.id, doc.nombre_archivo)}
                          className="text-blue-600 hover:underline text-sm font-medium"
                        >
                          Descargar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
