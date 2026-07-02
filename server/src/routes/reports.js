import { Router } from 'express'
import { generateInsight } from '../claudeClient.js'
import { buildReportPdf } from '../pdfBuilder.js'
import { query, resolveActiveEventId } from '../db/pool.js'
import { getIncidentMetrics } from '../services/incidents.js'

const router = Router()
const num = (v) => (v === null || v === undefined ? 0 : Number(v))

function toFieldReport(row) {
  return { author: row.author_name, category: row.category, title: row.title, content: row.content }
}

function toIncidentSummary(row) {
  return { id: row.id, area: row.area, severity: row.severity, status: row.status, description: row.description }
}

// Gathers everything the evaluation report draws on: ticket/finance data
// (Manager's own numbers), the Event Organizer's field reports, and the
// Security Team's incident record — one source of truth, assembled
// server-side so the Manager doesn't need to hand-collect it.
async function assembleReportInput(eventId) {
  const [eventRes, financeSummaryRes, financeBreakdownRes, ticketSummaryRes, fieldReportsRes, incidentsRes, incidentMetrics] =
    await Promise.all([
      query('SELECT * FROM events WHERE id = $1', [eventId]),
      query('SELECT * FROM finance_summary WHERE event_id = $1', [eventId]),
      query('SELECT * FROM finance_breakdown WHERE event_id = $1 ORDER BY id', [eventId]),
      query('SELECT * FROM ticket_summary WHERE event_id = $1', [eventId]),
      query('SELECT * FROM field_reports WHERE event_id = $1 ORDER BY created_at DESC LIMIT 20', [eventId]),
      query('SELECT * FROM incidents WHERE event_id = $1 ORDER BY created_at DESC LIMIT 15', [eventId]),
      getIncidentMetrics(eventId),
    ])

  const event = eventRes.rows[0]
  if (!event) return null

  const financeSummary = financeSummaryRes.rows[0]
  const ticketSummary = ticketSummaryRes.rows[0]

  return {
    concertInfo: {
      name: event.name,
      venue: event.venue,
      date: event.event_date,
      capacity: event.capacity,
      attendance: event.attendance,
    },
    attendance: event.attendance,
    financeSummary: financeSummary
      ? { revenue: num(financeSummary.revenue), expenses: num(financeSummary.expenses), profit: num(financeSummary.profit), margin: num(financeSummary.margin) }
      : { revenue: 0, expenses: 0, profit: 0, margin: 0 },
    financeBreakdown: financeBreakdownRes.rows.map((r) => ({ category: r.category, amount: num(r.amount) })),
    ticketSummary: ticketSummary
      ? { sold: ticketSummary.sold, revenue: num(ticketSummary.revenue), refunds: ticketSummary.refunds, remaining: ticketSummary.remaining }
      : { sold: 0, revenue: 0, refunds: 0, remaining: 0 },
    fieldReports: fieldReportsRes.rows.map(toFieldReport),
    incidentSummary: incidentMetrics,
    recentIncidents: incidentsRes.rows.map(toIncidentSummary),
  }
}

// POST /api/reports/evaluation
// Manager triggers generation; all data (finance/tickets + the Event
// Organizer's field reports + the Security Team's incident record) is
// gathered server-side for the active concert and handed to Claude for a
// single detailed evaluation narrative.
router.post('/evaluation', async (_req, res) => {
  try {
    const eventId = await resolveActiveEventId()
    const input = await assembleReportInput(eventId)
    if (!input) {
      return res.status(404).json({ error: 'Tidak ada data konser untuk dibuatkan laporan.' })
    }

    const { insight } = await generateInsight(input)

    const generatedAt = new Date().toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })
    const pdfBuffer = await buildReportPdf(input, insight, generatedAt)
    const pdfBase64 = pdfBuffer.toString('base64')

    try {
      const id = `rep-${Date.now()}`
      await query(
        `INSERT INTO reports (id, event_id, generated_at_label, insight, pdf_base64)
         VALUES ($1, $2, $3, $4, $5)`,
        [id, eventId, generatedAt, insight, pdfBase64]
      )
    } catch (persistErr) {
      // Don't fail the request if persistence fails — the report still downloads.
      console.error('Failed to persist report (continuing):', persistErr)
    }

    res.json({ generatedAt, insight, pdfBase64 })
  } catch (err) {
    console.error('Report generation failed:', err)
    res.status(500).json({ error: 'Failed to generate report. Please try again.' })
  }
})

// GET /api/reports/evaluation/history — list previously generated reports (metadata only)
router.get('/evaluation/history', async (_req, res) => {
  try {
    const eventId = await resolveActiveEventId()
    const { rows } = await query(
      `SELECT id, generated_at_label, created_at FROM reports WHERE event_id = $1 ORDER BY created_at DESC LIMIT 20`,
      [eventId]
    )
    res.json(rows.map((r) => ({ id: r.id, generatedAt: r.generated_at_label, createdAt: r.created_at })))
  } catch (err) {
    console.error('Failed to load report history:', err)
    res.status(500).json({ error: 'Gagal memuat riwayat laporan.' })
  }
})

export default router
