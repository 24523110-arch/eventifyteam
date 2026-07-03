import {
  LayoutDashboard, Wallet, FileText, UserCog,
  Truck, Radio, Flame, ShieldAlert, CalendarClock,
} from 'lucide-react'
import type { UserRole } from '@/types'

export interface NavItem {
  to: string
  label: string
  icon: typeof LayoutDashboard
}

// Per-role menu — only items relevant to the role are shown (hidden, not just disabled)
export const NAV_BY_ROLE: Record<UserRole, NavItem[]> = {
  manager: [
    { to: '/dashboard/manager', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/finance', label: 'Finance', icon: Wallet },
    { to: '/reports', label: 'Reports', icon: FileText },
    { to: '/user-management', label: 'User Management', icon: UserCog },
  ],
  admin: [
    { to: '/dashboard/admin', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/concert-schedule', label: 'Concert Schedule', icon: CalendarClock },
    { to: '/vendor-management', label: 'Vendor Management', icon: Truck },
    // Reports + Ticket Sales merged into one feature.
    { to: '/reports', label: 'Reports & Ticket Sales', icon: FileText },
  ],
  security: [
    { to: '/dashboard/security', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/live-monitoring', label: 'Live Monitoring', icon: Radio },
    { to: '/crowd-monitoring', label: 'Crowd Monitoring', icon: Flame },
    { to: '/incident-center', label: 'Incident Center', icon: ShieldAlert },
  ],
}
