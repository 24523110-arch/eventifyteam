import type { CrowdZone, Incident } from '@/types'

export const CROWD_ZONES: CrowdZone[] = [
  { id: 'z1', name: 'Main Stage', capacity: 30000, current: 27600, status: 'busy' },
  { id: 'z2', name: 'VIP', capacity: 4000, current: 3850, status: 'busy' },
  { id: 'z3', name: 'Gate A', capacity: 8000, current: 4200, status: 'safe' },
  { id: 'z4', name: 'Gate B', capacity: 8000, current: 7600, status: 'critical' },
  { id: 'z5', name: 'Food Court', capacity: 6000, current: 2900, status: 'safe' },
  { id: 'z6', name: 'Parking', capacity: 12000, current: 5400, status: 'safe' },
]

export const INITIAL_INCIDENTS: Incident[] = [
  { id: 'INC-0042', area: 'Gate B', severity: 'high', assignedTeam: 'Security Alpha', status: 'resolved', createdAt: '19:48', description: 'Overcrowding near barrier line 3' },
  { id: 'INC-0043', area: 'Food Court', severity: 'low', assignedTeam: 'Security Bravo', status: 'closed', createdAt: '19:55', description: 'Minor altercation between vendors' },
  { id: 'INC-0044', area: 'VIP', severity: 'medium', assignedTeam: 'Security Charlie', status: 'in_progress', createdAt: '20:02', description: 'Unauthorized access attempt at VIP entrance' },
  { id: 'INC-0045', area: 'Main Stage', severity: 'critical', assignedTeam: 'Security Alpha', status: 'escalated', createdAt: '20:09', description: 'Crowd surge detected near front barrier' },
  { id: 'INC-0046', area: 'Parking', severity: 'low', assignedTeam: 'Unassigned', status: 'new', createdAt: '20:13', description: 'Reported vehicle blocking emergency lane' },
]

export const SECURITY_TEAMS = ['Security Alpha', 'Security Bravo', 'Security Charlie', 'Security Delta', 'Unassigned']

export const DENSITY_TREND = [
  { time: '14:00', density: 38 },
  { time: '15:00', density: 52 },
  { time: '16:00', density: 64 },
  { time: '17:00', density: 71 },
  { time: '18:00', density: 78 },
  { time: '19:00', density: 83 },
  { time: '20:00', density: 80 },
]
