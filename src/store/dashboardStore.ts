import { create } from 'zustand'
import type {
  ConcertInfo,
  RevenuePoint,
  FinanceSummary,
  FinanceBreakdownItem,
  TicketSummary,
  CrowdZone,
  KpiCardData,
  Vendor,
  Incident,
  IncidentMetrics,
} from '@/types'
import { api, ApiError } from '@/services/api'
import { useToastStore } from '@/store/toastStore'
import { formatIDR, formatNumber } from '@/utils'

interface DashboardApiResponse {
  concertInfo: ConcertInfo
  revenueTrend: RevenuePoint[]
  financeSummary: FinanceSummary
  financeBreakdown: FinanceBreakdownItem[]
  ticketSummary: TicketSummary
  hourlySales: { hour: string; tickets: number }[]
  dailyRevenue: { day: string; revenue: number }[]
  checkInConversion: { stage: string; value: number }[]
  crowdZones: CrowdZone[]
  densityTrend: { time: string; density: number }[]
}

const EMPTY_CONCERT_INFO: ConcertInfo = {
  name: '',
  venue: '',
  date: '',
  status: '',
  currentPerformer: '',
  capacity: 0,
  attendance: 0,
}

const EMPTY_FINANCE_SUMMARY: FinanceSummary = { revenue: 0, expenses: 0, profit: 0, margin: 0 }
const EMPTY_TICKET_SUMMARY: TicketSummary = { sold: 0, revenue: 0, refunds: 0, remaining: 0 }

interface DashboardState {
  isLoading: boolean
  concertInfo: ConcertInfo
  revenueTrend: RevenuePoint[]
  financeSummary: FinanceSummary
  financeBreakdown: FinanceBreakdownItem[]
  ticketSummary: TicketSummary
  hourlySales: { hour: string; tickets: number }[]
  dailyRevenue: { day: string; revenue: number }[]
  checkInConversion: { stage: string; value: number }[]
  crowdZones: CrowdZone[]
  densityTrend: { time: string; density: number }[]
  managerKpis: KpiCardData[]
  adminKpis: KpiCardData[]
  securityKpis: KpiCardData[]
  incidentMetrics: IncidentMetrics | null
  lastUpdated: number | null
  fetchDashboard: (opts?: { silent?: boolean }) => Promise<void>
  // Manual report entry — Admin/Event Organizer files finance & ticket
  // figures by hand; Security files audience attendance (they're the ones
  // physically counting people in). Replaces the old simulator-driven values.
  updateFinance: (revenue: number, expenses: number) => Promise<boolean>
  updateTicketSummary: (input: { sold: number; remaining: number }) => Promise<boolean>
  updateAttendance: (attendance: number) => Promise<boolean>
}

function buildKpis(
  data: DashboardApiResponse,
  vendors: Vendor[],
  incidents: Incident[],
  metrics: IncidentMetrics | null
): { managerKpis: KpiCardData[]; adminKpis: KpiCardData[]; securityKpis: KpiCardData[] } {
  const activeVendors = vendors.filter((v) => v.status === 'active').length
  const openIncidents = incidents.filter((i) => i.status !== 'closed' && i.status !== 'resolved').length
  const criticalZones = data.crowdZones.filter((z) => z.status === 'critical').length

  // Real avg response time (minutes) from incident status-transition timestamps;
  // trend is measured against the 8-minute PRD target.
  const avgResponse = metrics?.avgResponseMinutes ?? null
  const responseValue = avgResponse === null ? '—' : `${avgResponse.toFixed(1)} min`
  const responseTrend = avgResponse === null ? 'flat' : avgResponse <= (metrics?.targetMinutes ?? 8) ? 'down' : 'up'
  const responseDelta =
    avgResponse === null ? 'no data' : `target ${metrics?.targetMinutes ?? 8} min`

  // Deltas/trends have no historical baseline table yet, so they stay as
  // the same illustrative figures the dummy data shipped with.
  return {
    managerKpis: [
      { id: 'revenue', label: 'Revenue', value: formatIDR(data.financeSummary.revenue), delta: '+12.4%', trend: 'up', icon: 'wallet' },
      { id: 'profit', label: 'Profit', value: formatIDR(data.financeSummary.profit), delta: '+9.1%', trend: 'up', icon: 'trending-up' },
      { id: 'attendance', label: 'Attendance', value: formatNumber(data.concertInfo.attendance), delta: '+3.2%', trend: 'up', icon: 'users' },
      { id: 'margin', label: 'Profit Margin', value: `${data.financeSummary.margin.toFixed(1)}%`, delta: '+2.0%', trend: 'up', icon: 'gauge' },
    ],
    adminKpis: [
      { id: 'sold', label: 'Tickets Sold', value: formatNumber(data.ticketSummary.sold), delta: '+3.2%', trend: 'up', icon: 'ticket' },
      { id: 'vendors', label: 'Active Vendors', value: `${activeVendors} / ${vendors.length}`, delta: '+2', trend: 'up', icon: 'store' },
      { id: 'remaining', label: 'Remaining Tickets', value: formatNumber(data.ticketSummary.remaining), delta: '-3.2%', trend: 'down', icon: 'ticket' },
      { id: 'revenue', label: 'Revenue Today', value: formatIDR(data.ticketSummary.revenue), delta: '+12.4%', trend: 'up', icon: 'wallet' },
    ],
    securityKpis: [
      { id: 'incidents', label: 'Open Incidents', value: String(openIncidents), delta: '-1', trend: 'down', icon: 'shield-alert' },
      { id: 'critical', label: 'Critical Zones', value: String(criticalZones), delta: '0', trend: 'flat', icon: 'flame' },
      { id: 'occupancy', label: 'Total Occupancy', value: '80.3%', delta: '+5.1%', trend: 'up', icon: 'gauge' },
      { id: 'response', label: 'Avg Response Time', value: responseValue, delta: responseDelta, trend: responseTrend, icon: 'users' },
    ],
  }
}

// Single source of truth for all dashboard data across roles, now backed
// by the /api/dashboard endpoint (PostgreSQL) instead of static dummy data.
// The concert schedule itself (create/edit/delete/Live toggle) lives in
// eventStore — this store just reflects whichever concert is active.
export const useDashboardStore = create<DashboardState>((set, get) => ({
  isLoading: false,
  concertInfo: EMPTY_CONCERT_INFO,
  revenueTrend: [],
  financeSummary: EMPTY_FINANCE_SUMMARY,
  financeBreakdown: [],
  ticketSummary: EMPTY_TICKET_SUMMARY,
  hourlySales: [],
  dailyRevenue: [],
  checkInConversion: [],
  crowdZones: [],
  densityTrend: [],
  managerKpis: [],
  adminKpis: [],
  securityKpis: [],
  incidentMetrics: null,
  lastUpdated: null,

  fetchDashboard: async (opts) => {
    const silent = opts?.silent ?? false
    if (!silent) set({ isLoading: true })
    try {
      const [dashboard, vendors, incidents, incidentMetrics] = await Promise.all([
        api.get<DashboardApiResponse>('/api/dashboard'),
        api.get<Vendor[]>('/api/vendors'),
        api.get<Incident[]>('/api/incidents'),
        api.get<IncidentMetrics>('/api/incidents/metrics'),
      ])
      const kpis = buildKpis(dashboard, vendors, incidents, incidentMetrics)
      set({ ...dashboard, ...kpis, incidentMetrics, isLoading: false, lastUpdated: Date.now() })
    } catch (err) {
      set({ isLoading: false })
      // Stay quiet on background polls so a transient blip doesn't spam toasts.
      if (!silent) {
        const message = err instanceof ApiError ? err.message : 'Gagal memuat data dashboard.'
        useToastStore.getState().show(message, 'error')
      }
    }
  },

  updateFinance: async (revenue, expenses) => {
    try {
      await api.put('/api/finance', { revenue, expenses })
      useToastStore.getState().show('Laporan keuangan berhasil disimpan.', 'success')
      await get().fetchDashboard({ silent: true })
      return true
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Gagal menyimpan laporan keuangan.'
      useToastStore.getState().show(message, 'error')
      return false
    }
  },

  updateTicketSummary: async (input) => {
    try {
      await api.put('/api/ticket-sales', input)
      useToastStore.getState().show('Data tiket berhasil disimpan.', 'success')
      await get().fetchDashboard({ silent: true })
      return true
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Gagal menyimpan data tiket.'
      useToastStore.getState().show(message, 'error')
      return false
    }
  },

  updateAttendance: async (attendance) => {
    try {
      await api.put('/api/attendance', { attendance })
      useToastStore.getState().show('Data kehadiran penonton berhasil disimpan.', 'success')
      await get().fetchDashboard({ silent: true })
      return true
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Gagal menyimpan data kehadiran.'
      useToastStore.getState().show(message, 'error')
      return false
    }
  },
}))
