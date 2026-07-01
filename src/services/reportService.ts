import type { ReportGenerationInput, ReportGenerationResult } from '@/types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000'

export class ReportServiceError extends Error {}

export async function generateEvaluationReport(input: ReportGenerationInput): Promise<ReportGenerationResult> {
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}/api/reports/evaluation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
  } catch {
    throw new ReportServiceError(
      'Tidak dapat terhubung ke server laporan. Pastikan backend berjalan di ' + API_BASE_URL + '.'
    )
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new ReportServiceError(body?.error ?? 'Gagal membuat laporan. Silakan coba lagi.')
  }

  return response.json()
}

export function downloadPdfFromBase64(base64: string, filename: string) {
  const byteChars = atob(base64)
  const byteNumbers = new Array(byteChars.length)
  for (let i = 0; i < byteChars.length; i++) {
    byteNumbers[i] = byteChars.charCodeAt(i)
  }
  const byteArray = new Uint8Array(byteNumbers)
  const blob = new Blob([byteArray], { type: 'application/pdf' })

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
