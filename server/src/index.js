import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

import authRoutes from './routes/auth.js'
import userRoutes from './routes/users.js'
import vendorRoutes from './routes/vendors.js'
import incidentRoutes from './routes/incidents.js'
import dashboardRoutes from './routes/dashboard.js'
import notificationRoutes from './routes/notifications.js'
import reportRoutes from './routes/reports.js'
import referenceRoutes from './routes/reference.js'
import eventsRoutes from './routes/events.js'
import financeRoutes from './routes/finance.js'
import ticketSalesRoutes from './routes/ticketSales.js'
import attendanceRoutes from './routes/attendance.js'
import lpjRoutes from './routes/lpj.js'
import { pool } from './db/pool.js'
import { startSimulator } from './simulator.js'
import { requireAuth, requireRole, requireRoleForWrites } from './middleware/auth.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 4000

app.use(cors())
// 15mb: LPJ sections can carry a handful of base64-embedded photos
// (dokumentasi, logo sponsor, screenshot insight, bukti keamanan).
app.use(express.json({ limit: '15mb' }))

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({ status: 'ok', database: 'connected' })
  } catch (err) {
    res.status(503).json({ status: 'degraded', database: 'unreachable', error: err.message })
  }
})

// Public routes — login issues the token; reference data feeds the login
// role selector before any token exists.
app.use('/api/auth', authRoutes)
app.use('/api/reference', referenceRoutes)

// Authenticated routes. Reads (GET) are allowed for any signed-in user so
// each role's dashboard can aggregate cross-module data; writes are scoped
// to the role that owns the module.
app.use('/api/users', requireAuth, requireRole('manager'), userRoutes)
app.use('/api/vendors', requireAuth, requireRoleForWrites('admin'), vendorRoutes)
app.use('/api/incidents', requireAuth, requireRoleForWrites('security'), incidentRoutes)
app.use('/api/dashboard', requireAuth, dashboardRoutes)
app.use('/api/notifications', requireAuth, notificationRoutes)
app.use('/api/reports', requireAuth, requireRoleForWrites('manager'), reportRoutes)

// Concert schedule: Event Organizer manages ongoing/upcoming/history entries
// and flips a concert Live/Ended. Admin-only, including reads.
app.use('/api/events', requireAuth, requireRole('admin'), eventsRoutes)

// Manual report entry: Admin/EO reports finance totals and ticket counts by
// hand (replaces the old simulator-driven figures); Security reports
// audience attendance (they're the ones physically counting people in).
app.use('/api/finance', requireAuth, requireRole('admin'), financeRoutes)
app.use('/api/ticket-sales', requireAuth, requireRole('admin'), ticketSalesRoutes)
app.use('/api/attendance', requireAuth, requireRole('security'), attendanceRoutes)

// LPJ (Laporan Pertanggungjawaban): collaborative report — admin and
// security each write their own sections, manager reviews/approves, so the
// per-section role checks live inside the route file (data-driven ownership,
// see server/src/lpj/registry.js) instead of a blanket role middleware here.
app.use('/api/lpj', requireAuth, lpjRoutes)

// Fallback error handler for anything that slips past route-level try/catch.
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ error: 'Terjadi kesalahan pada server.' })
})

app.listen(PORT, () => {
  console.log(`Eventify server listening on http://localhost:${PORT}`)
  // Start the live data feed once the HTTP server is up. It self-heals on
  // transient DB errors and is a no-op when SIMULATOR_ENABLED=false.
  startSimulator()
})
