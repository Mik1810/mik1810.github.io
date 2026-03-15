import AdminDashboard from './AdminDashboard'
import AdminLogin from './AdminLogin'
import RequireAdmin from './RequireAdmin'

type AdminAppMode = 'login' | 'dashboard'

interface AdminAppProps {
  mode: AdminAppMode
}

function AdminApp({ mode }: AdminAppProps) {
  if (mode === 'login') {
    return <AdminLogin />
  }

  return (
    <RequireAdmin>
      <AdminDashboard />
    </RequireAdmin>
  )
}

export default AdminApp
