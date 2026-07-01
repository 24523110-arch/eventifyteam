// Runs schema.sql then seed.sql against DATABASE_URL.
// Usage: npm run db:migrate  (inside /server)
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { pool } from './pool.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function run() {
  const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8')
  const seedSql = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf-8')

  const client = await pool.connect()
  try {
    console.log('[migrate] Applying schema.sql ...')
    await client.query(schemaSql)
    console.log('[migrate] Applying seed.sql ...')
    await client.query(seedSql)
    console.log('[migrate] Done. Database is ready.')
  } finally {
    client.release()
    await pool.end()
  }
}

run().catch((err) => {
  console.error('[migrate] Failed:', err.message)
  process.exit(1)
})
