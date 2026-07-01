import { Router } from 'express'
import { query, DEFAULT_EVENT_ID } from '../db/pool.js'
import { formatClockTime } from '../utils/format.js'
import { createIncident, setIncidentStatus } from '../services/incidents.js'
import { notifyIncident } from '../notify.js'

const router = Router()
const VALID_SEVERITIES = ['low', 'medium', 'high', 'critical']
const VALID_STATUSES = ['new', 'assigned', 'in_progress', 'escalated', 'resolved', 'closed']

function minutesBetween(later, earlier) {
  if (!later || !earlier) return null
  return Math.round(((new Date(later) - new Date(earlier)) / 60000) * 10) / 10
}

function toIncident(row) {
  return {
    id: row.id,
    area: row.area,
    severity: row.severity,
    assignedTeam: row.assigned_team,
    status: row.status,
    createdAt: formatClockTime(row.created_at),
    description: row.description,
    responseMinutes: minutesBetween(row.acknowledged_at, row.created_at),
    resolutionMinutes: minutesBetween(row.resolved_at, row.created_at),
  }
}

function validateInput(body) {
  const { area, severity, description } = body || {}
  if (!area || !severity || description === undefined) return 'Area, tingkat keparahan, dan deskripsi wajib diisi.'
  if (!VALID_SEVERITIES.includes(severity)) return 'Tingkat keparahan tidak valid.'
  if (body.status && !VALID_STATUSES.includes(body.status)) return 'Status insiden tidak valid.'
  return null
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

// GET /api/incidents/metrics — response/resolution-time aggregates for the
// Success Metric "waktu respons insiden < 8 menit". Declared before any
// param routes so it isn't shadowed.
router.get('/metrics', async (_req, res) => {
  try {
    const { rows } = await query(
      `SELECT
         count(*) FILTER (WHERE acknowledged_at IS NOT NULL) AS acknowledged_count,
         count(*) FILTER (WHERE resolved_at IS NOT NULL)     AS resolved_count,
         avg(EXTRACT(EPOCH FROM (acknowledged_at - created_at)) / 60)
           FILTER (WHERE acknowledged_at IS NOT NULL)        AS avg_response_min,
         avg(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 60)
           FILTER (WHERE resolved_at IS NOT NULL)            AS avg_resolution_min,
         count(*) FILTER (
           WHERE acknowledged_at IS NOT NULL
             AND EXTRACT(EPOCH FROM (acknowledged_at - created_at)) / 60 <= 8
         ) AS under_target_count
       FROM incidents
       WHERE event_id = $1`,
      [DEFAULT_EVENT_ID]
    )
    const r = rows[0]
    const acknowledged = Number(r.acknowledged_count)
    const round1 = (v) => (v === null ? null : Math.round(Number(v) * 10) / 10)
    res.json({
      targetMinutes: 8,
      acknowledgedCount: acknowledged,
      resolvedCount: Number(r.resolved_count),
      avgResponseMinutes: round1(r.avg_response_min),
      avgResolutionMinutes: round1(r.avg_resolution_min),
      underTargetPct: acknowledged > 0 ? Math.round((Number(r.under_target_count) / acknowledged) * 100) : null,
    })
  } catch (err) {
    console.error('Failed to load incident metrics:', err)
    res.status(500).json({ error: 'Gagal memuat metrik insiden.' })
  }
})

// POST /api/incidents  (Omit<Incident, 'id' | 'createdAt'>)
router.post('/', async (req, res) => {
  const validationError = validateInput(req.body)
  if (validationError) return res.status(400).json({ error: validationError })

  const { area, severity, assignedTeam = 'Unassigned', status = 'new', description } = req.body

  try {
    const incident = await createIncident(
      { area, severity, assignedTeam, status, description },
      DEFAULT_EVENT_ID
    )
    // FR-008: a reported incident automatically raises a security alert.
    await notifyIncident(incident)
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
       SET area = $1, severity = $2, assigned_team = $3, status = $4::incident_status, description = $5,
           acknowledged_at = COALESCE(acknowledged_at, CASE WHEN $4::incident_status <> 'new' THEN now() END),
           resolved_at     = COALESCE(resolved_at, CASE WHEN $4::incident_status IN ('resolved', 'closed') THEN now() END),
           updated_at = now()
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
    const updated = await setIncidentStatus(req.params.id, status)
    if (!updated) return res.status(404).json({ error: 'Insiden tidak ditemukan.' })
    res.json(toIncident(updated))
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
           acknowledged_at = COALESCE(acknowledged_at, now()),
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
