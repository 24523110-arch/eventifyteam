// Renders the full LPJ document as a PDF: AI/local narrative for the framing
// chapters, then every section's data exactly as the owning role entered it.

import PDFDocument from 'pdfkit'
import { LPJ_SECTIONS } from './registry.js'
import { financeTotals, ticketTotals } from './narrative.js'

const PURPLE = '#7C3AED'
const DARK = '#1B1630'
const GRAY = '#6B7280'
const LIGHT = '#E5E7EB'
const M = 50 // page margin
const W = 495 // usable width (A4 595 - 2*50)

const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0)
const idr = (v) => `Rp ${num(v).toLocaleString('id-ID')}`
const nfmt = (v) => num(v).toLocaleString('id-ID')

function ensureSpace(doc, needed = 60) {
  if (doc.y > 792 - needed) doc.addPage()
}

function h1(doc, text) {
  ensureSpace(doc, 90)
  doc.moveDown(0.8)
  doc.fillColor(PURPLE).fontSize(14).font('Helvetica-Bold').text(text)
  doc.moveTo(M, doc.y + 3).lineTo(M + W, doc.y + 3).strokeColor(LIGHT).stroke()
  doc.moveDown(0.6)
}

function h2(doc, text) {
  ensureSpace(doc, 70)
  doc.moveDown(0.4)
  doc.fillColor(DARK).fontSize(11.5).font('Helvetica-Bold').text(text)
  doc.moveDown(0.3)
}

function para(doc, text) {
  doc.fillColor(DARK).fontSize(10).font('Helvetica').text(text || '-', { align: 'justify', lineGap: 2 })
  doc.moveDown(0.5)
}

function kv(doc, label, value) {
  ensureSpace(doc)
  doc.fontSize(10).fillColor(GRAY).font('Helvetica').text(label, M, doc.y, { continued: true, width: W })
  doc.fillColor(DARK).font('Helvetica-Bold').text(`  ${value ?? '-'}`, { align: 'right' })
}

// Simple wrapped-text table. columns: [{ label, key, width (fraction), fmt? }]
function table(doc, columns, rows) {
  if (!rows || rows.length === 0) {
    doc.fontSize(9.5).fillColor(GRAY).font('Helvetica-Oblique').text('(Belum ada data.)')
    doc.moveDown(0.4)
    return
  }
  const widths = columns.map((c) => Math.floor(W * c.width))
  const drawRow = (cells, bold = false, fill = null) => {
    ensureSpace(doc, 50)
    const y0 = doc.y
    const heights = cells.map((text, i) =>
      doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(8.5).heightOfString(String(text ?? '-'), { width: widths[i] - 8 })
    )
    const rowH = Math.max(...heights) + 8
    if (fill) doc.rect(M, y0, W, rowH).fill(fill)
    let x = M
    cells.forEach((text, i) => {
      doc.fillColor(bold ? PURPLE : DARK).font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(8.5)
      doc.text(String(text ?? '-'), x + 4, y0 + 4, { width: widths[i] - 8 })
      x += widths[i]
    })
    doc.moveTo(M, y0 + rowH).lineTo(M + W, y0 + rowH).strokeColor(LIGHT).stroke()
    doc.x = M
    doc.y = y0 + rowH
  }
  drawRow(columns.map((c) => c.label), true, '#F5F3FF')
  rows.forEach((r) => drawRow(columns.map((c) => (c.fmt ? c.fmt(r[c.key], r) : r[c.key]))))
  doc.moveDown(0.5)
}

function tryImage(doc, dataUrl, opts) {
  if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image')) return false
  try {
    const buf = Buffer.from(dataUrl.split(',')[1], 'base64')
    ensureSpace(doc, 150)
    doc.image(buf, opts)
    return true
  } catch {
    return false
  }
}

const SEVERITY_LABEL = { low: 'Rendah', medium: 'Sedang', high: 'Tinggi', critical: 'Kritis' }

function renderSection(doc, key, label, data) {
  h1(doc, label)
  switch (key) {
    case 'committee': {
      kv(doc, 'Ketua', data.ketua)
      kv(doc, 'Wakil Ketua', data.wakil)
      kv(doc, 'Sekretaris', data.sekretaris)
      kv(doc, 'Bendahara', data.bendahara)
      doc.moveDown(0.5)
      h2(doc, 'Divisi')
      table(doc, [
        { label: 'Divisi', key: 'nama', width: 0.25 },
        { label: 'Koordinator', key: 'koordinator', width: 0.25 },
        { label: 'Anggota', key: 'anggota', width: 0.5 },
      ], data.divisi)
      break
    }
    case 'timeline':
      table(doc, [
        { label: 'Waktu', key: 'waktu', width: 0.15 },
        { label: 'Kegiatan', key: 'nama', width: 0.3 },
        { label: 'Deskripsi', key: 'deskripsi', width: 0.55 },
      ], data.kegiatan)
      break
    case 'documentation': {
      const rows = data.dokumentasi ?? []
      if (rows.length === 0) para(doc, '(Belum ada dokumentasi.)')
      rows.forEach((d, i) => {
        ensureSpace(doc, 160)
        doc.fontSize(9.5).fillColor(DARK).font('Helvetica-Bold').text(`${i + 1}. [${d.kategori || 'Umum'}] ${d.caption || ''}`)
        if (d.videoUrl) doc.fontSize(9).fillColor(GRAY).font('Helvetica').text(`Video: ${d.videoUrl}`)
        if (tryImage(doc, d.foto, { fit: [220, 140] })) doc.moveDown(0.3)
        doc.moveDown(0.3)
      })
      break
    }
    case 'finance': {
      const t = financeTotals({ finance: { data } })
      h2(doc, 'Pemasukan')
      table(doc, [
        { label: 'Sumber', key: 'sumber', width: 0.35 },
        { label: 'Jumlah', key: 'jumlah', width: 0.25, fmt: idr },
        { label: 'Keterangan', key: 'keterangan', width: 0.4 },
      ], data.pemasukan)
      h2(doc, 'Pengeluaran')
      table(doc, [
        { label: 'Kategori', key: 'kategori', width: 0.35 },
        { label: 'Jumlah', key: 'jumlah', width: 0.25, fmt: idr },
        { label: 'Keterangan', key: 'keterangan', width: 0.4 },
      ], data.pengeluaran)
      kv(doc, 'Total Pemasukan', idr(t.income))
      kv(doc, 'Total Pengeluaran', idr(t.expense))
      kv(doc, t.net >= 0 ? 'Laba' : 'Rugi', idr(Math.abs(t.net)))
      break
    }
    case 'ticket_sales': {
      const t = ticketTotals({ ticket_sales: { data } })
      table(doc, [
        { label: 'Jenis Tiket', key: 'jenis', width: 0.22 },
        { label: 'Harga', key: 'harga', width: 0.18, fmt: idr },
        { label: 'Kuota', key: 'kuota', width: 0.13, fmt: nfmt },
        { label: 'Terjual', key: 'terjual', width: 0.13, fmt: nfmt },
        { label: 'Check-in', key: 'checkin', width: 0.13, fmt: nfmt },
        { label: 'Pendapatan', key: 'harga', width: 0.21, fmt: (_, r) => idr(num(r.harga) * num(r.terjual)) },
      ], data.tiket)
      kv(doc, 'Ticket Sold', nfmt(t.sold))
      kv(doc, 'Ticket Used (Check-in)', nfmt(t.checkin))
      kv(doc, 'No Show', nfmt(Math.max(0, t.sold - t.checkin)))
      kv(doc, 'Total Revenue', idr(t.revenue))
      kv(doc, 'Occupancy Rate', `${t.occupancy}%`)
      break
    }
    case 'evaluation':
      table(doc, [
        { label: 'Hal yang Berjalan Baik', key: 'halBaik', width: 0.22 },
        { label: 'Kendala', key: 'kendala', width: 0.2 },
        { label: 'Penyebab', key: 'penyebab', width: 0.18 },
        { label: 'Solusi', key: 'solusi', width: 0.2 },
        { label: 'Rekomendasi', key: 'rekomendasi', width: 0.2 },
      ], data.evaluasi)
      break
    case 'division_evaluation':
      table(doc, [
        { label: 'Divisi', key: 'divisi', width: 0.16 },
        { label: 'Kelebihan', key: 'kelebihan', width: 0.28 },
        { label: 'Kekurangan', key: 'kekurangan', width: 0.28 },
        { label: 'Saran', key: 'saran', width: 0.28 },
      ], data.divisi)
      break
    case 'attendance':
      kv(doc, 'Total Tiket Terjual', nfmt(data.tiketTerjual))
      kv(doc, 'Total Pengunjung Hadir', nfmt(data.hadir))
      kv(doc, 'VIP', nfmt(data.vip))
      kv(doc, 'Guest', nfmt(data.guest))
      kv(doc, 'Media', nfmt(data.media))
      kv(doc, 'Crew', nfmt(data.crew))
      kv(doc, 'Volunteer', nfmt(data.volunteer))
      break
    case 'media': {
      kv(doc, 'Instagram Reach', nfmt(data.igReach))
      kv(doc, 'Instagram Impression', nfmt(data.igImpression))
      kv(doc, 'TikTok Views', nfmt(data.tiktokViews))
      kv(doc, 'Facebook Reach', nfmt(data.fbReach))
      kv(doc, 'Website Visitor', nfmt(data.webVisitor))
      kv(doc, 'Engagement', nfmt(data.engagement))
      kv(doc, 'Jumlah Posting', nfmt(data.jumlahPosting))
      kv(doc, 'Media Partner', data.mediaPartner || '-')
      const shots = (data.screenshot ?? []).filter((s) => s.gambar)
      if (shots.length) {
        doc.moveDown(0.5)
        h2(doc, 'Screenshot Insight')
        shots.forEach((s) => {
          if (tryImage(doc, s.gambar, { fit: [220, 140] })) {
            doc.fontSize(8.5).fillColor(GRAY).text(s.caption || '')
            doc.moveDown(0.4)
          }
        })
      }
      break
    }
    case 'sponsors':
      table(doc, [
        { label: 'Sponsor', key: 'nama', width: 0.2 },
        { label: 'Level', key: 'level', width: 0.13 },
        { label: 'Nilai', key: 'nilai', width: 0.2, fmt: idr },
        { label: 'Benefit', key: 'benefit', width: 0.29 },
        { label: 'Status Benefit', key: 'statusBenefit', width: 0.18 },
      ], data.sponsor)
      break
    case 'vendors':
      table(doc, [
        { label: 'Vendor', key: 'nama', width: 0.18 },
        { label: 'Jenis', key: 'jenis', width: 0.14 },
        { label: 'PIC', key: 'pic', width: 0.14 },
        { label: 'Nilai Kontrak', key: 'nilaiKontrak', width: 0.18, fmt: idr },
        { label: 'Pembayaran', key: 'statusPembayaran', width: 0.14 },
        { label: 'Evaluasi', key: 'evaluasi', width: 0.22 },
      ], data.vendor)
      break
    case 'security_resources':
      kv(doc, 'Jumlah Security', nfmt(data.security))
      kv(doc, 'Jumlah Polisi', nfmt(data.polisi))
      kv(doc, 'Tim Medis', nfmt(data.medis))
      kv(doc, 'Ambulans', nfmt(data.ambulans))
      kv(doc, 'Pos Keamanan', nfmt(data.pos))
      kv(doc, 'CCTV', nfmt(data.cctv))
      kv(doc, 'Emergency Exit', nfmt(data.emergencyExit))
      break
    case 'incidents':
      table(doc, [
        { label: 'Waktu', key: 'waktu', width: 0.1 },
        { label: 'Lokasi', key: 'lokasi', width: 0.13 },
        { label: 'Jenis', key: 'jenis', width: 0.13 },
        { label: 'Keparahan', key: 'keparahan', width: 0.11, fmt: (v) => SEVERITY_LABEL[v] ?? v },
        { label: 'Kronologi', key: 'kronologi', width: 0.21 },
        { label: 'Penanganan', key: 'penanganan', width: 0.21 },
        { label: 'Status', key: 'status', width: 0.11 },
      ], data.insiden)
      break
    case 'security_stats': {
      kv(doc, 'Total Insiden', nfmt(data.totalInsiden))
      kv(doc, 'Medical Cases', nfmt(data.medicalCases))
      kv(doc, 'Lost and Found', nfmt(data.lostFound))
      kv(doc, 'Emergency Response Time', data.responseTime || '-')
      const bukti = (data.bukti ?? []).filter((b) => b.gambar)
      if (bukti.length) {
        doc.moveDown(0.5)
        h2(doc, 'Foto Bukti')
        bukti.forEach((b) => {
          if (tryImage(doc, b.gambar, { fit: [220, 140] })) {
            doc.fontSize(8.5).fillColor(GRAY).text(b.caption || '')
            doc.moveDown(0.4)
          }
        })
      }
      break
    }
    default:
      para(doc, JSON.stringify(data))
  }
}

export function buildLpjPdf(report, sectionsByKey, narrative) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: M })
    const chunks = []
    doc.on('data', (c) => chunks.push(c))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const n = narrative ?? {}

    // ---- Halaman sampul ----
    doc.moveDown(6)
    doc.fillColor(PURPLE).fontSize(13).font('Helvetica-Bold').text('LAPORAN PERTANGGUNGJAWABAN', { align: 'center' })
    doc.moveDown(0.6)
    doc.fillColor(DARK).fontSize(24).text(report.concert_name.toUpperCase(), { align: 'center' })
    if (report.theme) {
      doc.moveDown(0.3)
      doc.fillColor(GRAY).fontSize(12).font('Helvetica-Oblique').text(`"${report.theme}"`, { align: 'center' })
    }
    doc.moveDown(1)
    if (tryImage(doc, report.cover_image, { fit: [300, 200], align: 'center' })) doc.moveDown(0.6)
    doc.fillColor(DARK).fontSize(11).font('Helvetica').text(`${report.location}`, { align: 'center' })
    doc.text(`${report.event_date} ${report.event_time}`, { align: 'center' })
    doc.moveDown(2)
    doc.fillColor(GRAY).fontSize(10).text('Disusun oleh', { align: 'center' })
    doc.fillColor(DARK).fontSize(12).font('Helvetica-Bold').text(report.organizer || '-', { align: 'center' })

    // ---- Kata pengantar ----
    doc.addPage()
    h1(doc, 'Kata Pengantar')
    para(doc, n.kataPengantar)

    // ---- Daftar isi ----
    h1(doc, 'Daftar Isi')
    const toc = ['Kata Pengantar', 'Pendahuluan', 'Profil Kegiatan Konser',
      ...LPJ_SECTIONS.map((s) => s.label), 'Penutup', 'Lembar Pengesahan', 'Daftar Lampiran']
    toc.forEach((t, i) => {
      ensureSpace(doc)
      doc.fillColor(DARK).fontSize(10).font('Helvetica').text(`${i + 1}. ${t}`)
    })

    // ---- Pendahuluan ----
    h1(doc, 'Pendahuluan')
    h2(doc, 'Latar Belakang')
    para(doc, n.latarBelakang)
    h2(doc, 'Tujuan Kegiatan')
    para(doc, n.tujuanKegiatan)
    h2(doc, 'Tema Konser')
    para(doc, n.temaKonser)

    // ---- Profil kegiatan ----
    h1(doc, 'Profil Kegiatan Konser')
    kv(doc, 'Nama Konser', report.concert_name)
    kv(doc, 'Tema', report.theme || '-')
    kv(doc, 'Lokasi', report.location)
    kv(doc, 'Tanggal', report.event_date)
    kv(doc, 'Waktu', report.event_time)
    kv(doc, 'Penyelenggara', report.organizer)
    doc.moveDown(0.4)
    para(doc, n.profilKegiatan || report.description)

    // ---- Section data (as entered by each role) ----
    for (const s of LPJ_SECTIONS) {
      const section = sectionsByKey[s.key]
      renderSection(doc, s.key, s.label, section?.data ?? {})
    }

    // ---- Penutup ----
    h1(doc, 'Penutup')
    para(doc, n.penutup)

    // ---- Lembar pengesahan / tanda tangan ----
    h1(doc, 'Lembar Pengesahan')
    para(doc, `Laporan Pertanggungjawaban ini telah diperiksa dan disetujui pada ${report.approved_at || '(belum disetujui)'}.`)
    doc.moveDown(2.5)
    doc.fillColor(DARK).fontSize(10).font('Helvetica').text('Menyetujui,', M + 300)
    doc.moveDown(2.5)
    doc.font('Helvetica-BoldOblique').fontSize(14).fillColor(PURPLE).text(report.approved_by || '_________________', M + 300)
    doc.moveTo(M + 300, doc.y + 2).lineTo(M + W, doc.y + 2).strokeColor(DARK).stroke()
    doc.font('Helvetica').fontSize(9).fillColor(GRAY).text('Manager', M + 300, doc.y + 4)

    // ---- Daftar lampiran ----
    doc.x = M
    h1(doc, 'Daftar Lampiran')
    const attachments = []
    const docs = sectionsByKey.documentation?.data?.dokumentasi ?? []
    docs.forEach((d, i) => attachments.push(`Dokumentasi ${i + 1}: [${d.kategori || 'Umum'}] ${d.caption || d.videoUrl || '-'}`))
    const shots = sectionsByKey.media?.data?.screenshot ?? []
    shots.forEach((s, i) => attachments.push(`Screenshot Insight Media ${i + 1}: ${s.caption || '-'}`))
    const bukti = sectionsByKey.security_stats?.data?.bukti ?? []
    bukti.forEach((b, i) => attachments.push(`Bukti Keamanan ${i + 1}: ${b.caption || '-'}`))
    if (attachments.length === 0) para(doc, '(Tidak ada lampiran.)')
    else attachments.forEach((a, i) => {
      ensureSpace(doc)
      doc.fillColor(DARK).fontSize(10).font('Helvetica').text(`Lampiran ${i + 1} — ${a}`)
    })

    doc.end()
  })
}
