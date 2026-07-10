import { Navigate } from 'react-router-dom'
import { useAuthStore, ROLE_TO_DASHBOARD } from '@/store/authStore'
import { ManagerReports } from '@/modules/reports/ManagerReports'

// /reports is Manager-only now: every report the Admin/EO and Security Team
// submit (via Report Management and the Crowd Monitoring / Incident Center
// panels) lands here for review, AI generation, approval, and export. The
// Admin/EO's old "Reports & Ticket Sales" page was replaced by Report
// Management (/report-management).
export function ReportsRouter() {
  const user = useAuthStore((s) => s.user)

  if (user?.role === 'manager') return <ManagerReports />
  if (user?.role === 'admin') return <Navigate to="/report-management" replace />
  if (user) return <Navigate to={ROLE_TO_DASHBOARD[user.role]} replace />

  return <Navigate to="/login" replace />
}
