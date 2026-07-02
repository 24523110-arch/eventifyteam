import { Router } from 'express'
import { query, resolveActiveEventId } from '../db/pool.js'

const router = Router()
const VALID_STATUSES = ['not_arrived', 'check_in', 'setup', 'ready', 'active', 'completed']

function toVendor(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    arrivalTime: row.arrival_time,
    status: row.status,
    assignedArea: row.assigned_area,
    contact: row.contact,
  }
}

function validateInput(body) {
  const { name, category, arrivalTime, status, assignedArea, contact } = body || {}
  if (!name || !category || !arrivalTime || !assignedArea || !contact) {
    return 'Semua field vendor wajib diisi.'
  }
  if (status && !VALID_STATUSES.includes(status)) return 'Status vendor tidak valid.'
  return null
}

// GET /api/vendors — scoped to the active concert
router.get('/', async (_req, res) => {
  try {
    const eventId = await resolveActiveEventId()
    const { rows } = await query(
      `SELECT * FROM vendors WHERE event_id = $1 ORDER BY created_at ASC`,
      [eventId]
    )
    res.json(rows.map(toVendor))
  } catch (err) {
    console.error('Failed to list vendors:', err)
    res.status(500).json({ error: 'Gagal memuat daftar vendor.' })
  }
})

// POST /api/vendors  (Omit<Vendor, 'id'>)
router.post('/', async (req, res) => {
  const validationError = validateInput(req.body)
  if (validationError) return res.status(400).json({ error: validationError })

  const { name, category, arrivalTime, status = 'not_arrived', assignedArea, contact } = req.body
  const id = `v-${Date.now()}`

  try {
    const eventId = await resolveActiveEventId()
    const { rows } = await query(
      `INSERT INTO vendors (id, event_id, name, category, arrival_time, status, assigned_area, contact)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [id, eventId, name, category, arrivalTime, status, assignedArea, contact]
    )
    res.status(201).json(toVendor(rows[0]))
  } catch (err) {
    console.error('Failed to create vendor:', err)
    res.status(500).json({ error: 'Gagal membuat vendor.' })
  }
})

// PUT /api/vendors/:id  (Omit<Vendor, 'id'>)
router.put('/:id', async (req, res) => {
  const validationError = validateInput(req.body)
  if (validationError) return res.status(400).json({ error: validationError })

  const { name, category, arrivalTime, status, assignedArea, contact } = req.body
  try {
    const { rows } = await query(
      `UPDATE vendors
       SET name = $1, category = $2, arrival_time = $3, status = $4,
           assigned_area = $5, contact = $6, updated_at = now()
       WHERE id = $7
       RETURNING *`,
      [name, category, arrivalTime, status, assignedArea, contact, req.params.id]
    )
    if (!rows[0]) return res.status(404).json({ error: 'Vendor tidak ditemukan.' })
    res.json(toVendor(rows[0]))
  } catch (err) {
    console.error('Failed to update vendor:', err)
    res.status(500).json({ error: 'Gagal memperbarui vendor.' })
  }
})

// DELETE /api/vendors/:id
router.delete('/:id', async (req, res) => {
  try {
    const { rowCount } = await query('DELETE FROM vendors WHERE id = $1', [req.params.id])
    if (!rowCount) return res.status(404).json({ error: 'Vendor tidak ditemukan.' })
    res.status(204).end()
  } catch (err) {
    console.error('Failed to delete vendor:', err)
    res.status(500).json({ error: 'Gagal menghapus vendor.' })
  }
})

export default router
