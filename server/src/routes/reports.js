import { Router } from 'express'
import { generateInsight } from '../claudeClient.js'
import { buildReportPdf } from '../pdfBuilder.js'
import { query, DEFAULT_EVENT_ID } from '../db/pool.js'

const router = Router()

// POST /api/reports/evaluation
// Body: ReportGenerationInput (ticketSummary, attendance, financeSummary, financeBreakdown, concertInfo)
// Returns: { generatedAt, insight, pdfBase64 }
router.post('/evaluation', async (req, res) => {
  try {
    const input = req.body

    if (!input || !input.ticketSummary || !input.financeSummary || !input.concertInfo) {
      return res.status(400).json({ error: 'Missing required report input fields.' })
    }

    // Step 1-3 (per brief): collect ticket sales, attendance, finance data — all arrive in the request body
    // Step 4: analyze event performance (insight)
    const { insight } = await generateInsight(input)

    const generatedAt = new Date().toLocaleString('id-ID', {
      dateStyle: 'long',
      timeStyle: 'short',
    })

    // Step 5: produce the downloadable PDF
    const pdfBuffer = await buildReportPdf(input, insight, generatedAt)
    const pdfBase64 = pdfBuffer.toString('base64')

    // Persist so the report shows up in history / can be re-downloaded later.
    try {
      const id = `rep-${Date.now()}`
      await query(
        `INSERT INTO reports (id, event_id, generated_at_label, insight, pdf_base64)
         VALUES ($1, $2, $3, $4, $5)`,
        [id, DEFAULT_EVENT_ID, generatedAt, insight, pdfBase64]
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
    const { rows } = await query(
      `SELECT id, generated_at_label, created_at FROM reports WHERE event_id = $1 ORDER BY created_at DESC LIMIT 20`,
      [DEFAULT_EVENT_ID]
    )
    res.json(rows.map((r) => ({ id: r.id, generatedAt: r.generated_at_label, createdAt: r.created_at })))
  } catch (err) {
    console.error('Failed to load report history:', err)
    res.status(500).json({ error: 'Gagal memuat riwayat laporan.' })
  }
})

export default router
