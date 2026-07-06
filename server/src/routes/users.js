import { Router } from 'express'
import { query } from '../db/pool.js'
import { formatIndoDateTime, initials } from '../utils/format.js'

const router = Router()
const VALID_ROLES = ['manager', 'admin', 'security']

function toAppUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    avatarInitials: row.avatar_initials,
    lastLogin: formatIndoDateTime(row.last_login_at),
    status: row.status,
  }
}

function validateInput(body) {
  const { name, email, role } = body || {}
  if (!name || !email || !role) return 'Nama, email, dan role wajib diisi.'
  if (!VALID_ROLES.includes(role)) return 'Role tidak valid.'
  return null
}

function validatePassword(password) {
  if (!password || password.length < 8) return 'Password wajib diisi, minimal 8 karakter.'
  return null
}

// GET /api/users
router.get('/', async (_req, res) => {
  try {
    const { rows } = await query(
      `SELECT id, name, email, role, avatar_initials, status, last_login_at
       FROM app_users ORDER BY created_at ASC`
    )
    res.json(rows.map(toAppUser))
  } catch (err) {
    console.error('Failed to list users:', err)
    res.status(500).json({ error: 'Gagal memuat daftar pengguna.' })
  }
})

// POST /api/users  { name, email, role, password }
router.post('/', async (req, res) => {
  const validationError = validateInput(req.body) || validatePassword(req.body?.password)
  if (validationError) return res.status(400).json({ error: validationError })

  const { name, email, role, password } = req.body
  const id = `u-${Date.now()}`

  try {
    const { rows } = await query(
      `INSERT INTO app_users (id, name, email, password_hash, role, avatar_initials, status)
       VALUES ($1, $2, $3, crypt($4, gen_salt('bf')), $5, $6, 'active')
       RETURNING id, name, email, role, avatar_initials, status, last_login_at`,
      [id, name, email, password, role, initials(name)]
    )
    res.status(201).json(toAppUser(rows[0]))
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Email sudah terdaftar.' })
    }
    console.error('Failed to create user:', err)
    res.status(500).json({ error: 'Gagal membuat pengguna.' })
  }
})

// PUT /api/users/:id  { name, email, role }
router.put('/:id', async (req, res) => {
  const validationError = validateInput(req.body)
  if (validationError) return res.status(400).json({ error: validationError })

  const { name, email, role } = req.body
  try {
    const { rows } = await query(
      `UPDATE app_users SET name = $1, email = $2, role = $3, avatar_initials = $4
       WHERE id = $5
       RETURNING id, name, email, role, avatar_initials, status, last_login_at`,
      [name, email, role, initials(name), req.params.id]
    )
    if (!rows[0]) return res.status(404).json({ error: 'Pengguna tidak ditemukan.' })
    res.json(toAppUser(rows[0]))
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Email sudah terdaftar.' })
    }
    console.error('Failed to update user:', err)
    res.status(500).json({ error: 'Gagal memperbarui pengguna.' })
  }
})

// DELETE /api/users/:id
router.delete('/:id', async (req, res) => {
  try {
    const { rowCount } = await query('DELETE FROM app_users WHERE id = $1', [req.params.id])
    if (!rowCount) return res.status(404).json({ error: 'Pengguna tidak ditemukan.' })
    res.status(204).end()
  } catch (err) {
    console.error('Failed to delete user:', err)
    res.status(500).json({ error: 'Gagal menghapus pengguna.' })
  }
})

// PATCH /api/users/:id/toggle-status
router.patch('/:id/toggle-status', async (req, res) => {
  try {
    const { rows } = await query(
      `UPDATE app_users
       SET status = CASE WHEN status = 'active' THEN 'disabled' ELSE 'active' END
       WHERE id = $1
       RETURNING id, name, email, role, avatar_initials, status, last_login_at`,
      [req.params.id]
    )
    if (!rows[0]) return res.status(404).json({ error: 'Pengguna tidak ditemukan.' })
    res.json(toAppUser(rows[0]))
  } catch (err) {
    console.error('Failed to toggle user status:', err)
    res.status(500).json({ error: 'Gagal mengubah status pengguna.' })
  }
})

export default router
