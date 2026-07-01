import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore, ROLE_TO_DASHBOARD } from '@/store/authStore'
import { NAV_BY_ROLE } from '@/layouts/navConfig'

export function ProtectedRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  return <Outlet />
}

// Guards a page against being visited by a role it isn't assigned to,
// even via direct URL — menus are hidden, but routes are enforced too.
export function RoleRoute() {
  const user = useAuthStore((s) => s.user)
  const location = useLocation()
  if (!user) return <Navigate to="/login" replace />

  const allowedPaths = NAV_BY_ROLE[user.role].map((item) => item.to)
  const isAllowed = allowedPaths.includes(location.pathname)
  if (!isAllowed) {
    return <Navigate to={ROLE_TO_DASHBOARD[user.role]} replace />
  }
  return <Outlet />
}
