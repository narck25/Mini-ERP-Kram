'use client';

import { useState, useEffect } from 'react';
import { systemApi } from '@/lib/api';
import { getRoleName, getRoleColor, getRoleIcon } from '@/lib/rolesConfig';

const COLOR_OPTIONS = [
  { value: 'bg-gray-100 text-gray-800', label: 'Gris' },
  { value: 'bg-blue-100 text-blue-800', label: 'Azul' },
  { value: 'bg-green-100 text-green-800', label: 'Verde' },
  { value: 'bg-yellow-100 text-yellow-800', label: 'Amarillo' },
  { value: 'bg-red-100 text-red-800', label: 'Rojo' },
  { value: 'bg-purple-100 text-purple-800', label: 'Púrpura' },
  { value: 'bg-pink-100 text-pink-800', label: 'Rosa' },
  { value: 'bg-indigo-100 text-indigo-800', label: 'Índigo' },
  { value: 'bg-teal-100 text-teal-800', label: 'Teal' },
  { value: 'bg-orange-100 text-orange-800', label: 'Naranja' },
];

const ICON_OPTIONS = ['👤', '👑', '👥', '💻', '🛒', '🏭', '⭐', '🎯', '🔧', '📋', '📊', '🔬', '🎨', '📦', '🚚', '⚙️'];

export default function RoleManager({ onRolesChange }) {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', color: 'bg-gray-100 text-gray-800', icon: '👤' });
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await systemApi.getRoles();
      const rolesData = response.data.roles || [];
      setRoles(rolesData);
      if (onRolesChange) onRolesChange(rolesData);
    } catch (err) {
      console.error('Error fetching roles:', err);
      setError('Error al cargar roles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRoles(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      setMessage(null);
      const response = await systemApi.createRole(formData);
      setMessage(response.data.message || 'Rol creado exitosamente');
      setShowForm(false);
      setFormData({ name: '', description: '', color: 'bg-gray-100 text-gray-800', icon: '👤' });
      fetchRoles();
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear rol');
    }
  };

  const handleDelete = async (roleId) => {
    if (!window.confirm(`¿Estás seguro de eliminar el rol "${getRoleName(roleId)}"?\nLos usuarios con este rol serán reasignados a "Empleado".`)) {
      return;
    }
    try {
      setError(null);
      setMessage(null);
      const response = await systemApi.deleteRole(roleId);
      setMessage(response.data.message || 'Rol eliminado');
      fetchRoles();
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al eliminar rol');
    }
  };

  const systemRoles = roles.filter(r => !r.isCustom);
  const customRoles = roles.filter(r => r.isCustom);

  return (
    <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Administración de Roles</h2>
            <p className="text-sm text-gray-500 mt-1">
              Crea, edita y elimina roles personalizados del sistema
            </p>
          </div>
          <button
            onClick={() => { setShowForm(!showForm); }}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            {showForm ? 'Cancelar' : '+ Nuevo Rol'}
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>
        )}
        {message && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">{message}</div>
        )}

        {showForm && (
          <form onSubmit={handleCreate} className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Crear nuevo rol personalizado</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nombre del rol *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: VENTAS, MARKETING, LOGISTICA"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">Se convertirá a mayúsculas automáticamente</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Descripción</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descripción del rol"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Color</label>
                <select
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {COLOR_OPTIONS.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Ícono</label>
                <div className="flex flex-wrap gap-2">
                  {ICON_OPTIONS.map(icon => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setFormData({ ...formData, icon })}
                      className={`w-8 h-8 flex items-center justify-center text-lg rounded border ${
                        formData.icon === icon ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
              >
                Crear Rol
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <p className="text-sm text-gray-500 mt-2">Cargando roles...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Roles del Sistema ({systemRoles.length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {systemRoles.map(role => (
                  <div key={role.id} className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <span className="text-lg mr-2">{role.icon || getRoleIcon(role.id)}</span>
                    <div className="flex-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${role.color || getRoleColor(role.id)}`}>
                        {role.name || getRoleName(role.id)}
                      </span>
                      <p className="text-xs text-gray-500 mt-0.5">{role.description}</p>
                    </div>
                    <span className="text-xs text-gray-400 italic">Sistema</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Roles Personalizados ({customRoles.length})
              </h4>
              {customRoles.length === 0 ? (
                <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  <p className="text-sm text-gray-500">No hay roles personalizados aún.</p>
                  <p className="text-xs text-gray-400 mt-1">Crea tu primer rol haciendo clic en "+ Nuevo Rol"</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {customRoles.map(role => (
                    <div key={role.id} className="flex items-center p-3 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow">
                      <span className="text-lg mr-2">{role.icon || '👤'}</span>
                      <div className="flex-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${role.color || 'bg-gray-100 text-gray-800'}`}>
                          {role.name}
                        </span>
                        <p className="text-xs text-gray-500 mt-0.5">{role.description || 'Sin descripción'}</p>
                      </div>
                      <button
                        onClick={() => handleDelete(role.id)}
                        className="ml-2 p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Eliminar rol"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
