// Shared incident-creation logic used by both the REST route (manual reports
// from the Security team) and the live simulator (auto-generated incidents
// when a crowd zone breaches its safe threshold). Centralised so ID
// generation and the insert stay identical across callers.

import { query, withTransaction, DEFAULT_EVENT_ID } from '../db/pool.js'

// Next "INC-0042" style id. Accepts a transaction client when available so
// the read + insert stay in the same transaction.
export async function nextIncidentId(runner = { query }) {
  const { rows } = await runner.query(`SELECT id FROM incidents WHERE id LIKE 'INC-%'`)
  const max = rows
    .map((r) => parseInt(r.id.replace('INC-', ''), 10))
    .filter((n) => !Number.isNaN(n))
    .reduce((a, b) => Math.max(a, b), 0)
  return `INC-${String(max + 1).padStart(4, '0')}`
}

export async function createIncident(
  { area, severity, assignedTeam = 'Unassigned', status = 'new', description = '' },
  eventId = DEFAULT_EVENT_ID
) {
  return withTransaction(async (client) => {
    const id = await nextIncidentId(client)
    const { rows } = await client.query(
      `INSERT INTO incidents (id, event_id, area, severity, assigned_team, status, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [id, eventId, area, severity, assignedTeam, status, description]
    )
    return rows[0]
  })
}

// Changes an incident's status and stamps the response-time milestones on first
// transition: acknowledged_at when it first leaves "new", resolved_at when it
// first reaches "resolved"/"closed". COALESCE keeps the earliest stamp so the
// metric reflects real elapsed time. Returns the updated row (or undefined).
export async function setIncidentStatus(id, status) {
  const { rows } = await query(
    `UPDATE incidents
       SET status = $1::incident_status,
           acknowledged_at = COALESCE(acknowledged_at, CASE WHEN $1::incident_status <> 'new' THEN now() END),
           resolved_at     = COALESCE(resolved_at, CASE WHEN $1::incident_status IN ('resolved', 'closed') THEN now() END),
           updated_at = now()
     WHERE id = $2
     RETURNING *`,
    [status, id]
  )
  return rows[0]
}

// Response/resolution-time aggregates for one event. Shared by the
// /api/incidents/metrics route and the AI evaluation report (reports.js),
// so both surfaces read from a single query.
export async function getIncidentMetrics(eventId) {
  const { rows } = await query(
    `SELECT
       count(*) AS total_count,
       count(*) FILTER (WHERE acknowledged_at IS NOT NULL) AS acknowledged_count,
       count(*) FILTER (WHERE resolved_at IS NOT NULL)     AS resolved_count,
       avg(EXTRACT(EPOCH FROM (acknowledged_at - created_at)) / 60)
         FILTER (WHERE acknowledged_at IS NOT NULL)        AS avg_response_min,
       avg(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 60)
         FILTER (WHERE resolved_at IS NOT NULL)            AS avg_resolution_min,
       count(*) FILTER (
         WHERE acknowledged_at IS NOT NULL
           AND EXTRACT(EPOCH FROM (acknowledged_at - created_at)) / 60 <= 8
       ) AS under_target_count,
       count(*) FILTER (WHERE severity = 'critical') AS critical_count,
       count(*) FILTER (WHERE severity = 'high')     AS high_count,
       count(*) FILTER (WHERE severity = 'medium')   AS medium_count,
       count(*) FILTER (WHERE severity = 'low')      AS low_count
     FROM incidents
     WHERE event_id = $1`,
    [eventId]
  )
  const r = rows[0]
  const acknowledged = Number(r.acknowledged_count)
  const round1 = (v) => (v === null ? null : Math.round(Number(v) * 10) / 10)
  return {
    targetMinutes: 8,
    totalCount: Number(r.total_count),
    acknowledgedCount: acknowledged,
    resolvedCount: Number(r.resolved_count),
    avgResponseMinutes: round1(r.avg_response_min),
    avgResolutionMinutes: round1(r.avg_resolution_min),
    underTargetPct: acknowledged > 0 ? Math.round((Number(r.under_target_count) / acknowledged) * 100) : null,
    bySeverity: {
      critical: Number(r.critical_count),
      high: Number(r.high_count),
      medium: Number(r.medium_count),
      low: Number(r.low_count),
    },
  }
}
