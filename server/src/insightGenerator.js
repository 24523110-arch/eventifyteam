// Deterministic, logic-based summary of concert performance.
// This always works with no external dependency, and serves as the
// fallback if the Claude API call fails or is unavailable.
export function buildLocalInsight(input) {
  const { ticketSummary, attendance, financeSummary, concertInfo } = input

  const sellThroughRate = ((ticketSummary.sold / (ticketSummary.sold + ticketSummary.remaining)) * 100).toFixed(1)
  const attendanceRate = ((attendance / concertInfo.capacity) * 100).toFixed(1)
  const refundRate = ((ticketSummary.refunds / ticketSummary.sold) * 100).toFixed(2)

  const performanceTone =
    financeSummary.margin >= 60 ? 'sangat kuat' : financeSummary.margin >= 40 ? 'solid' : 'perlu perhatian'

  const attendanceTone =
    Number(attendanceRate) >= 90 ? 'mendekati kapasitas penuh' : Number(attendanceRate) >= 70 ? 'tinggi' : 'moderat'

  return [
    `Event "${concertInfo.name}" di ${concertInfo.venue} mencatatkan performa finansial yang ${performanceTone}, `,
    `dengan margin keuntungan sebesar ${financeSummary.margin}% dari total pendapatan. `,
    `Tingkat penjualan tiket mencapai ${sellThroughRate}% dari total kapasitas yang tersedia, `,
    `dan kehadiran penonton tercatat ${attendanceTone} di angka ${attendanceRate}% dari kapasitas venue (${attendance.toLocaleString('id-ID')} dari ${concertInfo.capacity.toLocaleString('id-ID')} penonton). `,
    `Tingkat refund berada pada ${refundRate}%, yang ${Number(refundRate) < 1 ? 'tergolong sangat rendah dan sehat' : 'sebaiknya dipantau pada event berikutnya'}. `,
    `Secara keseluruhan, event ini menunjukkan keberhasilan operasional dan finansial yang baik, `,
    `dan dapat dijadikan acuan untuk perencanaan event serupa di masa mendatang.`,
  ].join('')
}
