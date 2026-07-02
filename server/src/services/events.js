// Provisions the operational scaffold (finance, ticketing, crowd zones,
// trend buckets) a freshly-scheduled concert needs so its dashboard and the
// live simulator have real rows to read/mutate the moment it goes Live —
// mirrors the shape seed.sql uses for the demo concert, but at zero.

import { withTransaction } from '../db/pool.js'

const TREND_HOURS = ['14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00']
const SALES_HOURS = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00']
const DAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']
const CHECKIN_STAGES = ['Tickets Sold', 'Gate Scanned', 'Checked In', 'Inside Venue']
const FINANCE_CATEGORIES = ['Vendor', 'Venue', 'Security', 'Marketing', 'Operations']
// Proportional split of total capacity across the standard zone layout.
const ZONE_SPLIT = [
  ['Main Stage', 0.5],
  ['VIP', 0.08],
  ['Gate A', 0.1],
  ['Gate B', 0.1],
  ['Food Court', 0.07],
  ['Parking', 0.15],
]

export async function createEventWithScaffold({ name, venue, date, capacity, currentPerformer = '' }) {
  const id = `evt-${Date.now()}`
  const cap = Number(capacity)

  return withTransaction(async (client) => {
    const { rows } = await client.query(
      `INSERT INTO events (id, name, venue, event_date, status, current_performer, capacity, attendance)
       VALUES ($1, $2, $3, $4, 'Scheduled', $5, $6, 0)
       RETURNING *`,
      [id, name, venue, date, currentPerformer, cap]
    )

    await client.query(`INSERT INTO finance_summary (event_id, revenue, expenses, profit, margin) VALUES ($1, 0, 0, 0, 0)`, [id])

    for (const category of FINANCE_CATEGORIES) {
      await client.query(`INSERT INTO finance_breakdown (event_id, category, amount) VALUES ($1, $2, 0)`, [id, category])
    }

    await client.query(`INSERT INTO ticket_summary (event_id, sold, revenue, refunds, remaining) VALUES ($1, 0, 0, 0, $2)`, [
      id,
      cap,
    ])

    for (let i = 0; i < TREND_HOURS.length; i++) {
      await client.query(
        `INSERT INTO revenue_trend (event_id, time_label, revenue, tickets_sold, sort_order) VALUES ($1, $2, 0, 0, $3)`,
        [id, TREND_HOURS[i], i + 1]
      )
      await client.query(
        `INSERT INTO density_trend (event_id, time_label, density, sort_order) VALUES ($1, $2, 0, $3)`,
        [id, TREND_HOURS[i], i + 1]
      )
    }

    for (let i = 0; i < SALES_HOURS.length; i++) {
      await client.query(
        `INSERT INTO hourly_sales (event_id, hour_label, tickets, sort_order) VALUES ($1, $2, 0, $3)`,
        [id, SALES_HOURS[i], i + 1]
      )
    }

    for (let i = 0; i < DAYS.length; i++) {
      await client.query(`INSERT INTO daily_revenue (event_id, day_label, revenue, sort_order) VALUES ($1, $2, 0, $3)`, [
        id,
        DAYS[i],
        i + 1,
      ])
    }

    for (let i = 0; i < CHECKIN_STAGES.length; i++) {
      await client.query(
        `INSERT INTO checkin_conversion (event_id, stage, value, sort_order) VALUES ($1, $2, 0, $3)`,
        [id, CHECKIN_STAGES[i], i + 1]
      )
    }

    let zoneIdx = 0
    for (const [zoneName, fraction] of ZONE_SPLIT) {
      zoneIdx += 1
      const zoneCap = Math.max(1, Math.round(cap * fraction))
      await client.query(
        `INSERT INTO crowd_zones (id, event_id, name, capacity, current, status) VALUES ($1, $2, $3, $4, 0, 'safe')`,
        [`${id}-z${zoneIdx}`, id, zoneName, zoneCap]
      )
    }

    return rows[0]
  })
}
