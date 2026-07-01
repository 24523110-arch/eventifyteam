import type {
  ConcertInfo,
  RevenuePoint,
  FinanceSummary,
  FinanceBreakdownItem,
  TicketSummary,
} from '@/types'

export const CONCERT_INFO: ConcertInfo = {
  name: 'Coldplay — Music of the Spheres World Tour',
  venue: 'Gelora Bung Karno Stadium, Jakarta',
  date: '19 Juni 2026',
  status: 'Live',
  currentPerformer: 'Coldplay — Main Set',
  capacity: 60000,
  attendance: 48210,
}

export const REVENUE_TREND: RevenuePoint[] = [
  { time: '14:00', revenue: 12.4, ticketsSold: 4200 },
  { time: '15:00', revenue: 24.1, ticketsSold: 8100 },
  { time: '16:00', revenue: 38.7, ticketsSold: 12400 },
  { time: '17:00', revenue: 52.3, ticketsSold: 16800 },
  { time: '18:00', revenue: 64.9, ticketsSold: 21200 },
  { time: '19:00', revenue: 76.2, ticketsSold: 25100 },
  { time: '20:00', revenue: 84.6, ticketsSold: 27600 },
]

export const FINANCE_SUMMARY: FinanceSummary = {
  revenue: 84_600_000_000,
  expenses: 31_200_000_000,
  profit: 53_400_000_000,
  margin: 63.1,
}

export const FINANCE_BREAKDOWN: FinanceBreakdownItem[] = [
  { category: 'Vendor', amount: 9_800_000_000 },
  { category: 'Venue', amount: 8_200_000_000 },
  { category: 'Security', amount: 4_600_000_000 },
  { category: 'Marketing', amount: 5_400_000_000 },
  { category: 'Operations', amount: 3_200_000_000 },
]

export const TICKET_SUMMARY: TicketSummary = {
  sold: 48210,
  revenue: 84_600_000_000,
  refunds: 312,
  remaining: 11790,
}

export const HOURLY_SALES = [
  { hour: '08:00', tickets: 1200 },
  { hour: '10:00', tickets: 2400 },
  { hour: '12:00', tickets: 4100 },
  { hour: '14:00', tickets: 6800 },
  { hour: '16:00', tickets: 5200 },
  { hour: '18:00', tickets: 3900 },
  { hour: '20:00', tickets: 1600 },
]

export const DAILY_REVENUE = [
  { day: 'Sen', revenue: 12.1 },
  { day: 'Sel', revenue: 18.4 },
  { day: 'Rab', revenue: 22.7 },
  { day: 'Kam', revenue: 31.2 },
  { day: 'Jum', revenue: 48.6 },
  { day: 'Sab', revenue: 71.3 },
  { day: 'Min', revenue: 84.6 },
]

export const CHECKIN_CONVERSION = [
  { stage: 'Tickets Sold', value: 48210 },
  { stage: 'Gate Scanned', value: 46890 },
  { stage: 'Checked In', value: 45120 },
  { stage: 'Inside Venue', value: 44310 },
]
