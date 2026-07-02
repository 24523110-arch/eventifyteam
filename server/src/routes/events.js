import { Router } from 'express'
import { query } from '../db/pool.js'
import { createEventWithScaffold } from '../services/events.js'
import { notifyEventStatus } from '../notify.js'

const router = Router()
const VALID_STATUSES = ['Scheduled', 'Live', 'Ended']

function toSchedule(row) {
  return {
    id: row.id,
    name: row.name,
    venue: row.venue,
    date: row.event_date,
    status: row.status,
    currentPerformer: row.current_performer,
    capacity: row.capacity,
    attendance: row.attendance,
  }
}

function validateInput(body) {
  const { name, venue, date, capacity } = body || {}
  if (!name || !venue || !date || capacity === undefined) {
    return 'Nama, venue, tanggal, dan kapasitas wajib diisi.'
  }
  if (!Number.isFinite(Number(capacity)) || Number(capacity) < 0) return 'Kapasitas tidak valid.'
  return null
}

// GET /api/events — the full concert schedule: ongoing, upcoming, and history.
router.get('/', async (_req, res) => {
  try {
    const { rows } = await query(
      `SELECT * FROM events
       ORDER BY CASE status WHEN 'Live' THEN 0 WHEN 'Scheduled' THEN 1 ELSE 2 END, updated_at DESC`
    )
    res.json(rows.map(toSchedule))
  } catch (err) {
    console.error('Failed to list event schedule:', err)
    res.status(500).json({ error: 'Gagal memuat jadwal konser.' })
  }
})

// POST /api/events — Event Organizer schedules a new concert ('belum
// berlangsung'). Also provisions the zeroed operational scaffold (finance,
// ticketing, crowd zones, trend buckets) so the dashboard + simulator have
// real rows the moment this concert goes Live.
router.post('/', async (req, res) => {
  const validationError = validateInput(req.body)
  if (validationError) return res.status(400).json({ error: validationError })

  try {
    const event = await createEventWithScaffold(req.body)
    res.status(201).json(toSchedule(event))
  } catch (err) {
    console.error('Failed to create event schedule:', err)
    res.status(500).json({ error: 'Gagal membuat jadwal konser.' })
  }
})

// PUT /api/events/:id — edit schedule details (name/venue/date/capacity/performer).
// Status is not editable here — use PATCH /:id/status.
router.put('/:id', async (req, res) => {
  const validationError = validateInput(req.body)
  if (validationError) return res.status(400).json({ error: validationError })

  const { name, venue, date, capacity, currentPerformer = '' } = req.body
  try {
    const { rows } = await query(
      `UPDATE events
       SET name = $1, venue = $2, event_date = $3, capacity = $4, current_performer = $5, updated_at = now()
       WHERE id = $6
       RETURNING *`,
      [name, venue, date, capacity, currentPerformer, req.params.id]
    )
    if (!rows[0]) return res.status(404).json({ error: 'Jadwal konser tidak ditemukan.' })
    res.json(toSchedule(rows[0]))
  } catch (err) {
    console.error('Failed to update event schedule:', err)
    res.status(500).json({ error: 'Gagal memperbarui jadwal konser.' })
  }
})

// DELETE /api/events/:id — only for history ('Ended') or not-yet-started
// ('Scheduled'). The currently live concert must be ended first.
router.delete('/:id', async (req, res) => {
  try {
    const { rows } = await query('SELECT status FROM events WHERE id = $1', [req.params.id])
    if (!rows[0]) return res.status(404).json({ error: 'Jadwal konser tidak ditemukan.' })
    if (rows[0].status === 'Live') {
      return res.status(400).json({ error: 'Akhiri konser ini sebelum menghapusnya.' })
    }
    await query('DELETE FROM events WHERE id = $1', [req.params.id])
    res.status(204).end()
  } catch (err) {
    console.error('Failed to delete event schedule:', err)
    res.status(500).json({ error: 'Gagal menghapus jadwal konser.' })
  }
})

// PATCH /api/events/:id/status  { status: 'Live' | 'Ended' }
// "Mulai Live": starting one concert automatically ends any other Live one —
// only one concert runs at a time. "Akhiri Konser": stops monitoring/freezes
// the data (the simulator checks for a Live row each tick).
router.patch('/:id/status', async (req, res) => {
  const { status } = req.body || {}
  if (!VALID_STATUSES.includes(status) || status === 'Scheduled') {
    return res.status(400).json({ error: 'Status hanya bisa diubah ke Live atau Ended.' })
  }

  try {
    if (status === 'Live') {
      await query(`UPDATE events SET status = 'Ended', updated_at = now() WHERE status = 'Live' AND id <> $1`, [
        req.params.id,
      ])
    }
    const { rows } = await query(
      `UPDATE events SET status = $1, updated_at = now() WHERE id = $2 RETURNING *`,
      [status, req.params.id]
    )
    if (!rows[0]) return res.status(404).json({ error: 'Jadwal konser tidak ditemukan.' })

    await notifyEventStatus(rows[0])
    res.json(toSchedule(rows[0]))
  } catch (err) {
    console.error('Failed to change event status:', err)
    res.status(500).json({ error: 'Gagal mengubah status konser.' })
  }
})

export default router
