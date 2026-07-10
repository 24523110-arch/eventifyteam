// AI narrative for the LPJ: writes ONLY the framing sections (kata pengantar,
// pendahuluan, profil kegiatan, penutup) around the roles' own data — it
// never rewrites the numbers or entries the roles submitted. Falls back to a
// deterministic local template when no ANTHROPIC_API_KEY is set or the call
// fails, so generation never hard-fails (same policy as claudeClient.js).

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages'
const CLAUDE_MODEL = 'claude-opus-4-8'

const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0)

function financeTotals(sections) {
  const fin = sections.finance?.data ?? {}
  const income = (fin.pemasukan ?? []).reduce((s, r) => s + num(r.jumlah), 0)
  const expense = (fin.pengeluaran ?? []).reduce((s, r) => s + num(r.jumlah), 0)
  return { income, expense, net: income - expense }
}

function ticketTotals(sections) {
  const rows = sections.ticket_sales?.data?.tiket ?? []
  const sold = rows.reduce((s, r) => s + num(r.terjual), 0)
  const quota = rows.reduce((s, r) => s + num(r.kuota), 0)
  const checkin = rows.reduce((s, r) => s + num(r.checkin), 0)
  const revenue = rows.reduce((s, r) => s + num(r.harga) * num(r.terjual), 0)
  return { sold, quota, checkin, revenue, occupancy: quota > 0 ? Math.round((sold / quota) * 100) : 0 }
}

function summarizeForPrompt(report, sections) {
  const fin = financeTotals(sections)
  const tik = ticketTotals(sections)
  const att = sections.attendance?.data ?? {}
  const incidents = sections.incidents?.data?.insiden ?? []
  const sponsors = sections.sponsors?.data?.sponsor ?? []
  const committee = sections.committee?.data ?? {}
  return [
    `Nama konser: ${report.concert_name}`,
    `Tema: ${report.theme || '(tidak diisi)'}`,
    `Lokasi: ${report.location} | Tanggal: ${report.event_date} ${report.event_time}`,
    `Penyelenggara: ${report.organizer}`,
    `Deskripsi singkat: ${report.description || '(tidak diisi)'}`,
    `Ketua panitia: ${committee.ketua || '(tidak diisi)'}`,
    `Total pemasukan: Rp ${fin.income.toLocaleString('id-ID')} | Total pengeluaran: Rp ${fin.expense.toLocaleString('id-ID')} | ${fin.net >= 0 ? 'Laba' : 'Rugi'}: Rp ${Math.abs(fin.net).toLocaleString('id-ID')}`,
    `Tiket terjual: ${tik.sold.toLocaleString('id-ID')} dari kuota ${tik.quota.toLocaleString('id-ID')} (okupansi ${tik.occupancy}%), check-in ${tik.checkin.toLocaleString('id-ID')}`,
    `Total pengunjung hadir: ${num(att.hadir).toLocaleString('id-ID')}`,
    `Jumlah sponsor: ${sponsors.length}`,
    `Jumlah insiden keamanan tercatat: ${incidents.length}`,
  ].join('\n')
}

function buildPrompt(report, sections) {
  return `Anda adalah sekretaris profesional sebuah event organizer konser di Indonesia. Berdasarkan data berikut, tulis bagian-bagian naratif untuk Laporan Pertanggungjawaban (LPJ) resmi. JANGAN mengubah atau mengarang angka — gunakan hanya angka yang diberikan; jika suatu data kosong, tulis narasi umum tanpa menyebut angka.

DATA:
${summarizeForPrompt(report, sections)}

Balas HANYA dengan JSON valid (tanpa markdown, tanpa teks lain) berbentuk:
{
  "kataPengantar": "...",
  "latarBelakang": "...",
  "tujuanKegiatan": "...",
  "temaKonser": "...",
  "profilKegiatan": "...",
  "penutup": "..."
}

Ketentuan tiap bagian: Bahasa Indonesia formal khas dokumen LPJ organisasi, 1 paragraf padat (60-120 kata) per bagian, tanpa bullet point, tanpa judul di dalam nilainya. "kataPengantar" diakhiri kalimat ucapan terima kasih kepada seluruh pihak. "tujuanKegiatan" menjelaskan tujuan penyelenggaraan konser. "profilKegiatan" merangkum identitas kegiatan (nama, tema, lokasi, waktu, penyelenggara, skala berdasarkan angka tiket/kehadiran). "penutup" berisi harapan dan permohonan maaf atas kekurangan.`
}

function buildLocalNarrative(report, sections) {
  const fin = financeTotals(sections)
  const tik = ticketTotals(sections)
  const name = report.concert_name
  const org = report.organizer || 'panitia penyelenggara'
  const tema = report.theme ? `dengan tema "${report.theme}"` : ''
  const netText = fin.income || fin.expense
    ? ` Dari sisi keuangan, kegiatan ini membukukan total pemasukan Rp ${fin.income.toLocaleString('id-ID')} dan total pengeluaran Rp ${fin.expense.toLocaleString('id-ID')}, sehingga tercatat ${fin.net >= 0 ? 'laba' : 'rugi'} sebesar Rp ${Math.abs(fin.net).toLocaleString('id-ID')}.`
    : ''
  const tiketText = tik.quota > 0
    ? ` Sebanyak ${tik.sold.toLocaleString('id-ID')} tiket terjual dari kuota ${tik.quota.toLocaleString('id-ID')} (tingkat okupansi ${tik.occupancy}%).`
    : ''
  return {
    kataPengantar: `Puji syukur kami panjatkan ke hadirat Tuhan Yang Maha Esa atas terselenggaranya kegiatan ${name} ${tema} dengan baik dan lancar. Laporan Pertanggungjawaban ini disusun sebagai bentuk akuntabilitas ${org} atas seluruh rangkaian kegiatan, penggunaan anggaran, serta capaian yang diperoleh. Kami mengucapkan terima kasih yang sebesar-besarnya kepada seluruh panitia, sponsor, vendor, tim keamanan, dan semua pihak yang telah mendukung terselenggaranya kegiatan ini.`,
    latarBelakang: `Kegiatan ${name} diselenggarakan sebagai wadah apresiasi musik sekaligus sarana hiburan yang dikelola secara profesional oleh ${org}. Penyelenggaraan konser menuntut koordinasi lintas divisi — mulai dari perencanaan acara, pengelolaan tiket dan keuangan, kemitraan sponsor dan vendor, hingga pengamanan penonton — sehingga diperlukan pelaporan yang menyeluruh dan dapat dipertanggungjawabkan kepada seluruh pemangku kepentingan.`,
    tujuanKegiatan: `Kegiatan ini bertujuan menghadirkan pertunjukan musik yang berkualitas dan aman bagi penonton, membangun kolaborasi yang saling menguntungkan dengan sponsor dan vendor, serta menjadi ajang pembelajaran organisasi bagi seluruh panitia. Laporan ini disusun untuk mendokumentasikan pelaksanaan kegiatan tersebut secara transparan, mencakup aspek acara, keuangan, tiket, kemitraan, dan keamanan.`,
    temaKonser: report.theme
      ? `Kegiatan ini mengangkat tema "${report.theme}". Tema tersebut menjadi benang merah seluruh rangkaian acara — dari konsep panggung, penampilan artis, hingga materi publikasi — sehingga pengalaman yang diterima penonton selaras dengan pesan yang ingin disampaikan penyelenggara.`
      : `Kegiatan ini dirancang dengan konsep pertunjukan musik langsung yang mengutamakan kualitas penampilan, kenyamanan, dan keamanan penonton sebagai identitas utama penyelenggaraan.`,
    profilKegiatan: `${name} ${tema} diselenggarakan oleh ${org} di ${report.location || '(lokasi)'} pada ${report.event_date || '(tanggal)'} ${report.event_time || ''}.${tiketText}${netText} Rincian lengkap setiap aspek kegiatan disajikan pada bagian-bagian berikut dalam laporan ini sesuai data yang disampaikan oleh masing-masing divisi.`,
    penutup: `Demikian Laporan Pertanggungjawaban kegiatan ${name} ini kami susun dengan sebenar-benarnya sebagai wujud tanggung jawab ${org} kepada seluruh pemangku kepentingan. Kami menyadari masih terdapat kekurangan dalam penyelenggaraan maupun penyusunan laporan ini, dan atas hal tersebut kami memohon maaf serta terbuka terhadap saran dan masukan. Semoga laporan ini dapat menjadi bahan evaluasi dan pijakan penyelenggaraan kegiatan yang lebih baik di masa mendatang.`,
  }
}

function parseJsonLoose(text) {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) throw new Error('no JSON object in response')
  return JSON.parse(text.slice(start, end + 1))
}

const NARRATIVE_KEYS = ['kataPengantar', 'latarBelakang', 'tujuanKegiatan', 'temaKonser', 'profilKegiatan', 'penutup']

export async function generateLpjNarrative(report, sections) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return { narrative: buildLocalNarrative(report, sections), source: 'local' }
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 25000)
    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 2000,
        messages: [{ role: 'user', content: buildPrompt(report, sections) }],
      }),
      signal: controller.signal,
    })
    clearTimeout(timeout)
    if (!response.ok) throw new Error(`Claude API responded with ${response.status}`)

    const data = await response.json()
    const text = data.content?.find((b) => b.type === 'text')?.text?.trim()
    if (!text) throw new Error('Claude API returned no text content')

    const parsed = parseJsonLoose(text)
    const local = buildLocalNarrative(report, sections)
    const narrative = Object.fromEntries(
      NARRATIVE_KEYS.map((k) => [k, typeof parsed[k] === 'string' && parsed[k].trim() ? parsed[k].trim() : local[k]])
    )
    return { narrative, source: 'ai' }
  } catch (err) {
    console.error('LPJ narrative Claude call failed, falling back to local:', err.message)
    return { narrative: buildLocalNarrative(report, sections), source: 'local-fallback' }
  }
}

export { financeTotals, ticketTotals }
