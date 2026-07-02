import { buildLocalInsight } from './insightGenerator.js'

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages'
const CLAUDE_MODEL = 'claude-opus-4-8'

function buildPrompt(input) {
  const { ticketSummary, attendance, financeSummary, financeBreakdown, concertInfo, fieldReports = [], incidentSummary, recentIncidents = [] } = input

  const fieldReportsBlock = fieldReports.length
    ? fieldReports.map((r) => `  - [${r.category}] ${r.title} (oleh ${r.author}): ${r.content}`).join('\n')
    : '  - (Tidak ada laporan lapangan dari Event Organizer.)'

  const incidentsBlock = recentIncidents.length
    ? recentIncidents.map((i) => `  - [${i.severity}/${i.status}] ${i.area}: ${i.description || '(tanpa deskripsi)'}`).join('\n')
    : '  - (Tidak ada insiden tercatat.)'

  return `Anda adalah analis bisnis untuk perusahaan event organizer konser. Buat rangkuman laporan evaluasi konser secara RINCI dalam Bahasa Indonesia, dalam bentuk 2-3 paragraf naratif (220-320 kata total), profesional, berbasis data, tanpa bullet point. Laporan ini MENCAKUP TIGA aspek: (1) performa tiket/kehadiran/keuangan, (2) kondisi operasional di lokasi berdasarkan laporan Event Organizer, dan (3) ringkasan keamanan berdasarkan data Security Team.

1) Data tiket, kehadiran & keuangan:
- Nama: ${concertInfo.name}
- Venue: ${concertInfo.venue}
- Kapasitas venue: ${concertInfo.capacity.toLocaleString('id-ID')}
- Kehadiran: ${attendance.toLocaleString('id-ID')}
- Tiket terjual: ${ticketSummary.sold.toLocaleString('id-ID')}
- Tiket tersisa: ${ticketSummary.remaining.toLocaleString('id-ID')}
- Refund: ${ticketSummary.refunds}
- Total pendapatan: Rp ${(financeSummary.revenue / 1_000_000_000).toFixed(1)} miliar
- Total pengeluaran: Rp ${(financeSummary.expenses / 1_000_000_000).toFixed(1)} miliar
- Profit: Rp ${(financeSummary.profit / 1_000_000_000).toFixed(1)} miliar
- Margin keuntungan: ${financeSummary.margin}%
- Rincian pengeluaran terbesar: ${financeBreakdown.sort((a, b) => b.amount - a.amount)[0]?.category ?? '(belum ada data)'}

2) Laporan lapangan dari Event Organizer (kondisi operasional on-site):
${fieldReportsBlock}

3) Ringkasan keamanan dari Security Team:
- Total insiden: ${incidentSummary?.totalCount ?? 0} (kritis: ${incidentSummary?.bySeverity?.critical ?? 0}, tinggi: ${incidentSummary?.bySeverity?.high ?? 0}, sedang: ${incidentSummary?.bySeverity?.medium ?? 0}, rendah: ${incidentSummary?.bySeverity?.low ?? 0})
- Insiden terselesaikan: ${incidentSummary?.resolvedCount ?? 0}
- Rata-rata waktu respons: ${incidentSummary?.avgResponseMinutes ?? 'belum ada data'} menit (target ≤ ${incidentSummary?.targetMinutes ?? 8} menit)
- Insiden terbaru:
${incidentsBlock}

Fokus pada insight yang actionable untuk manajemen: apa yang berjalan baik di ketiga aspek tersebut, apa yang perlu diperhatikan (termasuk kendala operasional dari EO dan isu keamanan dari Security Team), dan rekomendasi singkat untuk konser berikutnya. Tulis hanya paragraf naratifnya saja, tanpa judul, tanpa penomoran bagian, tanpa preamble.`
}

// Attempts a real Claude API call for a richer narrative insight.
// Falls back to the deterministic local summary on any error, timeout,
// or missing API key, so report generation never fails outright.
export async function generateInsight(input) {
  const apiKey = process.env.ANTHROPIC_API_KEY

  if (!apiKey) {
    return { insight: buildLocalInsight(input), source: 'local' }
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)

    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 500,
        messages: [{ role: 'user', content: buildPrompt(input) }],
      }),
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!response.ok) {
      throw new Error(`Claude API responded with ${response.status}`)
    }

    const data = await response.json()
    const text = data.content?.find((block) => block.type === 'text')?.text?.trim()

    if (!text) {
      throw new Error('Claude API returned no text content')
    }

    return { insight: text, source: 'ai' }
  } catch (err) {
    console.error('Claude API call failed, falling back to local insight:', err.message)
    return { insight: buildLocalInsight(input), source: 'local-fallback' }
  }
}
