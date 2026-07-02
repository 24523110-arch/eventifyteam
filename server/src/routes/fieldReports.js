import { Router } from 'express'
import { query, resolveActiveEventId } from '../db/pool.js'
import { formatIndoDateTime } from '../utils/format.js'
import { notifyFieldReport } from '../notify.js'

const router = Router()
// Security/incident reporting already belongs to the Security Team's own
// Incident Center — the EO's field reports cover everything else.
const VALID_CATEGORIES = ['Operasional', 'Vendor', 'Tiket', 'Umum']

function toFieldReport(row) {
  return {
    id: row.id,
    author: row.author_name,
    category: row.category,
    title: row.title,
    content: row.content,
    createdAt: formatIndoDateTime(row.created_at),
  }
}

// GET /api/field-reports — Manager (and the authoring Admin) read the feed.
router.get('/', async (_req, res) => {
  try {
    const eventId = await resolveActiveEventId()
    const { rows } = await query(
      `SELECT * FROM field_reports WHERE event_id = $1 ORDER BY created_at DESC LIMIT 100`,
      [eventId]
    )
    res.json(rows.map(toFieldReport))
  } catch (err) {
    console.error('Failed to list field reports:', err)
    res.status(500).json({ error: 'Gagal memuat laporan lapangan.' })
  }
})

// POST /api/field-reports  { category, title, content }  (Admin/EO only)
router.post('/', async (req, res) => {
  const { category, title, content } = req.body || {}
  if (!category || !title || !content) {
    return res.status(400).json({ error: 'Kategori, judul, dan isi laporan wajib diisi.' })
  }
  if (!VALID_CATEGORIES.includes(category)) {
    return res.status(400).json({ error: 'Kategori laporan tidak valid.' })
  }
  try {
    const eventId = await resolveActiveEventId()
    const id = `fr-${Date.now()}`
    const { rows } = await query(
      `INSERT INTO field_reports (id, event_id, author_id, author_name, category, title, content)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [id, eventId, req.user?.id ?? null, req.user?.name ?? 'Event Organizer', category, title, content]
    )
    // Pipe the report through to the Manager's bell.
    await notifyFieldReport(rows[0])
    res.status(201).json(toFieldReport(rows[0]))
  } catch (err) {
    console.error('Failed to create field report:', err)
    res.status(500).json({ error: 'Gagal mengirim laporan lapangan.' })
  }
})

export default router
