import { Router } from 'express'
import { query } from '../db/pool.js'

const router = Router()

// GET /api/reference -> { roles, securityTeams, vendorCategories }
// Lookup/config data for the frontend forms (login role selector, user
// role dropdown, incident team assignment, vendor category). Served from
// the database so nothing is hardcoded client-side.
router.get('/', async (_req, res) => {
  try {
    const [roles, teams, categories] = await Promise.all([
      query('SELECT value, label, description FROM role_options ORDER BY sort_order'),
      query('SELECT name FROM security_teams ORDER BY name'),
      query('SELECT name FROM vendor_categories ORDER BY sort_order'),
    ])
    res.json({
      roles: roles.rows,
      securityTeams: teams.rows.map((r) => r.name),
      vendorCategories: categories.rows.map((r) => r.name),
    })
  } catch (err) {
    console.error('Failed to load reference data:', err)
    res.status(500).json({ error: 'Gagal memuat data referensi.' })
  }
})

export default router
