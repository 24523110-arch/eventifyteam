import { buildLocalInsight } from './insightGenerator.js'

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages'
const CLAUDE_MODEL = 'claude-sonnet-4-6'

function buildPrompt(input) {
  const { ticketSummary, attendance, financeSummary, financeBreakdown, concertInfo } = input
  return `Anda adalah analis bisnis untuk perusahaan event organizer konser. Buat ringkasan evaluasi performa konser berikut dalam Bahasa Indonesia, dalam bentuk 1 paragraf naratif (120-180 kata), profesional, berbasis data, tanpa bullet point.

Data konser:
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
- Rincian pengeluaran terbesar: ${financeBreakdown.sort((a, b) => b.amount - a.amount)[0]?.category}

Fokus pada insight yang actionable untuk manajemen: apa yang berjalan baik, apa yang perlu diperhatikan, dan rekomendasi singkat untuk event berikutnya. Tulis hanya paragraf naratifnya saja, tanpa judul atau preamble.`
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
