import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Navbar } from './Navbar'
import { Toaster } from '@/components/Toaster'
import { useRealtimePolling } from '@/hooks/useRealtimePolling'
import { useDashboardStore } from '@/store/dashboardStore'
import { useNotificationStore } from '@/store/notificationStore'
import { useIncidentStore } from '@/store/incidentStore'

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  useRealtimePolling()

  // Initial load of the data every role's shell needs. Runs here (post-auth)
  // rather than at store-module load, so requests carry the Bearer token and
  // never fire on the unauthenticated login page.
  useEffect(() => {
    useDashboardStore.getState().fetchDashboard()
    useNotificationStore.getState().fetchNotifications()
    useIncidentStore.getState().fetchIncidents()
  }, [])

  return (
    <div className="flex min-h-screen bg-surface-void">
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <div className="flex-1 min-w-0 flex flex-col">
        <Navbar onMobileMenuOpen={() => setMobileOpen(true)} />
        <main className="flex-1 p-5 sm:p-8 max-w-[1600px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
      <Toaster />
    </div>
  )
}
