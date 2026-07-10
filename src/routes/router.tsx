import { createBrowserRouter, Navigate } from 'react-router-dom'
import { LoginPage } from '@/auth/login/LoginPage'
import { AppLayout } from '@/layouts/AppLayout'
import { ProtectedRoute, RoleRoute } from './ProtectedRoute'
import { ReportsRouter } from './ReportsRouter'
import { useAuthStore, ROLE_TO_DASHBOARD } from '@/store/authStore'

import { ManagerDashboard } from '@/dashboard/manager/ManagerDashboard'
import { FinanceDashboard } from '@/dashboard/manager/FinanceDashboard'
import { AdminDashboard } from '@/dashboard/admin/AdminDashboard'
import { SecurityDashboard } from '@/dashboard/security/SecurityDashboard'

import { ReportManagement } from '@/modules/report-management/ReportManagement'
import { ConcertSchedule } from '@/modules/concert-schedule/ConcertSchedule'
import { LiveMonitoring } from '@/modules/live-monitoring/LiveMonitoring'
import { CrowdMonitoring } from '@/modules/crowd-monitoring/CrowdMonitoring'
import { IncidentCenter } from '@/modules/incident-center/IncidentCenter'
import { UserManagement } from '@/modules/user-management/UserManagement'

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/login" replace /> },
  { path: '/login', element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            element: <RoleRoute />,
            children: [
              // Manager
              { path: '/dashboard/manager', element: <ManagerDashboard /> },
              { path: '/finance', element: <FinanceDashboard /> },
              { path: '/user-management', element: <UserManagement /> },

              // Admin / Event Organizer — Report Management replaces the old
              // Vendor Management and Reports & Ticket Sales pages: every
              // report (finance, tickets, vendors, sponsors, …) is entered
              // there as sections of the active concert's report.
              { path: '/dashboard/admin', element: <AdminDashboard /> },
              { path: '/concert-schedule', element: <ConcertSchedule /> },
              { path: '/report-management', element: <ReportManagement /> },

              // Security
              { path: '/dashboard/security', element: <SecurityDashboard /> },
              { path: '/live-monitoring', element: <LiveMonitoring /> },
              { path: '/crowd-monitoring', element: <CrowdMonitoring /> },
              { path: '/incident-center', element: <IncidentCenter /> },

              // Reports (Manager): review dashboard for everything the other
              // roles submit. ReportsRouter redirects admins to their own
              // Report Management page.
              { path: '/reports', element: <ReportsRouter /> },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <CatchAll /> },
])

// Unknown URLs: send authenticated users to their dashboard, others to login.
function CatchAll() {
  const user = useAuthStore((s) => s.user)
  if (user) return <Navigate to={ROLE_TO_DASHBOARD[user.role]} replace />
  return <Navigate to="/login" replace />
}
