import { Router } from 'express'
import { query, resolveActiveEventId } from '../db/pool.js'

const router = Router()

function toFinanceSummary(row) {
  return { revenue: Number(row.revenue), expenses: Number(row.expenses), profit: Number(row.profit), margin: Number(row.margin) }
}

function isValidAmount(v) {
  return v !== undefined && v !== null && Number.isFinite(Number(v)) && Number(v) >= 0
}

// PUT /api/finance  { revenue, expenses }
// Manual finance report entry (Admin/Event Organizer) for the active
// concert — replaces the old simulator-driven revenue/expenses. Profit and
// margin are always recomputed from these two figures, never entered directly.
router.put('/', async (req, res) => {
  const { revenue, expenses } = req.body || {}
  if (!isValidAmount(revenue) || !isValidAmount(expenses)) {
    return res.status(400).json({ error: 'Total pendapatan dan pengeluaran wajib diisi dengan angka valid.' })
  }

  try {
    const eventId = await resolveActiveEventId()
    const rev = Number(revenue)
    const exp = Number(expenses)
    const profit = rev - exp
    const margin = rev > 0 ? Math.round((profit / rev) * 10000) / 100 : 0

    const { rows } = await query(
      `INSERT INTO finance_summary (event_id, revenue, expenses, profit, margin)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (event_id) DO UPDATE SET revenue = $2, expenses = $3, profit = $4, margin = $5
       RETURNING *`,
      [eventId, rev, exp, profit, margin]
    )
    res.json(toFinanceSummary(rows[0]))
  } catch (err) {
    console.error('Failed to update finance summary:', err)
    res.status(500).json({ error: 'Gagal menyimpan laporan keuangan.' })
  }
})

export default router
