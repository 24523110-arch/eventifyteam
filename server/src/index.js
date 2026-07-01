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
import { pool } from './db/pool.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 4000

app.use(cors())
app.use(express.json({ limit: '2mb' }))

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({ status: 'ok', database: 'connected' })
  } catch (err) {
    res.status(503).json({ status: 'degraded', database: 'unreachable', error: err.message })
  }
})

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/vendors', vendorRoutes)
app.use('/api/incidents', incidentRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/reports', reportRoutes)

// Fallback error handler for anything that slips past route-level try/catch.
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ error: 'Terjadi kesalahan pada server.' })
})

app.listen(PORT, () => {
  console.log(`Eventify server listening on http://localhost:${PORT}`)
})
