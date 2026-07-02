import { Router } from 'express'
import { query, resolveActiveEventId } from '../db/pool.js'

const router = Router()

// Which notification categories each role sees when a notification isn't
// explicitly targeted (target_role IS NULL). Role-specific bell feeds.
const ROLE_CATEGORIES = {
  manager: ['finance', 'ticket', 'system'],
  admin: ['vendor', 'ticket', 'system'],
  security: ['security', 'system'],
}

// Shared WHERE fragment: a notification is visible to a role when it is
// explicitly targeted to that role, or untargeted and in the role's categories.
const VISIBLE_TO_ROLE = `(target_role = $2 OR (target_role IS NULL AND category = ANY($3)))`
const roleParams = (role) => [role, ROLE_CATEGORIES[role] ?? ['system']]

function toNotification(row) {
  return {
    id: row.id,
    category: row.category,
    priority: row.priority,
    title: row.title,
    message: row.message,
    time: row.time_label,
    read: row.is_read,
  }
}

function toActivityItem(row) {
  return {
    id: row.id,
    time: row.time_label,
    message: row.message,
    type: row.category,
  }
}

// GET /api/notifications -> { notifications, activityFeed }
// Bell feed is scoped to the caller's role; the activity feed stays shared.
router.get('/', async (req, res) => {
  try {
    const eventId = await resolveActiveEventId()
    const [notifications, activity] = await Promise.all([
      query(
        `SELECT * FROM notifications WHERE event_id = $1 AND ${VISIBLE_TO_ROLE} ORDER BY created_at DESC`,
        [eventId, ...roleParams(req.user.role)]
      ),
      query(
        `SELECT * FROM activity_feed WHERE event_id = $1 ORDER BY created_at DESC`,
        [eventId]
      ),
    ])
    res.json({
      notifications: notifications.rows.map(toNotification),
      activityFeed: activity.rows.map(toActivityItem),
    })
  } catch (err) {
    console.error('Failed to list notifications:', err)
    res.status(500).json({ error: 'Gagal memuat notifikasi.' })
  }
})

// PATCH /api/notifications/:id/read
router.patch('/:id/read', async (req, res) => {
  try {
    const { rows } = await query(
      `UPDATE notifications SET is_read = TRUE WHERE id = $1 RETURNING *`,
      [req.params.id]
    )
    if (!rows[0]) return res.status(404).json({ error: 'Notifikasi tidak ditemukan.' })
    res.json(toNotification(rows[0]))
  } catch (err) {
    console.error('Failed to mark notification read:', err)
    res.status(500).json({ error: 'Gagal menandai notifikasi.' })
  }
})

// PATCH /api/notifications/read-all — only the caller's own role feed
router.patch('/read-all', async (req, res) => {
  try {
    const eventId = await resolveActiveEventId()
    await query(
      `UPDATE notifications SET is_read = TRUE WHERE event_id = $1 AND ${VISIBLE_TO_ROLE}`,
      [eventId, ...roleParams(req.user.role)]
    )
    res.status(204).end()
  } catch (err) {
    console.error('Failed to mark all notifications read:', err)
    res.status(500).json({ error: 'Gagal menandai semua notifikasi.' })
  }
})

// DELETE /api/notifications  (clear all in the caller's role feed)
router.delete('/', async (req, res) => {
  try {
    const eventId = await resolveActiveEventId()
    await query(
      `DELETE FROM notifications WHERE event_id = $1 AND ${VISIBLE_TO_ROLE}`,
      [eventId, ...roleParams(req.user.role)]
    )
    res.status(204).end()
  } catch (err) {
    console.error('Failed to clear notifications:', err)
    res.status(500).json({ error: 'Gagal menghapus notifikasi.' })
  }
})

export default router
