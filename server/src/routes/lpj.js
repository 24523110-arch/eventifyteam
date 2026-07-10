// LPJ (Laporan Pertanggungjawaban) — collaborative report routes.
//
// Unlike other modules, one resource is written by TWO roles (admin fills 11
// sections, security fills 3) and reviewed by a third (manager), so role
// checks are data-driven per section here instead of a blanket
// requireRoleForWrites at the mount point (see lpj/registry.js).

import { Router } from 'express'
import { query, withTransaction, resolveActiveEventId } from '../db/pool.js'
import { LPJ_SECTIONS, SECTION_BY_KEY } from '../lpj/registry.js'
import { generateLpjNarrative } from '../lpj/narrative.js'
import { buildLpjPdf } from '../lpj/pdf.js'
import { buildLpjDocx } from '../lpj/docx.js'
import { createNotification } from '../notify.js'

const router = Router()

function toReport(row, sections = null) {
  const out = {
    id: row.id,
    concertName: row.concert_name,
    theme: row.theme,
    location: row.location,
    eventDate: row.event_date,
    eventTime: row.event_time,
    organizer: row.organizer,
    description: row.description,
    coverImage: row.cover_image,
    status: row.status,
    narrative: row.narrative,
    narrativeSource: row.narrative_source,
    approvedBy: row.approved_by,
    approvedAt: row.approved_at,
    createdAt: row.created_at,
  }
  if (sections) {
    out.sections = sections.map((s) => ({
      key: s.section_key,
      ownerRole: s.owner_role,
      label: SECTION_BY_KEY[s.section_key]?.label ?? s.section_key,
      group: SECTION_BY_KEY[s.section_key]?.group ?? 'Lainnya',
      data: s.data,
      status: s.status,
      managerNote: s.manager_note,
      submittedAt: s.submitted_at,
    }))
  }
  return out
}

// Sends a bell notification without ever failing the request (notifications
// are event-scoped; LPJ isn't, so we pin them to the active concert).
async function notifySafe({ title, message, targetRole, priority = 'medium' }) {
  try {
    const eventId = await resolveActiveEventId()
    await createNotification({ category: 'system', priority, title, message, targetRole, eventId })
  } catch (err) {
    console.error('LPJ notification failed (continuing):', err.message)
  }
}

async function loadReport(id) {
  const [reportRes, sectionsRes] = await Promise.all([
    query('SELECT * FROM lpj_reports WHERE id = $1', [id]),
    query('SELECT * FROM lpj_sections WHERE report_id = $1', [id]),
  ])
  const report = reportRes.rows[0]
  if (!report) return null
  return { report, sections: sectionsRes.rows }
}

// Recomputes the parent report's status from its sections. Approved/Generated
// are terminal-ish states owned by the manager and never auto-downgraded here
// except when a section is returned/edited (handled by callers).
function deriveStatus(sections) {
  const all = sections.length
  const submitted = sections.filter((s) => s.status === 'Submitted').length
  const touched = sections.filter((s) => s.status !== 'Draft').length
  if (submitted === all) return 'Waiting Manager Review'
  if (touched > 0) return 'In Progress'
  return 'Draft'
}

// GET /api/lpj/active — the active concert's report (+sections), or
// { report: null } when the Admin/EO hasn't created one yet. Every page
// (Report Management, Crowd Monitoring/Incident Center panels, Manager
// Reports) works against this single event-scoped report.
router.get('/active', async (_req, res) => {
  try {
    const eventId = await resolveActiveEventId()
    const { rows } = await query('SELECT * FROM lpj_reports WHERE event_id = $1', [eventId])
    if (!rows[0]) return res.json({ report: null, eventId })
    const { rows: sections } = await query('SELECT * FROM lpj_sections WHERE report_id = $1', [rows[0].id])
    res.json({ report: toReport(rows[0], sections), eventId })
  } catch (err) {
    console.error('Failed to load active LPJ report:', err)
    res.status(500).json({ error: 'Gagal memuat laporan konser aktif.' })
  }
})

// GET /api/lpj — list for every role (each page filters what it can act on)
router.get('/', async (_req, res) => {
  try {
    const { rows } = await query(
      `SELECT r.*,
              (SELECT COUNT(*) FROM lpj_sections s WHERE s.report_id = r.id AND s.status = 'Submitted') AS submitted_count,
              (SELECT COUNT(*) FROM lpj_sections s WHERE s.report_id = r.id) AS section_count
       FROM lpj_reports r ORDER BY r.created_at DESC`
    )
    res.json(rows.map((r) => ({
      ...toReport(r),
      narrative: undefined,
      coverImage: undefined,
      progress: { submitted: Number(r.submitted_count), total: Number(r.section_count) },
    })))
  } catch (err) {
    console.error('Failed to list LPJ reports:', err)
    res.status(500).json({ error: 'Gagal memuat daftar laporan LPJ.' })
  }
})

// POST /api/lpj — Admin/EO creates a report; sections are provisioned
router.post('/', async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Hanya Admin/Event Organizer yang dapat membuat laporan LPJ.' })
  }
  const { concertName, theme = '', location = '', eventDate = '', eventTime = '', organizer = '', description = '', coverImage = '' } = req.body || {}
  if (!concertName || !location || !eventDate || !organizer) {
    return res.status(400).json({ error: 'Nama konser, lokasi, tanggal, dan penyelenggara wajib diisi.' })
  }

  try {
    // One report per concert — bound to whichever concert is active now.
    const eventId = await resolveActiveEventId()
    const { rows: existing } = await query('SELECT id FROM lpj_reports WHERE event_id = $1', [eventId])
    if (existing[0]) {
      return res.status(409).json({ error: 'Laporan untuk konser aktif sudah ada.' })
    }

    const id = `lpj-${Date.now()}`
    const report = await withTransaction(async (client) => {
      const { rows } = await client.query(
        `INSERT INTO lpj_reports (id, event_id, concert_name, theme, location, event_date, event_time, organizer, description, cover_image, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
        [id, eventId, concertName, theme, location, eventDate, eventTime, organizer, description, coverImage, req.user.id]
      )
      for (const s of LPJ_SECTIONS) {
        await client.query(
          `INSERT INTO lpj_sections (report_id, section_key, owner_role) VALUES ($1, $2, $3)`,
          [id, s.key, s.owner]
        )
      }
      return rows[0]
    })

    await notifySafe({
      title: 'Draft LPJ baru dibuat',
      message: `LPJ "${concertName}" dibuat — bagian keamanan menunggu diisi Security Team.`,
      targetRole: 'security',
    })

    res.status(201).json(toReport(report))
  } catch (err) {
    console.error('Failed to create LPJ report:', err)
    res.status(500).json({ error: 'Gagal membuat laporan LPJ.' })
  }
})

// GET /api/lpj/:id — full detail (report + all sections)
router.get('/:id', async (req, res) => {
  try {
    const loaded = await loadReport(req.params.id)
    if (!loaded) return res.status(404).json({ error: 'Laporan LPJ tidak ditemukan.' })
    res.json(toReport(loaded.report, loaded.sections))
  } catch (err) {
    console.error('Failed to load LPJ report:', err)
    res.status(500).json({ error: 'Gagal memuat laporan LPJ.' })
  }
})

// DELETE /api/lpj/:id — Admin can discard a report that isn't approved yet
router.delete('/:id', async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Hanya Admin/EO yang dapat menghapus laporan.' })
  try {
    const { rowCount } = await query(`DELETE FROM lpj_reports WHERE id = $1 AND status <> 'Approved'`, [req.params.id])
    if (!rowCount) return res.status(404).json({ error: 'Laporan tidak ditemukan atau sudah disetujui (tidak bisa dihapus).' })
    res.status(204).end()
  } catch (err) {
    console.error('Failed to delete LPJ report:', err)
    res.status(500).json({ error: 'Gagal menghapus laporan LPJ.' })
  }
})

// PUT /api/lpj/:id/sections/:key — the owning role saves its section data
router.put('/:id/sections/:key', async (req, res) => {
  const def = SECTION_BY_KEY[req.params.key]
  if (!def) return res.status(404).json({ error: 'Bagian laporan tidak dikenal.' })
  if (req.user.role !== def.owner) {
    return res.status(403).json({ error: `Bagian "${def.label}" hanya dapat diisi oleh role ${def.owner}.` })
  }

  try {
    const loaded = await loadReport(req.params.id)
    if (!loaded) return res.status(404).json({ error: 'Laporan LPJ tidak ditemukan.' })
    if (loaded.report.status === 'Approved') {
      return res.status(409).json({ error: 'Laporan sudah disetujui dan tidak dapat diubah lagi.' })
    }

    const { rows } = await query(
      `UPDATE lpj_sections
          SET data = $3, status = 'In Progress', updated_at = now()
        WHERE report_id = $1 AND section_key = $2
        RETURNING *`,
      [req.params.id, req.params.key, JSON.stringify(req.body?.data ?? {})]
    )

    // Editing after generation invalidates review state back to In Progress.
    const sections = loaded.sections.map((s) => (s.section_key === req.params.key ? rows[0] : s))
    await query(`UPDATE lpj_reports SET status = $2, updated_at = now() WHERE id = $1`, [req.params.id, deriveStatus(sections)])

    res.json({ key: req.params.key, status: rows[0].status, data: rows[0].data })
  } catch (err) {
    console.error('Failed to save LPJ section:', err)
    res.status(500).json({ error: 'Gagal menyimpan bagian laporan.' })
  }
})

// POST /api/lpj/:id/submit — admin/security submits ALL of its own sections
router.post('/:id/submit', async (req, res) => {
  if (!['admin', 'security'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Hanya Admin/EO atau Security Team yang dapat mengirim laporan.' })
  }
  try {
    const loaded = await loadReport(req.params.id)
    if (!loaded) return res.status(404).json({ error: 'Laporan LPJ tidak ditemukan.' })
    if (loaded.report.status === 'Approved') {
      return res.status(409).json({ error: 'Laporan sudah disetujui.' })
    }

    await query(
      `UPDATE lpj_sections SET status = 'Submitted', submitted_at = now(), updated_at = now()
        WHERE report_id = $1 AND owner_role = $2`,
      [req.params.id, req.user.role]
    )
    const { rows: sections } = await query('SELECT * FROM lpj_sections WHERE report_id = $1', [req.params.id])
    const status = deriveStatus(sections)
    await query(`UPDATE lpj_reports SET status = $2, updated_at = now() WHERE id = $1`, [req.params.id, status])

    await notifySafe({
      title: req.user.role === 'admin' ? 'Laporan Admin/EO dikirim' : 'Laporan keamanan dikirim',
      message: `${req.user.name} mengirim bagian LPJ "${loaded.report.concert_name}" untuk direview.`,
      targetRole: 'manager',
      priority: 'high',
    })

    res.json({ status })
  } catch (err) {
    console.error('Failed to submit LPJ sections:', err)
    res.status(500).json({ error: 'Gagal mengirim laporan.' })
  }
})

// POST /api/lpj/:id/sections/:key/return — Manager sends a section back
router.post('/:id/sections/:key/return', async (req, res) => {
  if (req.user.role !== 'manager') return res.status(403).json({ error: 'Hanya Manager yang dapat mengembalikan laporan.' })
  const def = SECTION_BY_KEY[req.params.key]
  if (!def) return res.status(404).json({ error: 'Bagian laporan tidak dikenal.' })
  const note = (req.body?.note ?? '').trim()
  if (!note) return res.status(400).json({ error: 'Catatan revisi wajib diisi.' })

  try {
    const { rows } = await query(
      `UPDATE lpj_sections SET status = 'Returned', manager_note = $3, updated_at = now()
        WHERE report_id = $1 AND section_key = $2 RETURNING *`,
      [req.params.id, req.params.key, note]
    )
    if (!rows[0]) return res.status(404).json({ error: 'Laporan tidak ditemukan.' })
    await query(`UPDATE lpj_reports SET status = 'In Progress', updated_at = now() WHERE id = $1`, [req.params.id])

    await notifySafe({
      title: `Bagian LPJ dikembalikan: ${def.label}`,
      message: `Catatan Manager: ${note}`,
      targetRole: def.owner,
      priority: 'high',
    })

    res.json({ key: req.params.key, status: 'Returned', managerNote: note })
  } catch (err) {
    console.error('Failed to return LPJ section:', err)
    res.status(500).json({ error: 'Gagal mengembalikan bagian laporan.' })
  }
})

// POST /api/lpj/:id/generate — Manager triggers the AI narrative
router.post('/:id/generate', async (req, res) => {
  if (req.user.role !== 'manager') return res.status(403).json({ error: 'Hanya Manager yang dapat membuat LPJ dengan AI.' })
  try {
    const loaded = await loadReport(req.params.id)
    if (!loaded) return res.status(404).json({ error: 'Laporan LPJ tidak ditemukan.' })

    const notSubmitted = loaded.sections.filter((s) => s.status !== 'Submitted')
    if (notSubmitted.length > 0) {
      const labels = notSubmitted.map((s) => SECTION_BY_KEY[s.section_key]?.label ?? s.section_key)
      return res.status(409).json({
        error: `Belum semua bagian dikirim (${notSubmitted.length}): ${labels.slice(0, 4).join(', ')}${labels.length > 4 ? ', …' : ''}`,
      })
    }

    const sectionsByKey = Object.fromEntries(loaded.sections.map((s) => [s.section_key, s]))
    const { narrative, source } = await generateLpjNarrative(loaded.report, sectionsByKey)

    await query(
      `UPDATE lpj_reports SET narrative = $2, narrative_source = $3, status = 'Generated', updated_at = now() WHERE id = $1`,
      [req.params.id, JSON.stringify(narrative), source]
    )
    res.json({ narrative, source, status: 'Generated' })
  } catch (err) {
    console.error('Failed to generate LPJ narrative:', err)
    res.status(500).json({ error: 'Gagal membuat narasi LPJ. Silakan coba lagi.' })
  }
})

// PUT /api/lpj/:id/narrative — Manager edits the AI-written text
router.put('/:id/narrative', async (req, res) => {
  if (req.user.role !== 'manager') return res.status(403).json({ error: 'Hanya Manager yang dapat mengubah narasi.' })
  try {
    const { rows } = await query(
      `UPDATE lpj_reports SET narrative = $2, updated_at = now() WHERE id = $1 AND status <> 'Approved' RETURNING id`,
      [req.params.id, JSON.stringify(req.body?.narrative ?? {})]
    )
    if (!rows[0]) return res.status(409).json({ error: 'Laporan tidak ditemukan atau sudah disetujui.' })
    res.json({ ok: true })
  } catch (err) {
    console.error('Failed to save LPJ narrative:', err)
    res.status(500).json({ error: 'Gagal menyimpan narasi.' })
  }
})

// POST /api/lpj/:id/approve — Manager signs off
router.post('/:id/approve', async (req, res) => {
  if (req.user.role !== 'manager') return res.status(403).json({ error: 'Hanya Manager yang dapat menyetujui laporan.' })
  const signature = (req.body?.signature ?? '').trim() || req.user.name
  try {
    const loaded = await loadReport(req.params.id)
    if (!loaded) return res.status(404).json({ error: 'Laporan LPJ tidak ditemukan.' })
    if (!loaded.report.narrative) {
      return res.status(409).json({ error: 'Buat narasi LPJ dengan AI terlebih dahulu sebelum menyetujui.' })
    }

    const approvedAt = new Date().toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })
    await query(
      `UPDATE lpj_reports SET status = 'Approved', approved_by = $2, approved_at = $3, updated_at = now() WHERE id = $1`,
      [req.params.id, signature, approvedAt]
    )

    await notifySafe({
      title: 'LPJ disetujui',
      message: `LPJ "${loaded.report.concert_name}" telah disetujui oleh ${signature}.`,
      targetRole: null,
    })

    res.json({ status: 'Approved', approvedBy: signature, approvedAt })
  } catch (err) {
    console.error('Failed to approve LPJ:', err)
    res.status(500).json({ error: 'Gagal menyetujui laporan.' })
  }
})

// GET /api/lpj/:id/export/:format — pdf | docx (any authed role may download)
router.get('/:id/export/:format', async (req, res) => {
  const { format } = req.params
  if (!['pdf', 'docx'].includes(format)) return res.status(400).json({ error: 'Format ekspor tidak dikenal.' })
  try {
    const loaded = await loadReport(req.params.id)
    if (!loaded) return res.status(404).json({ error: 'Laporan LPJ tidak ditemukan.' })

    const sectionsByKey = Object.fromEntries(loaded.sections.map((s) => [s.section_key, s]))
    const buffer = format === 'pdf'
      ? await buildLpjPdf(loaded.report, sectionsByKey, loaded.report.narrative)
      : await buildLpjDocx(loaded.report, sectionsByKey, loaded.report.narrative)

    const safeName = loaded.report.concert_name.replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-')
    res.json({ filename: `LPJ-${safeName}.${format}`, fileBase64: buffer.toString('base64') })
  } catch (err) {
    console.error('Failed to export LPJ:', err)
    res.status(500).json({ error: 'Gagal mengekspor laporan.' })
  }
})

export default router
