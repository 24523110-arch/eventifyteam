// Live data simulator — OFF by default. Eventify no longer pretends to have
// integrated crowd sensors: crowd-zone occupancy is a static snapshot in the
// database, incidents are filed by the Security Team, and ticket/finance/
// attendance figures are manual report entries (Admin/EO via PUT /api/finance
// and /api/ticket-sales, Security via PUT /api/attendance). Nothing changes
// unless a person changes it.
//
// This module is kept only as an opt-in demo/stress tool: set
// SIMULATOR_ENABLED=true to random-walk crowd density (and auto-file
// incidents on critical zones) against whichever concert is 'Live';
// pace with SIMULATOR_TICK_MS.

import { query } from './db/pool.js'
import { createIncident, setIncidentStatus } from './services/incidents.js'
import { notifyIncident, createActivity } from './notify.js'

const TICK_MS = Number(process.env.SIMULATOR_TICK_MS) || 8000
const AUTO_INCIDENT_COOLDOWN_MS = 45_000

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min

let lastAutoIncidentAt = 0
let timer = null

async function getLiveEventId() {
  const { rows } = await query(`SELECT id FROM events WHERE status = 'Live' ORDER BY updated_at DESC LIMIT 1`)
  return rows[0]?.id ?? null
}

async function tick() {
  try {
    const eventId = await getLiveEventId()
    if (!eventId) return
    const zones = await simulateCrowdZones(eventId)
    await maybeRaiseCrowdIncident(zones, eventId)
    await simulateIncidentProgress(eventId)
  } catch (err) {
    console.error('[simulator] tick failed:', err.message)
  }
}

// Random-walks each zone's occupancy and recomputes its status band. Returns
// the updated zones so the caller can react to any that turned critical.
async function simulateCrowdZones(eventId) {
  const { rows } = await query(
    `WITH moved AS (
       SELECT id,
              capacity,
              GREATEST(
                0,
                LEAST(
                  capacity,
                  current + (floor(random() * (0.11 * capacity + 1)) - floor(0.045 * capacity))::int
                )
              ) AS new_current
       FROM crowd_zones
       WHERE event_id = $1
     )
     UPDATE crowd_zones z
        SET current = m.new_current,
            status = (CASE
              WHEN m.capacity = 0 THEN 'safe'
              WHEN m.new_current::float / m.capacity >= 0.90 THEN 'critical'
              WHEN m.new_current::float / m.capacity >= 0.70 THEN 'busy'
              ELSE 'safe'
            END)::crowd_zone_status,
            updated_at = now()
       FROM moved m
      WHERE z.id = m.id
      RETURNING z.id, z.name, z.current, z.capacity, z.status`,
    [eventId]
  )

  // Keep the density trend's latest point in step with overall occupancy.
  const totalCap = rows.reduce((s, z) => s + z.capacity, 0)
  const totalCur = rows.reduce((s, z) => s + z.current, 0)
  if (totalCap > 0) {
    const density = Math.round((totalCur / totalCap) * 100)
    await query(
      `UPDATE density_trend
         SET density = $2
       WHERE event_id = $1
         AND sort_order = (SELECT MAX(sort_order) FROM density_trend WHERE event_id = $1)`,
      [eventId, Math.max(0, Math.min(100, density))]
    )
  }
  return rows
}

// When a zone is critical, occasionally auto-file an incident (rate-limited so
// the feed doesn't flood) and raise the matching security alert.
async function maybeRaiseCrowdIncident(zones, eventId) {
  const critical = zones.filter((z) => z.status === 'critical')
  if (critical.length === 0) return
  if (Date.now() - lastAutoIncidentAt < AUTO_INCIDENT_COOLDOWN_MS) return
  if (Math.random() > 0.5) return // ~50% chance per eligible tick

  const zone = critical[randInt(0, critical.length - 1)]
  const ratio = zone.current / zone.capacity
  const severity = ratio >= 0.97 ? 'critical' : 'high'

  const incident = await createIncident(
    {
      area: zone.name,
      severity,
      status: 'new',
      description: `Kepadatan ${zone.name} melebihi ambang aman (${zone.current}/${zone.capacity}, ${Math.round(
        ratio * 100
      )}%).`,
    },
    eventId
  )
  await notifyIncident(incident)
  lastAutoIncidentAt = Date.now()
}

// Advances a random open incident one step toward resolution, so response and
// resolution times accumulate for the metrics endpoint (a security team would
// be acknowledging and clearing incidents throughout the event).
const NEXT_STATUS = { new: 'assigned', assigned: 'in_progress', in_progress: 'resolved', escalated: 'resolved' }

async function simulateIncidentProgress(eventId) {
  if (Math.random() > 0.4) return
  const { rows } = await query(
    `SELECT id, status FROM incidents
      WHERE event_id = $1 AND status NOT IN ('resolved', 'closed')
      ORDER BY random() LIMIT 1`,
    [eventId]
  )
  const incident = rows[0]
  const next = incident && NEXT_STATUS[incident.status]
  if (next) await setIncidentStatus(incident.id, next)
}

export function startSimulator() {
  if (process.env.SIMULATOR_ENABLED !== 'true') {
    console.log('[simulator] disabled — crowd data is a static snapshot (set SIMULATOR_ENABLED=true to opt in)')
    return
  }
  if (timer) return
  timer = setInterval(tick, TICK_MS)
  if (typeof timer.unref === 'function') timer.unref() // don't keep the process alive on its own
  console.log(`[simulator] live feed running every ${TICK_MS}ms`)
  createActivity({ category: 'system', message: 'Live data feed dimulai.' }).catch(() => {})
}
