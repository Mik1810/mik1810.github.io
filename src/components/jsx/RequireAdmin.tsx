import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

import { useAuth } from '../../context/useAuth'
import AdminTableSkeleton from './AdminTableSkeleton'

interface RequireAdminProps {
  children: ReactNode
  fallback?: ReactNode
}

function RequireAdmin({ children, fallback }: RequireAdminProps) {
  const { authLoading, authenticated } = useAuth()

  if (authLoading) {
    return <>{fallback || <AdminTableSkeleton />}</>
  }

  if (!authenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export default RequireAdmin
