import { Router } from 'express'
import { query, withTransaction, DEFAULT_EVENT_ID } from '../db/pool.js'
import { formatClockTime } from '../utils/format.js'

const router = Router()
const VALID_SEVERITIES = ['low', 'medium', 'high', 'critical']
const VALID_STATUSES = ['new', 'assigned', 'in_progress', 'escalated', 'resolved', 'closed']

function toIncident(row) {
  return {
    id: row.id,
    area: row.area,
    severity: row.severity,
    assignedTeam: row.assigned_team,
    status: row.status,
    createdAt: formatClockTime(row.created_at),
    description: row.description,
  }
}

function validateInput(body) {
  const { area, severity, description } = body || {}
  if (!area || !severity || description === undefined) return 'Area, tingkat keparahan, dan deskripsi wajib diisi.'
  if (!VALID_SEVERITIES.includes(severity)) return 'Tingkat keparahan tidak valid.'
  if (body.status && !VALID_STATUSES.includes(body.status)) return 'Status insiden tidak valid.'
  return null
}

async function nextIncidentId(client) {
  const { rows } = await client.query(
    `SELECT id FROM incidents WHERE id LIKE 'INC-%'`
  )
  const max = rows
    .map((r) => parseInt(r.id.replace('INC-', ''), 10))
    .filter((n) => !Number.isNaN(n))
    .reduce((a, b) => Math.max(a, b), 0)
  return `INC-${String(max + 1).padStart(4, '0')}`
}

// GET /api/incidents
router.get('/', async (_req, res) => {
  try {
    const { rows } = await query(
      `SELECT * FROM incidents WHERE event_id = $1 ORDER BY created_at DESC`,
      [DEFAULT_EVENT_ID]
    )
    res.json(rows.map(toIncident))
  } catch (err) {
    console.error('Failed to list incidents:', err)
    res.status(500).json({ error: 'Gagal memuat daftar insiden.' })
  }
})

// POST /api/incidents  (Omit<Incident, 'id' | 'createdAt'>)
router.post('/', async (req, res) => {
  const validationError = validateInput(req.body)
  if (validationError) return res.status(400).json({ error: validationError })

  const { area, severity, assignedTeam = 'Unassigned', status = 'new', description } = req.body

  try {
    const incident = await withTransaction(async (client) => {
      const id = await nextIncidentId(client)
      const { rows } = await client.query(
        `INSERT INTO incidents (id, event_id, area, severity, assigned_team, status, description)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [id, DEFAULT_EVENT_ID, area, severity, assignedTeam, status, description]
      )
      return rows[0]
    })
    res.status(201).json(toIncident(incident))
  } catch (err) {
    console.error('Failed to create incident:', err)
    res.status(500).json({ error: 'Gagal membuat insiden.' })
  }
})

// PUT /api/incidents/:id  (Omit<Incident, 'id' | 'createdAt'>)
router.put('/:id', async (req, res) => {
  const validationError = validateInput(req.body)
  if (validationError) return res.status(400).json({ error: validationError })

  const { area, severity, assignedTeam, status, description } = req.body
  try {
    const { rows } = await query(
      `UPDATE incidents
       SET area = $1, severity = $2, assigned_team = $3, status = $4, description = $5, updated_at = now()
       WHERE id = $6
       RETURNING *`,
      [area, severity, assignedTeam, status, description, req.params.id]
    )
    if (!rows[0]) return res.status(404).json({ error: 'Insiden tidak ditemukan.' })
    res.json(toIncident(rows[0]))
  } catch (err) {
    console.error('Failed to update incident:', err)
    res.status(500).json({ error: 'Gagal memperbarui insiden.' })
  }
})

// DELETE /api/incidents/:id
router.delete('/:id', async (req, res) => {
  try {
    const { rowCount } = await query('DELETE FROM incidents WHERE id = $1', [req.params.id])
    if (!rowCount) return res.status(404).json({ error: 'Insiden tidak ditemukan.' })
    res.status(204).end()
  } catch (err) {
    console.error('Failed to delete incident:', err)
    res.status(500).json({ error: 'Gagal menghapus insiden.' })
  }
})

// PATCH /api/incidents/:id/status  { status }
router.patch('/:id/status', async (req, res) => {
  const { status } = req.body || {}
  if (!VALID_STATUSES.includes(status)) return res.status(400).json({ error: 'Status insiden tidak valid.' })

  try {
    const { rows } = await query(
      `UPDATE incidents SET status = $1, updated_at = now() WHERE id = $2 RETURNING *`,
      [status, req.params.id]
    )
    if (!rows[0]) return res.status(404).json({ error: 'Insiden tidak ditemukan.' })
    res.json(toIncident(rows[0]))
  } catch (err) {
    console.error('Failed to set incident status:', err)
    res.status(500).json({ error: 'Gagal mengubah status insiden.' })
  }
})

// PATCH /api/incidents/:id/assign  { team }
// Mirrors incidentStore.assignTeam: assigning a team also bumps status from
// "new" to "assigned".
router.patch('/:id/assign', async (req, res) => {
  const { team } = req.body || {}
  if (!team) return res.status(400).json({ error: 'Tim wajib diisi.' })

  try {
    const { rows } = await query(
      `UPDATE incidents
       SET assigned_team = $1,
           status = CASE WHEN status = 'new' THEN 'assigned' ELSE status END,
           updated_at = now()
       WHERE id = $2
       RETURNING *`,
      [team, req.params.id]
    )
    if (!rows[0]) return res.status(404).json({ error: 'Insiden tidak ditemukan.' })
    res.json(toIncident(rows[0]))
  } catch (err) {
    console.error('Failed to assign team:', err)
    res.status(500).json({ error: 'Gagal menugaskan tim.' })
  }
})

export default router
