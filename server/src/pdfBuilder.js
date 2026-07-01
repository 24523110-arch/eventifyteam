import PDFDocument from 'pdfkit'

function formatIDR(amount) {
  return `Rp ${(amount / 1_000_000_000).toFixed(2)} Miliar`
}

function formatNumber(n) {
  return n.toLocaleString('id-ID')
}

// Builds the Concert Evaluation Report PDF and resolves with a Buffer.
export function buildReportPdf(input, insight, generatedAt) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 })
    const chunks = []

    doc.on('data', (chunk) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const { ticketSummary, attendance, financeSummary, financeBreakdown, concertInfo } = input
    const purple = '#7C3AED'
    const dark = '#1B1630'
    const gray = '#6B7280'

    // Header
    doc.fillColor(purple).fontSize(22).font('Helvetica-Bold').text('Laporan Evaluasi Konser', { align: 'left' })
    doc.fillColor(dark).fontSize(14).font('Helvetica-Bold').text(concertInfo.name)
    doc.fillColor(gray).fontSize(10).font('Helvetica').text(`${concertInfo.venue} · ${concertInfo.date}`)
    doc.moveDown(0.3)
    doc.fontSize(9).fillColor(gray).text(`Dibuat pada: ${generatedAt}`)
    doc.moveTo(50, doc.y + 10).lineTo(545, doc.y + 10).strokeColor('#E5E7EB').stroke()
    doc.moveDown(1.2)

    // Section: Ringkasan Keuangan
    doc.fillColor(purple).fontSize(13).font('Helvetica-Bold').text('Ringkasan Keuntungan')
    doc.moveDown(0.4)

    const financeRows = [
      ['Total Pendapatan', formatIDR(financeSummary.revenue)],
      ['Total Pengeluaran', formatIDR(financeSummary.expenses)],
      ['Profit', formatIDR(financeSummary.profit)],
      ['Margin Keuntungan', `${financeSummary.margin}%`],
    ]
    financeRows.forEach(([label, value]) => {
      doc.fontSize(10).fillColor(dark).font('Helvetica').text(label, 50, doc.y, { continued: true, width: 250 })
      doc.font('Helvetica-Bold').text(value, { align: 'right' })
    })
    doc.moveDown(1)

    // Section: Jumlah Penonton
    doc.fillColor(purple).fontSize(13).font('Helvetica-Bold').text('Jumlah Penonton')
    doc.moveDown(0.4)

    const attendanceRows = [
      ['Kehadiran', `${formatNumber(attendance)} / ${formatNumber(concertInfo.capacity)}`],
      ['Tiket Terjual', formatNumber(ticketSummary.sold)],
      ['Tiket Tersisa', formatNumber(ticketSummary.remaining)],
      ['Refund', formatNumber(ticketSummary.refunds)],
    ]
    attendanceRows.forEach(([label, value]) => {
      doc.fontSize(10).fillColor(dark).font('Helvetica').text(label, 50, doc.y, { continued: true, width: 250 })
      doc.font('Helvetica-Bold').text(value, { align: 'right' })
    })
    doc.moveDown(1)

    // Section: Expense breakdown
    doc.fillColor(purple).fontSize(13).font('Helvetica-Bold').text('Rincian Pengeluaran')
    doc.moveDown(0.4)
    financeBreakdown.forEach(({ category, amount }) => {
      doc.fontSize(10).fillColor(dark).font('Helvetica').text(category, 50, doc.y, { continued: true, width: 250 })
      doc.font('Helvetica-Bold').text(formatIDR(amount), { align: 'right' })
    })
    doc.moveDown(1)

    // Section: Insight
    doc.fillColor(purple).fontSize(13).font('Helvetica-Bold').text('Insight & Analisis Performa')
    doc.moveDown(0.4)
    doc.fontSize(10).fillColor(dark).font('Helvetica').text(insight, { align: 'justify', lineGap: 3 })

    doc.moveDown(2)
    doc.fontSize(8).fillColor(gray).text('Dokumen ini dihasilkan secara otomatis oleh Eventify AI Report Generator.', { align: 'center' })

    doc.end()
  })
}
