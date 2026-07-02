import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const { Pool } = pg

if (!process.env.DATABASE_URL) {
  console.warn(
    '[db] DATABASE_URL is not set. Copy server/.env.example to server/.env and set it, ' +
      'then run `npm run db:migrate` inside /server.'
  )
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

pool.on('error', (err) => {
  console.error('[db] Unexpected PostgreSQL client error:', err)
})

export function query(text, params) {
  return pool.query(text, params)
}

export async function withTransaction(fn) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await fn(client)
    await client.query('COMMIT')
    return result
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

export const DEFAULT_EVENT_ID = process.env.DEFAULT_EVENT_ID || 'evt-001'

// Resolves which concert every operational module (dashboard, vendors,
// incidents, notifications, field reports, simulator) should read/write.
// Priority: whichever concert is Live > the most recently Ended one (so data
// stays visible right after a concert wraps up) > the most recently touched
// Scheduled one > the seeded default as a last resort on an empty table.
export async function resolveActiveEventId() {
  const { rows } = await pool.query(
    `SELECT id FROM events
     ORDER BY CASE status WHEN 'Live' THEN 0 WHEN 'Ended' THEN 1 ELSE 2 END,
              updated_at DESC
     LIMIT 1`
  )
  return rows[0]?.id ?? DEFAULT_EVENT_ID
}
