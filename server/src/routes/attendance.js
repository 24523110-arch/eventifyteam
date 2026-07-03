import { Router } from 'express'
import { query, resolveActiveEventId } from '../db/pool.js'

const router = Router()

// PUT /api/attendance  { attendance }
// Manual audience-attendance entry, owned by the Security Team (they're the
// ones physically counting people at the gates/venue) for the active concert.
router.put('/', async (req, res) => {
  const { attendance } = req.body || {}
  if (attendance === undefined || attendance === null || !Number.isFinite(Number(attendance)) || Number(attendance) < 0) {
    return res.status(400).json({ error: 'Jumlah kehadiran penonton wajib diisi dengan angka valid.' })
  }

  try {
    const eventId = await resolveActiveEventId()
    const value = Math.round(Number(attendance))
    const { rows } = await query(
      `UPDATE events SET attendance = LEAST($2, capacity), updated_at = now() WHERE id = $1 RETURNING id, attendance, capacity`,
      [eventId, value]
    )
    if (!rows[0]) return res.status(404).json({ error: 'Konser aktif tidak ditemukan.' })
    res.json({ attendance: rows[0].attendance, capacity: rows[0].capacity })
  } catch (err) {
    console.error('Failed to update attendance:', err)
    res.status(500).json({ error: 'Gagal menyimpan data kehadiran penonton.' })
  }
})

export default router
