import { Router } from 'express'
import { query, resolveActiveEventId } from '../db/pool.js'

const router = Router()

const num = (v) => (v === null || v === undefined ? 0 : Number(v))

// GET /api/dashboard
// Single aggregate endpoint backing dashboardStore — one round trip for
// every role's dashboard (Manager finance, Admin ticketing, Security crowd).
// Always reflects whichever concert is active per resolveActiveEventId().
router.get('/', async (_req, res) => {
  try {
    const eventId = await resolveActiveEventId()
    const [
      eventRes,
      revenueTrendRes,
      financeSummaryRes,
      financeBreakdownRes,
      ticketSummaryRes,
      hourlySalesRes,
      dailyRevenueRes,
      checkinConversionRes,
      crowdZonesRes,
      densityTrendRes,
    ] = await Promise.all([
      query('SELECT * FROM events WHERE id = $1', [eventId]),
      query('SELECT * FROM revenue_trend WHERE event_id = $1 ORDER BY sort_order', [eventId]),
      query('SELECT * FROM finance_summary WHERE event_id = $1', [eventId]),
      query('SELECT * FROM finance_breakdown WHERE event_id = $1 ORDER BY id', [eventId]),
      query('SELECT * FROM ticket_summary WHERE event_id = $1', [eventId]),
      query('SELECT * FROM hourly_sales WHERE event_id = $1 ORDER BY sort_order', [eventId]),
      query('SELECT * FROM daily_revenue WHERE event_id = $1 ORDER BY sort_order', [eventId]),
      query('SELECT * FROM checkin_conversion WHERE event_id = $1 ORDER BY sort_order', [eventId]),
      query('SELECT * FROM crowd_zones WHERE event_id = $1 ORDER BY id', [eventId]),
      query('SELECT * FROM density_trend WHERE event_id = $1 ORDER BY sort_order', [eventId]),
    ])

    const event = eventRes.rows[0]
    if (!event) {
      return res.status(404).json({ error: `Event "${eventId}" tidak ditemukan. Jalankan npm run db:migrate.` })
    }
    const financeSummary = financeSummaryRes.rows[0]
    const ticketSummary = ticketSummaryRes.rows[0]

    res.json({
      concertInfo: {
        name: event.name,
        venue: event.venue,
        date: event.event_date,
        status: event.status,
        currentPerformer: event.current_performer,
        capacity: event.capacity,
        attendance: event.attendance,
      },
      revenueTrend: revenueTrendRes.rows.map((r) => ({
        time: r.time_label,
        revenue: num(r.revenue),
        ticketsSold: r.tickets_sold,
      })),
      financeSummary: financeSummary
        ? {
            revenue: num(financeSummary.revenue),
            expenses: num(financeSummary.expenses),
            profit: num(financeSummary.profit),
            margin: num(financeSummary.margin),
          }
        : { revenue: 0, expenses: 0, profit: 0, margin: 0 },
      financeBreakdown: financeBreakdownRes.rows.map((r) => ({ category: r.category, amount: num(r.amount) })),
      ticketSummary: ticketSummary
        ? {
            sold: ticketSummary.sold,
            revenue: num(ticketSummary.revenue),
            refunds: ticketSummary.refunds,
            remaining: ticketSummary.remaining,
          }
        : { sold: 0, revenue: 0, refunds: 0, remaining: 0 },
      hourlySales: hourlySalesRes.rows.map((r) => ({ hour: r.hour_label, tickets: r.tickets })),
      dailyRevenue: dailyRevenueRes.rows.map((r) => ({ day: r.day_label, revenue: num(r.revenue) })),
      checkInConversion: checkinConversionRes.rows.map((r) => ({ stage: r.stage, value: r.value })),
      crowdZones: crowdZonesRes.rows.map((r) => ({
        id: r.id,
        name: r.name,
        capacity: r.capacity,
        current: r.current,
        status: r.status,
      })),
      densityTrend: densityTrendRes.rows.map((r) => ({ time: r.time_label, density: r.density })),
    })
  } catch (err) {
    console.error('Failed to load dashboard data:', err)
    res.status(500).json({ error: 'Gagal memuat data dashboard.' })
  }
})

export default router
