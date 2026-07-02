import type { ReportGenerationResult } from '@/types'
import { getAuthToken } from '@/services/api'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000'

export class ReportServiceError extends Error {}

// The server assembles all report data itself (ticket/finance, the EO's
// field reports, Security's incident record) for the active concert — this
// call just triggers generation.
export async function generateEvaluationReport(): Promise<ReportGenerationResult> {
  let response: Response
  const token = getAuthToken()
  try {
    response = await fetch(`${API_BASE_URL}/api/reports/evaluation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
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
