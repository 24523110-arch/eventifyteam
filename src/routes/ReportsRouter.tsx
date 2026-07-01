import { Navigate } from 'react-router-dom'
import { useAuthStore, ROLE_TO_DASHBOARD } from '@/store/authStore'
import { ManagerReports } from '@/modules/reports/ManagerReports'
import { AdminReports } from '@/modules/reports/AdminReports'

export function ReportsRouter() {
  const user = useAuthStore((s) => s.user)

  if (user?.role === 'manager') return <ManagerReports />
  if (user?.role === 'admin') return <AdminReports />

  // Security has no Reports entry in its nav. Direct navigation here
  // redirects to their own dashboard rather than login, since they're
  // still authenticated — this just isn't a page their role can see.
  if (user) return <Navigate to={ROLE_TO_DASHBOARD[user.role]} replace />

  return <Navigate to="/login" replace />
}
