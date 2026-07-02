// Deterministic, logic-based summary of concert performance.
// This always works with no external dependency, and serves as the
// fallback if the Claude API call fails or is unavailable.
export function buildLocalInsight(input) {
  const { ticketSummary, attendance, financeSummary, concertInfo, fieldReports = [], incidentSummary, recentIncidents = [] } = input

  const soldPlusRemaining = ticketSummary.sold + ticketSummary.remaining
  const sellThroughRate = soldPlusRemaining > 0 ? ((ticketSummary.sold / soldPlusRemaining) * 100).toFixed(1) : '0.0'
  const attendanceRate = concertInfo.capacity > 0 ? ((attendance / concertInfo.capacity) * 100).toFixed(1) : '0.0'
  const refundRate = ticketSummary.sold > 0 ? ((ticketSummary.refunds / ticketSummary.sold) * 100).toFixed(2) : '0.00'

  const performanceTone =
    financeSummary.margin >= 60 ? 'sangat kuat' : financeSummary.margin >= 40 ? 'solid' : 'perlu perhatian'

  const attendanceTone =
    Number(attendanceRate) >= 90 ? 'mendekati kapasitas penuh' : Number(attendanceRate) >= 70 ? 'tinggi' : 'moderat'

  const financeParagraph = [
    `Event "${concertInfo.name}" di ${concertInfo.venue} mencatatkan performa finansial yang ${performanceTone}, `,
    `dengan margin keuntungan sebesar ${financeSummary.margin}% dari total pendapatan. `,
    `Tingkat penjualan tiket mencapai ${sellThroughRate}% dari total kapasitas yang tersedia, `,
    `dan kehadiran penonton tercatat ${attendanceTone} di angka ${attendanceRate}% dari kapasitas venue (${attendance.toLocaleString('id-ID')} dari ${concertInfo.capacity.toLocaleString('id-ID')} penonton). `,
    `Tingkat refund berada pada ${refundRate}%, yang ${Number(refundRate) < 1 ? 'tergolong sangat rendah dan sehat' : 'sebaiknya dipantau pada event berikutnya'}.`,
  ].join('')

  const operationalParagraph = fieldReports.length
    ? `Dari sisi operasional lapangan, Event Organizer mengirimkan ${fieldReports.length} laporan selama konser berlangsung, mencakup kategori ${[...new Set(fieldReports.map((r) => r.category))].join(', ')}. Catatan yang paling menonjol: "${fieldReports[0].title}" — ${fieldReports[0].content}`
    : `Tidak ada laporan operasional lapangan yang tercatat dari Event Organizer untuk konser ini.`

  const incidentCount = incidentSummary?.totalCount ?? 0
  const criticalCount = incidentSummary?.bySeverity?.critical ?? 0
  const highCount = incidentSummary?.bySeverity?.high ?? 0
  const securityTone = criticalCount > 0 ? 'memerlukan perhatian serius' : highCount > 0 ? 'perlu dipantau' : 'terkendali dengan baik'
  const responseText =
    incidentSummary?.avgResponseMinutes != null
      ? `dengan rata-rata waktu respons ${incidentSummary.avgResponseMinutes} menit (target ≤ ${incidentSummary.targetMinutes} menit)`
      : 'dengan data waktu respons yang belum tersedia'
  const securityParagraph = incidentCount
    ? `Dari sisi keamanan, Security Team menangani ${incidentCount} insiden (${criticalCount} kritis, ${highCount} tinggi) selama konser, dengan ${incidentSummary.resolvedCount} di antaranya telah terselesaikan ${responseText}. Kondisi keamanan secara umum ${securityTone}${recentIncidents[0] ? `; insiden terbaru tercatat di area ${recentIncidents[0].area}` : ''}.`
    : `Tidak ada insiden keamanan yang tercatat oleh Security Team selama konser berlangsung — kondisi keamanan terkendali penuh.`

  const closingParagraph = `Secara keseluruhan, konser ini menunjukkan keberhasilan operasional, keamanan, dan finansial yang saling melengkapi, dan dapat dijadikan acuan untuk perencanaan konser serupa di masa mendatang.`

  return [financeParagraph, operationalParagraph, securityParagraph, closingParagraph].join('\n\n')
}
