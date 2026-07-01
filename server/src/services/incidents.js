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
