import { Router } from 'express'
import { query } from '../db/pool.js'
import { formatIndoDateTime } from '../utils/format.js'
import { sign } from '../auth/jwt.js'

const router = Router()

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

// POST /api/auth/login  { email, password, role, rememberMe }
router.post('/login', async (req, res) => {
  const { email, password, role } = req.body || {}

  if (!email || !password || !role) {
    return res.status(400).json({ error: 'Email, password, dan role wajib diisi.' })
  }

  try {
    const { rows } = await query(
      `SELECT id, name, email, role, avatar_initials, status, last_login_at
       FROM app_users
       WHERE email = $1 AND password_hash = crypt($2, password_hash)`,
      [email.toLowerCase(), password]
    )

    const account = rows[0]
    if (!account) {
      return res.status(401).json({ error: 'Email atau password salah. Silakan coba lagi.' })
    }
    if (account.role !== role) {
      return res
        .status(401)
        .json({ error: `Akun ini terdaftar sebagai "${account.role}", bukan role yang dipilih.` })
    }
    if (account.status === 'disabled') {
      return res.status(403).json({ error: 'Akun ini dinonaktifkan. Hubungi administrator.' })
    }

    const { rows: updated } = await query(
      `UPDATE app_users SET last_login_at = now() WHERE id = $1
       RETURNING id, name, email, role, avatar_initials, status, last_login_at`,
      [account.id]
    )

    const token = sign({ sub: updated[0].id, role: updated[0].role })
    res.json({ user: toAppUser(updated[0]), token })
  } catch (err) {
    console.error('Login failed:', err)
    res.status(500).json({ error: 'Gagal login. Silakan coba lagi.' })
  }
})

export default router
