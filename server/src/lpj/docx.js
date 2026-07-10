// Renders the LPJ as a .docx (Microsoft Word) document — same structure as
// pdf.js: narrative framing chapters plus every section's data verbatim.

import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell,
  WidthType, ShadingType, AlignmentType, PageBreak, ImageRun,
} from 'docx'
import { LPJ_SECTIONS } from './registry.js'
import { financeTotals, ticketTotals } from './narrative.js'

const NAVY = '5B21B6'
const GRAY = '6B7280'

const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0)
const idr = (v) => `Rp ${num(v).toLocaleString('id-ID')}`
const nfmt = (v) => num(v).toLocaleString('id-ID')

const h1 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_1, spacing: { before: 340, after: 140 },
  children: [new TextRun({ text, bold: true, size: 28, color: NAVY })],
})
const h2 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_2, spacing: { before: 220, after: 100 },
  children: [new TextRun({ text, bold: true, size: 23, color: NAVY })],
})
const para = (text, opts = {}) => new Paragraph({
  spacing: { after: 140 }, alignment: AlignmentType.JUSTIFIED,
  children: [new TextRun({ text: text || '-', size: 21, ...opts })],
})
const kv = (label, value) => new Paragraph({
  spacing: { after: 60 },
  children: [
    new TextRun({ text: `${label}: `, size: 21, color: GRAY }),
    new TextRun({ text: String(value ?? '-'), size: 21, bold: true }),
  ],
})

function tbl(columns, rows, mapRow) {
  const cell = (text, header = false) => new TableCell({
    shading: header ? { type: ShadingType.CLEAR, fill: NAVY } : undefined,
    margins: { top: 60, bottom: 60, left: 90, right: 90 },
    children: [new Paragraph({ children: [new TextRun({ text: String(text ?? '-'), bold: header, size: 18, color: header ? 'FFFFFF' : undefined })] })],
  })
  const bodyRows = (rows ?? []).map((r) => new TableRow({ children: mapRow(r).map((c) => cell(c)) }))
  if (bodyRows.length === 0) return [para('(Belum ada data.)', { italics: true, color: GRAY })]
  return [new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({ children: columns.map((c) => cell(c, true)) }), ...bodyRows],
  }), new Paragraph({ spacing: { after: 140 }, children: [] })]
}

function coverImage(dataUrl) {
  if (!dataUrl || !dataUrl.startsWith('data:image')) return []
  try {
    const type = dataUrl.includes('image/png') ? 'png' : 'jpg'
    const buf = Buffer.from(dataUrl.split(',')[1], 'base64')
    return [new Paragraph({
      alignment: AlignmentType.CENTER, spacing: { after: 200 },
      children: [new ImageRun({ data: buf, type, transformation: { width: 380, height: 250 } })],
    })]
  } catch {
    return []
  }
}

const SEVERITY_LABEL = { low: 'Rendah', medium: 'Sedang', high: 'Tinggi', critical: 'Kritis' }

function sectionChildren(key, data) {
  switch (key) {
    case 'committee':
      return [
        kv('Ketua', data.ketua), kv('Wakil Ketua', data.wakil), kv('Sekretaris', data.sekretaris), kv('Bendahara', data.bendahara),
        h2('Divisi'),
        ...tbl(['Divisi', 'Koordinator', 'Anggota'], data.divisi, (r) => [r.nama, r.koordinator, r.anggota]),
      ]
    case 'timeline':
      return tbl(['Waktu', 'Kegiatan', 'Deskripsi'], data.kegiatan, (r) => [r.waktu, r.nama, r.deskripsi])
    case 'documentation':
      return tbl(['Kategori', 'Caption', 'Video'], data.dokumentasi, (r) => [r.kategori, r.caption, r.videoUrl || (r.foto ? '(foto terlampir di PDF)' : '-')])
    case 'finance': {
      const t = financeTotals({ finance: { data } })
      return [
        h2('Pemasukan'),
        ...tbl(['Sumber', 'Jumlah', 'Keterangan'], data.pemasukan, (r) => [r.sumber, idr(r.jumlah), r.keterangan]),
        h2('Pengeluaran'),
        ...tbl(['Kategori', 'Jumlah', 'Keterangan'], data.pengeluaran, (r) => [r.kategori, idr(r.jumlah), r.keterangan]),
        kv('Total Pemasukan', idr(t.income)), kv('Total Pengeluaran', idr(t.expense)),
        kv(t.net >= 0 ? 'Laba' : 'Rugi', idr(Math.abs(t.net))),
      ]
    }
    case 'ticket_sales': {
      const t = ticketTotals({ ticket_sales: { data } })
      return [
        ...tbl(['Jenis', 'Harga', 'Kuota', 'Terjual', 'Check-in', 'Pendapatan'], data.tiket,
          (r) => [r.jenis, idr(r.harga), nfmt(r.kuota), nfmt(r.terjual), nfmt(r.checkin), idr(num(r.harga) * num(r.terjual))]),
        kv('Ticket Sold', nfmt(t.sold)), kv('Ticket Used (Check-in)', nfmt(t.checkin)),
        kv('No Show', nfmt(Math.max(0, t.sold - t.checkin))), kv('Total Revenue', idr(t.revenue)),
        kv('Occupancy Rate', `${t.occupancy}%`),
      ]
    }
    case 'evaluation':
      return tbl(['Hal Baik', 'Kendala', 'Penyebab', 'Solusi', 'Rekomendasi'], data.evaluasi,
        (r) => [r.halBaik, r.kendala, r.penyebab, r.solusi, r.rekomendasi])
    case 'division_evaluation':
      return tbl(['Divisi', 'Kelebihan', 'Kekurangan', 'Saran'], data.divisi,
        (r) => [r.divisi, r.kelebihan, r.kekurangan, r.saran])
    case 'attendance':
      return [
        kv('Total Tiket Terjual', nfmt(data.tiketTerjual)), kv('Total Pengunjung Hadir', nfmt(data.hadir)),
        kv('VIP', nfmt(data.vip)), kv('Guest', nfmt(data.guest)), kv('Media', nfmt(data.media)),
        kv('Crew', nfmt(data.crew)), kv('Volunteer', nfmt(data.volunteer)),
      ]
    case 'media':
      return [
        kv('Instagram Reach', nfmt(data.igReach)), kv('Instagram Impression', nfmt(data.igImpression)),
        kv('TikTok Views', nfmt(data.tiktokViews)), kv('Facebook Reach', nfmt(data.fbReach)),
        kv('Website Visitor', nfmt(data.webVisitor)), kv('Engagement', nfmt(data.engagement)),
        kv('Jumlah Posting', nfmt(data.jumlahPosting)), kv('Media Partner', data.mediaPartner || '-'),
      ]
    case 'sponsors':
      return tbl(['Sponsor', 'Level', 'Nilai', 'Benefit', 'Status Benefit'], data.sponsor,
        (r) => [r.nama, r.level, idr(r.nilai), r.benefit, r.statusBenefit])
    case 'vendors':
      return tbl(['Vendor', 'Jenis', 'PIC', 'Nilai Kontrak', 'Pembayaran', 'Evaluasi'], data.vendor,
        (r) => [r.nama, r.jenis, r.pic, idr(r.nilaiKontrak), r.statusPembayaran, r.evaluasi])
    case 'security_resources':
      return [
        kv('Jumlah Security', nfmt(data.security)), kv('Jumlah Polisi', nfmt(data.polisi)),
        kv('Tim Medis', nfmt(data.medis)), kv('Ambulans', nfmt(data.ambulans)),
        kv('Pos Keamanan', nfmt(data.pos)), kv('CCTV', nfmt(data.cctv)),
        kv('Emergency Exit', nfmt(data.emergencyExit)),
      ]
    case 'incidents':
      return tbl(['Waktu', 'Lokasi', 'Jenis', 'Keparahan', 'Kronologi', 'Penanganan', 'Status'], data.insiden,
        (r) => [r.waktu, r.lokasi, r.jenis, SEVERITY_LABEL[r.keparahan] ?? r.keparahan, r.kronologi, r.penanganan, r.status])
    case 'security_stats':
      return [
        kv('Total Insiden', nfmt(data.totalInsiden)), kv('Medical Cases', nfmt(data.medicalCases)),
        kv('Lost and Found', nfmt(data.lostFound)), kv('Emergency Response Time', data.responseTime || '-'),
      ]
    default:
      return [para(JSON.stringify(data))]
  }
}

export async function buildLpjDocx(report, sectionsByKey, narrative) {
  const n = narrative ?? {}
  const children = [
    // Cover
    new Paragraph({ spacing: { before: 2200 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'LAPORAN PERTANGGUNGJAWABAN', bold: true, size: 26, color: NAVY })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 160, after: 80 }, children: [new TextRun({ text: report.concert_name.toUpperCase(), bold: true, size: 44 })] }),
    ...(report.theme ? [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: `"${report.theme}"`, italics: true, size: 24, color: GRAY })] })] : []),
    ...coverImage(report.cover_image),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: report.location, size: 22 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 }, children: [new TextRun({ text: `${report.event_date} ${report.event_time}`, size: 22 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Disusun oleh', size: 20, color: GRAY })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: report.organizer || '-', bold: true, size: 24 })] }),
    new Paragraph({ children: [new PageBreak()] }),

    h1('Kata Pengantar'), para(n.kataPengantar),
    h1('Daftar Isi'),
    ...['Kata Pengantar', 'Pendahuluan', 'Profil Kegiatan Konser', ...LPJ_SECTIONS.map((s) => s.label), 'Penutup', 'Lembar Pengesahan', 'Daftar Lampiran']
      .map((t, i) => new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: `${i + 1}. ${t}`, size: 21 })] })),

    h1('Pendahuluan'),
    h2('Latar Belakang'), para(n.latarBelakang),
    h2('Tujuan Kegiatan'), para(n.tujuanKegiatan),
    h2('Tema Konser'), para(n.temaKonser),

    h1('Profil Kegiatan Konser'),
    kv('Nama Konser', report.concert_name), kv('Tema', report.theme || '-'), kv('Lokasi', report.location),
    kv('Tanggal', report.event_date), kv('Waktu', report.event_time), kv('Penyelenggara', report.organizer),
    para(n.profilKegiatan || report.description),
  ]

  for (const s of LPJ_SECTIONS) {
    children.push(h1(s.label))
    children.push(...sectionChildren(s.key, sectionsByKey[s.key]?.data ?? {}))
  }

  children.push(
    h1('Penutup'), para(n.penutup),
    h1('Lembar Pengesahan'),
    para(`Laporan Pertanggungjawaban ini telah diperiksa dan disetujui pada ${report.approved_at || '(belum disetujui)'}.`),
    new Paragraph({ spacing: { before: 500 }, alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'Menyetujui,', size: 21 })] }),
    new Paragraph({ spacing: { before: 700 }, alignment: AlignmentType.RIGHT, children: [new TextRun({ text: report.approved_by || '_________________', bold: true, italics: true, size: 28, color: NAVY })] }),
    new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'Manager', size: 19, color: GRAY })] }),
  )

  const doc = new Document({ sections: [{ children }] })
  return Packer.toBuffer(doc)
}
