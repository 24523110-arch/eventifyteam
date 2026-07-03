import { Router } from 'express'
import { query, resolveActiveEventId } from '../db/pool.js'

const router = Router()
const AVG_TICKET_PRICE = 750_000 // Rp — same figure the (now-retired) ticket simulator used

function toTicketSummary(row) {
  return { sold: row.sold, revenue: Number(row.revenue), refunds: row.refunds, remaining: row.remaining }
}

function isValidCount(v) {
  return v !== undefined && v !== null && Number.isFinite(Number(v)) && Number(v) >= 0
}

// PUT /api/ticket-sales  { sold, remaining }
// Manual ticket report entry (Admin/Event Organizer) for the active concert —
// replaces the old simulator-driven ticket counts. Ticket revenue is derived
// from `sold` at a fixed average price rather than entered directly. Refunds
// are not part of this report — the existing stored value is left untouched.
router.put('/', async (req, res) => {
  const { sold, remaining } = req.body || {}
  if (!isValidCount(sold) || !isValidCount(remaining)) {
    return res.status(400).json({ error: 'Tiket terjual dan tiket tersisa wajib diisi dengan angka valid.' })
  }

  try {
    const eventId = await resolveActiveEventId()
    const soldNum = Math.round(Number(sold))
    const remainingNum = Math.round(Number(remaining))
    const revenue = soldNum * AVG_TICKET_PRICE

    const { rows } = await query(
      `INSERT INTO ticket_summary (event_id, sold, revenue, refunds, remaining)
       VALUES ($1, $2, $3, 0, $4)
       ON CONFLICT (event_id) DO UPDATE SET sold = $2, revenue = $3, remaining = $4
       RETURNING *`,
      [eventId, soldNum, revenue, remainingNum]
    )
    res.json(toTicketSummary(rows[0]))
  } catch (err) {
    console.error('Failed to update ticket summary:', err)
    res.status(500).json({ error: 'Gagal menyimpan data tiket.' })
  }
})

export default router
