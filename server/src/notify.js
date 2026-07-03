// Server-side notification / activity-feed generator. Lets any part of the
// backend (incident routes, the live simulator) push an alert into the bell
// panel — implementing FR-008 / FR-016 ("kirim notifikasi/alert otomatis").

import { query, DEFAULT_EVENT_ID } from './db/pool.js'
import { formatClockTime, formatClockSeconds } from './utils/format.js'

let counter = 0
function genId(prefix) {
  counter = (counter + 1) % 1_000_000
  return `${prefix}-${Date.now().toString(36)}-${counter.toString(36)}`
}

// Maps an incident's severity onto a notification priority (1:1).
const SEVERITY_TO_PRIORITY = {
  critical: 'critical',
  high: 'high',
  medium: 'medium',
  low: 'low',
}

export async function createNotification({
  category,
  priority,
  title,
  message,
  targetRole = null,
  eventId = DEFAULT_EVENT_ID,
}) {
  const { rows } = await query(
    `INSERT INTO notifications (id, event_id, category, priority, title, message, time_label, target_role)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [genId('ntf'), eventId, category, priority, title, message, formatClockTime(), targetRole]
  )
  return rows[0]
}

export async function createActivity({ category, message, eventId = DEFAULT_EVENT_ID }) {
  await query(
    `INSERT INTO activity_feed (id, event_id, time_label, message, category)
     VALUES ($1, $2, $3, $4, $5)`,
    [genId('act'), eventId, formatClockSeconds(), message, category]
  )
}

// Fires a security alert + activity entry for a freshly created incident.
// Failures are logged but never bubble up — a notification hiccup must not
// fail the incident write that triggered it.
export async function notifyIncident(incident) {
  const priority = SEVERITY_TO_PRIORITY[incident.severity] ?? 'medium'
  try {
    await createNotification({
      eventId: incident.event_id,
      category: 'security',
      priority,
      targetRole: 'security',
      title: `Insiden ${incident.severity} — ${incident.area}`,
      message: incident.description?.trim()
        ? incident.description
        : `Insiden baru dilaporkan di ${incident.area}.`,
    })
    await createActivity({
      eventId: incident.event_id,
      category: 'security',
      message: `Insiden ${incident.id} dibuat di ${incident.area} (${incident.severity}).`,
    })
  } catch (err) {
    console.error('Failed to emit incident notification:', err)
  }
}

// The Event Organizer flips a concert Live/Ended — announce it to everyone
// (system category, untargeted) so every role's bell reflects it.
export async function notifyEventStatus(event) {
  const message =
    event.status === 'Live'
      ? `Monitoring LIVE aktif untuk ${event.name}.`
      : `${event.name} telah selesai — monitoring dihentikan.`
  try {
    await createNotification({ category: 'system', priority: 'medium', title: 'Status Konser', message, eventId: event.id })
    await createActivity({ category: 'system', message, eventId: event.id })
  } catch (err) {
    console.error('Failed to emit event-status notification:', err)
  }
}

