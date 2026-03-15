import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

import { useAuth } from '../../context/useAuth'
import AdminDashboardSkeleton from './AdminDashboardSkeleton'

interface RequireAdminProps {
  children: ReactNode
}

function RequireAdmin({ children }: RequireAdminProps) {
  const { authLoading, authenticated } = useAuth()

  if (authLoading) {
    return <AdminDashboardSkeleton />
  }

  if (!authenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export default RequireAdmin
