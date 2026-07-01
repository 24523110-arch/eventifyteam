// Auth middleware: verifies the Bearer JWT and enforces per-role access.
// Endpoints are no longer open — every /api route (except the public ones
// mounted without requireAuth) needs a valid token, and writes are scoped
// to the role that owns the module.

import { verify } from '../auth/jwt.js'

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  const payload = token ? verify(token) : null
  if (!payload) {
    return res.status(401).json({ error: 'Sesi tidak valid atau telah berakhir. Silakan login kembali.' })
  }
  req.user = { id: payload.sub, role: payload.role }
  next()
}

// Requires the authenticated user to hold one of the given roles (all methods).
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Anda tidak memiliki akses ke sumber daya ini.' })
    }
    next()
  }
}

// Allows GET for any authenticated user (dashboards read cross-module data)
// but restricts writes (POST/PUT/PATCH/DELETE) to the owning role(s).
export function requireRoleForWrites(...roles) {
  return (req, res, next) => {
    if (req.method === 'GET') return next()
    return requireRole(...roles)(req, res, next)
  }
}
