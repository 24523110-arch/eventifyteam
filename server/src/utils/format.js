// Small formatting helpers shared by the route handlers. Kept dependency-free
// (no locale/date libraries) so the server has no extra install surface.

const MONTHS_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
const EVENT_TIMEZONE = 'Asia/Jakarta'

// Matches the "19 Jun 2026, 19:42" format previously produced client-side.
export function formatIndoDateTime(dateInput) {
  if (!dateInput) return 'Belum pernah login'
  const d = new Date(dateInput)
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: EVENT_TIMEZONE,
    day: '2-digit',
    month: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  const parts = Object.fromEntries(fmt.formatToParts(d).map((p) => [p.type, p.value]))
  const day = parseInt(parts.day, 10)
  const month = MONTHS_ID[parseInt(parts.month, 10) - 1]
  return `${day} ${month} ${parts.year}, ${parts.hour}:${parts.minute}`
}

// Matches the "HH:MM" clock strings used for incident/notification timestamps.
export function formatClockTime(dateInput = new Date()) {
  const d = new Date(dateInput)
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: EVENT_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  const parts = Object.fromEntries(fmt.formatToParts(d).map((p) => [p.type, p.value]))
  return `${parts.hour}:${parts.minute}`
}

// Matches the "20:14:02" activity-feed timestamps (clock time with seconds).
export function formatClockSeconds(dateInput = new Date()) {
  const d = new Date(dateInput)
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: EVENT_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
  const parts = Object.fromEntries(fmt.formatToParts(d).map((p) => [p.type, p.value]))
  return `${parts.hour}:${parts.minute}:${parts.second}`
}

// Matches userStore's initials() helper (first letter of the first two words).
export function initials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
}
