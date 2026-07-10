import {
  LayoutDashboard, Wallet, FileText, UserCog,
  Radio, Flame, ShieldAlert, CalendarClock, ClipboardList,
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
    // Every report the Admin/EO and Security Team submit lands here.
    { to: '/reports', label: 'Reports', icon: FileText },
    { to: '/user-management', label: 'User Management', icon: UserCog },
  ],
  admin: [
    { to: '/dashboard/admin', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/concert-schedule', label: 'Concert Schedule', icon: CalendarClock },
    // Replaces the old Vendor Management and Reports & Ticket Sales pages —
    // all reporting input (finance, tickets, vendors, sponsors, …) lives here.
    { to: '/report-management', label: 'Report Management', icon: ClipboardList },
  ],
  security: [
    { to: '/dashboard/security', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/live-monitoring', label: 'Live Monitoring', icon: Radio },
    // Crowd Monitoring hosts the safety-resource + statistics report panels;
    // Incident Center hosts the incident-report panel.
    { to: '/crowd-monitoring', label: 'Crowd Monitoring', icon: Flame },
    { to: '/incident-center', label: 'Incident Center', icon: ShieldAlert },
  ],
}
