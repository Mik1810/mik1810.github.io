import AdminTable from './AdminTable'
import AdminHome from './AdminHome'
import AdminLogin from './AdminLogin'
import RequireAdmin from './RequireAdmin'

type AdminAppMode = 'login' | 'home' | 'tables'

interface AdminAppProps {
  mode: AdminAppMode
}

function AdminApp({ mode }: AdminAppProps) {
  if (mode === 'login') {
    return <AdminLogin />
  }

  return (
    <RequireAdmin fallback={mode === 'home' ? <AdminHome forceSkeleton /> : undefined}>
      {mode === 'home' ? <AdminHome /> : <AdminTable />}
    </RequireAdmin>
  )
}

export default AdminApp
