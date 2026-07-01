// Core domain types for Eventify — simplified to 3-role scope (Manager, Admin/EO, Security)

export type UserRole = 'manager' | 'admin' | 'security'

export interface AppUser {
  id: string
  name: string
  email: string
  role: UserRole
  avatarInitials: string
  lastLogin: string
  status: 'active' | 'disabled'
}

export interface RoleOption {
  value: UserRole
  label: string
  description: string
}

export type VendorStatus =
  | 'not_arrived'
  | 'check_in'
  | 'setup'
  | 'ready'
  | 'active'
  | 'completed'

export interface Vendor {
  id: string
  name: string
  category: string
  arrivalTime: string
  status: VendorStatus
  assignedArea: string
  contact: string
}

export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical'
export type IncidentStatus =
  | 'new'
  | 'assigned'
  | 'in_progress'
  | 'escalated'
  | 'resolved'
  | 'closed'

export interface Incident {
  id: string
  area: string
  severity: IncidentSeverity
  assignedTeam: string
  status: IncidentStatus
  createdAt: string
  description: string
}

export interface CrowdZone {
  id: string
  name: string
  capacity: number
  current: number
  status: 'safe' | 'busy' | 'critical'
}

export interface RevenuePoint {
  time: string
  revenue: number
  ticketsSold: number
}

export interface FinanceBreakdownItem {
  category: string
  amount: number
}

export type NotificationCategory = 'security' | 'finance' | 'vendor' | 'ticket' | 'system'
export type NotificationPriority = 'critical' | 'high' | 'medium' | 'low'

export interface NotificationItem {
  id: string
  category: NotificationCategory
  priority: NotificationPriority
  title: string
  message: string
  time: string
  read: boolean
}

export interface ActivityFeedItem {
  id: string
  time: string
  message: string
  type: NotificationCategory
}

export interface KpiCardData {
  id: string
  label: string
  value: string
  delta: string
  trend: 'up' | 'down' | 'flat'
  icon: string
}

export interface TicketSummary {
  sold: number
  revenue: number
  refunds: number
  remaining: number
}

export interface ConcertInfo {
  name: string
  venue: string
  date: string
  status: string
  currentPerformer: string
  capacity: number
  attendance: number
}

export interface FinanceSummary {
  revenue: number
  expenses: number
  profit: number
  margin: number
}

// AI Report generation (Manager only)
export interface ReportGenerationInput {
  ticketSummary: TicketSummary
  attendance: number
  financeSummary: FinanceSummary
  financeBreakdown: FinanceBreakdownItem[]
  concertInfo: ConcertInfo
}

export interface ReportGenerationResult {
  generatedAt: string
  insight: string
  pdfBase64: string
}
