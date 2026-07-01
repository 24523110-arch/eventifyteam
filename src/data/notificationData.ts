import type { NotificationItem, ActivityFeedItem } from '@/types'

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  { id: 'al1', category: 'security', priority: 'critical', title: 'Crowd surge — Main Stage', message: 'Density exceeded 95% capacity near front barrier', time: '20:09', read: false },
  { id: 'al2', category: 'security', priority: 'high', title: 'Gate B queue critical', message: 'Queue length 740, waiting time 19 min', time: '20:05', read: false },
  { id: 'al3', category: 'finance', priority: 'medium', title: 'Revenue milestone', message: 'Ticket revenue passed Rp 80M', time: '20:01', read: true },
  { id: 'al4', category: 'vendor', priority: 'low', title: 'Vendor check-in complete', message: 'Sari Roti Catering marked Active', time: '19:54', read: true },
  { id: 'al5', category: 'system', priority: 'medium', title: 'Backup server activated', message: 'Primary API latency spike triggered failover', time: '19:40', read: true },
]

export const ACTIVITY_FEED: ActivityFeedItem[] = [
  { id: 'a1', time: '20:14:02', message: 'Gate B queue exceeded threshold (7,600 / 8,000)', type: 'security' },
  { id: 'a2', time: '20:11:45', message: 'Sponsor booth recorded 1,204 visitors', type: 'finance' },
  { id: 'a3', time: '20:08:19', message: 'Security team Alpha resolved Incident #INC-0042', type: 'security' },
  { id: 'a4', time: '20:05:51', message: 'Vendor "Sari Roti Catering" marked Active', type: 'vendor' },
  { id: 'a5', time: '20:01:37', message: 'Revenue milestone reached: Rp 80M', type: 'finance' },
  { id: 'a6', time: '19:58:02', message: 'System backup server health check passed', type: 'system' },
]
