import { useEffect } from 'react'
import { useDashboardStore } from '@/store/dashboardStore'
import { useNotificationStore } from '@/store/notificationStore'
import { useIncidentStore } from '@/store/incidentStore'

// Interval (ms) between background refreshes. Well under the PRD's 5-minute
// latency target so dashboards reflect the live feed within seconds. Override
// at build time with VITE_POLL_INTERVAL_MS.
const POLL_INTERVAL_MS = Number(import.meta.env.VITE_POLL_INTERVAL_MS) || 8000

// Keeps the "live" data (dashboards, bell notifications, incident list) in sync
// with the backend feed by re-fetching on an interval. Mounted once from
// AppLayout. Uses each store's silent mode so refreshes don't flash loading
// skeletons or spam error toasts. Also refreshes when the tab regains focus.
export function useRealtimePolling() {
  useEffect(() => {
    const refresh = () => {
      useDashboardStore.getState().fetchDashboard({ silent: true })
      useNotificationStore.getState().fetchNotifications({ silent: true })
      useIncidentStore.getState().fetchIncidents({ silent: true })
    }

    const id = window.setInterval(refresh, POLL_INTERVAL_MS)
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh()
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])
}
