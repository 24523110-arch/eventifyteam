// Live data simulator — stands in for the real ticketing platform and crowd
// sensors the PRD assumes are integrated. On every tick it nudges ticket
// sales, attendance, finance and crowd density in the database so the polled
// dashboards actually move in real time, and raises an incident + alert when a
// zone breaches its safe threshold (FR-005 / FR-015 / FR-016).
//
// Toggle with SIMULATOR_ENABLED=false; pace with SIMULATOR_TICK_MS.

import { query, DEFAULT_EVENT_ID } from './db/pool.js'
import { createIncident, setIncidentStatus } from './services/incidents.js'
import { notifyIncident, createActivity } from './notify.js'

const TICK_MS = Number(process.env.SIMULATOR_TICK_MS) || 8000
const AVG_TICKET_PRICE = 750_000 // Rp — used to grow revenue with ticket sales
const AUTO_INCIDENT_COOLDOWN_MS = 45_000

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min

let lastAutoIncidentAt = 0
let timer = null

async function tick() {
  try {
    await simulateTicketSales()
    const zones = await simulateCrowdZones()
    await maybeRaiseCrowdIncident(zones)
    await simulateIncidentProgress()
  } catch (err) {
    console.error('[simulator] tick failed:', err.message)
  }
}

// Ticket sales → grows sold/revenue, shrinks remaining, bumps attendance,
// finance revenue/profit/margin, and the latest trend buckets.
async function simulateTicketSales() {
  const sold = randInt(4, 35)
  const revenueDelta = sold * AVG_TICKET_PRICE

  // LEAST(...) keeps us from overselling once remaining hits 0; every SET
  // expression reads the pre-update row, so `remaining` is the old value.
  const { rows } = await query(
    `UPDATE ticket_summary
       SET sold      = sold + LEAST($2, remaining),
           revenue   = revenue + LEAST($2, remaining) * $3,
           remaining = GREATEST(remaining - $2, 0)
     WHERE event_id = $1
     RETURNING LEAST($2, remaining) AS actual_sold`,
    [DEFAULT_EVENT_ID, sold, AVG_TICKET_PRICE]
  )
  const actualSold = rows[0] ? Number(rows[0].actual_sold) : 0
  if (actualSold <= 0) return // sold out — nothing more to move

  const actualRevenue = actualSold * AVG_TICKET_PRICE

  await Promise.all([
    query(
      `UPDATE events SET attendance = LEAST(attendance + $2, capacity) WHERE id = $1`,
      [DEFAULT_EVENT_ID, randInt(2, Math.max(2, Math.round(actualSold * 0.8)))]
    ),
    query(
      `UPDATE finance_summary
         SET revenue = revenue + $2,
             profit  = (revenue + $2) - expenses,
             margin  = ROUND((revenue + $2 - expenses) / NULLIF(revenue + $2, 0) * 100, 2)
       WHERE event_id = $1`,
      [DEFAULT_EVENT_ID, actualRevenue]
    ),
    query(
      `UPDATE revenue_trend
         SET tickets_sold = tickets_sold + $2,
             revenue      = revenue + $3
       WHERE event_id = $1
         AND sort_order = (SELECT MAX(sort_order) FROM revenue_trend WHERE event_id = $1)`,
      [DEFAULT_EVENT_ID, actualSold, actualRevenue / 1_000_000]
    ),
    query(
      `UPDATE hourly_sales
         SET tickets = tickets + $2
       WHERE event_id = $1
         AND sort_order = (SELECT MAX(sort_order) FROM hourly_sales WHERE event_id = $1)`,
      [DEFAULT_EVENT_ID, actualSold]
    ),
  ])
}

// Random-walks each zone's occupancy and recomputes its status band. Returns
// the updated zones so the caller can react to any that turned critical.
async function simulateCrowdZones() {
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
    [DEFAULT_EVENT_ID]
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
      [DEFAULT_EVENT_ID, Math.max(0, Math.min(100, density))]
    )
  }
  return rows
}

// When a zone is critical, occasionally auto-file an incident (rate-limited so
// the feed doesn't flood) and raise the matching security alert.
async function maybeRaiseCrowdIncident(zones) {
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
    DEFAULT_EVENT_ID
  )
  await notifyIncident(incident)
  lastAutoIncidentAt = Date.now()
}

// Advances a random open incident one step toward resolution, so response and
// resolution times accumulate for the metrics endpoint (a security team would
// be acknowledging and clearing incidents throughout the event).
const NEXT_STATUS = { new: 'assigned', assigned: 'in_progress', in_progress: 'resolved', escalated: 'resolved' }

async function simulateIncidentProgress() {
  if (Math.random() > 0.4) return
  const { rows } = await query(
    `SELECT id, status FROM incidents
      WHERE event_id = $1 AND status NOT IN ('resolved', 'closed')
      ORDER BY random() LIMIT 1`,
    [DEFAULT_EVENT_ID]
  )
  const incident = rows[0]
  const next = incident && NEXT_STATUS[incident.status]
  if (next) await setIncidentStatus(incident.id, next)
}

export function startSimulator() {
  if (process.env.SIMULATOR_ENABLED === 'false') {
    console.log('[simulator] disabled (SIMULATOR_ENABLED=false)')
    return
  }
  if (timer) return
  timer = setInterval(tick, TICK_MS)
  if (typeof timer.unref === 'function') timer.unref() // don't keep the process alive on its own
  console.log(`[simulator] live feed running every ${TICK_MS}ms`)
  createActivity({ category: 'system', message: 'Live data feed dimulai.' }).catch(() => {})
}
