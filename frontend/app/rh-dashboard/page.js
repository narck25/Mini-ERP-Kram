'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';

export default function RHDashboardPage() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user && user.accessibleModules?.includes('EMPLEADOS')) {
      router.replace('/rh/dashboard-completo');
    }
  }, [user, router]);

  if (!user || !user.accessibleModules?.includes('EMPLEADOS')) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h2 className="text-red-800 font-semibold">Acceso denegado</h2>
            <p className="text-red-600 mt-1">No tienes acceso al módulo de Empleados.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Redirigiendo al dashboard completo de RH...</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
