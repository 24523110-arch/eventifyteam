import { Router } from 'express'
import { query, DEFAULT_EVENT_ID } from '../db/pool.js'

const router = Router()

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
router.get('/', async (_req, res) => {
  try {
    const [notifications, activity] = await Promise.all([
      query(
        `SELECT * FROM notifications WHERE event_id = $1 ORDER BY created_at DESC`,
        [DEFAULT_EVENT_ID]
      ),
      query(
        `SELECT * FROM activity_feed WHERE event_id = $1 ORDER BY created_at DESC`,
        [DEFAULT_EVENT_ID]
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

// PATCH /api/notifications/read-all
router.patch('/read-all', async (_req, res) => {
  try {
    await query(`UPDATE notifications SET is_read = TRUE WHERE event_id = $1`, [DEFAULT_EVENT_ID])
    res.status(204).end()
  } catch (err) {
    console.error('Failed to mark all notifications read:', err)
    res.status(500).json({ error: 'Gagal menandai semua notifikasi.' })
  }
})

// DELETE /api/notifications  (clear all)
router.delete('/', async (_req, res) => {
  try {
    await query(`DELETE FROM notifications WHERE event_id = $1`, [DEFAULT_EVENT_ID])
    res.status(204).end()
  } catch (err) {
    console.error('Failed to clear notifications:', err)
    res.status(500).json({ error: 'Gagal menghapus notifikasi.' })
  }
})

export default router
