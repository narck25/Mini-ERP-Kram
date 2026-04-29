'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import DashboardPageContent from './page'

export default function DashboardWrapper() {
  return (
    <ProtectedRoute requireAuth={true} redirectTo="/login">
      <DashboardPageContent />
    </ProtectedRoute>
  )
}