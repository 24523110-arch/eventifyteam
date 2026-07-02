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

import { TicketSales } from '@/modules/ticket-sales/TicketSales'
import { VendorManagement } from '@/modules/vendor-management/VendorManagement'
import { ConcertSchedule } from '@/modules/concert-schedule/ConcertSchedule'
import { LiveMonitoring } from '@/modules/live-monitoring/LiveMonitoring'
import { CrowdMonitoring } from '@/modules/crowd-monitoring/CrowdMonitoring'
import { IncidentCenter } from '@/modules/incident-center/IncidentCenter'
import { UserManagement } from '@/modules/user-management/UserManagement'
import { SettingsPage } from '@/pages/settings/SettingsPage'

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

              // Admin / Event Organizer
              { path: '/dashboard/admin', element: <AdminDashboard /> },
              { path: '/concert-schedule', element: <ConcertSchedule /> },
              { path: '/ticket-sales', element: <TicketSales /> },
              { path: '/vendor-management', element: <VendorManagement /> },

              // Security
              { path: '/dashboard/security', element: <SecurityDashboard /> },
              { path: '/live-monitoring', element: <LiveMonitoring /> },
              { path: '/crowd-monitoring', element: <CrowdMonitoring /> },
              { path: '/incident-center', element: <IncidentCenter /> },

              // Reports has different content per role at the same URL —
              // ReportsRouter decides which page to render based on role.
              // It's guarded here like everything else since /reports is
              // present in both manager's and admin's NAV_BY_ROLE entries.
              { path: '/reports', element: <ReportsRouter /> },

              { path: '/settings', element: <SettingsPage /> },
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
