import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, FileText, Download, CheckCircle2, AlertCircle, Ticket, Users, Wallet, TrendingUp, Inbox } from 'lucide-react'
import { useDashboardStore } from '@/store/dashboardStore'
import { useFieldReportStore } from '@/store/fieldReportStore'
import { useToastStore } from '@/store/toastStore'
import { GlassCard } from '@/components/GlassCard'
import { StatusBadge } from '@/components/StatusBadge'
import { generateEvaluationReport, downloadPdfFromBase64, ReportServiceError } from '@/services/reportService'
import type { ReportGenerationResult } from '@/types'

const PROCESS_STEPS = [
  { id: 1, label: 'Mengumpulkan data tiket & keuangan' },
  { id: 2, label: 'Menggabungkan laporan lapangan Event Organizer' },
  { id: 3, label: 'Menggabungkan ringkasan keamanan Security Team' },
  { id: 4, label: 'Menganalisis performa konser secara rinci' },
  { id: 5, label: 'Menyusun laporan evaluasi PDF' },
]

export function ManagerReports() {
  const { ticketSummary, financeSummary, concertInfo } = useDashboardStore()
  const fieldReports = useFieldReportStore((s) => s.reports)
  const showToast = useToastStore((s) => s.show)

  useEffect(() => {
    useFieldReportStore.getState().fetchReports()
  }, [])

  const [isGenerating, setIsGenerating] = useState(false)
  const [activeStep, setActiveStep] = useState(0)
  const [result, setResult] = useState<ReportGenerationResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleGenerate() {
    setIsGenerating(true)
    setError(null)
    setResult(null)
    setActiveStep(1)

    // Visual step progression while the request is in flight — the server
    // does the real assembly (tickets/finance + EO field reports + Security
    // incident record) for the active concert.
    const stepTimer = setInterval(() => {
      setActiveStep((s) => (s < 4 ? s + 1 : s))
    }, 700)

    try {
      const res = await generateEvaluationReport()
      setActiveStep(5)
      setResult(res)
      showToast('Laporan evaluasi konser berhasil dibuat.', 'success')
    } catch (err) {
      const message = err instanceof ReportServiceError ? err.message : 'Terjadi kesalahan tak terduga.'
      setError(message)
      showToast(message, 'error')
    } finally {
      clearInterval(stepTimer)
      setIsGenerating(false)
    }
  }

  function handleDownload() {
    if (!result) return
    downloadPdfFromBase64(result.pdfBase64, `Laporan-Evaluasi-${concertInfo.name.replace(/\s+/g, '-')}.pdf`)
    showToast('PDF berhasil diunduh.', 'success')
  }

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-display font-bold text-ink">Reports</h1>
        <p className="text-ink-faint text-sm mt-1">Generate an AI-assisted concert evaluation report.</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard delay={0.05} hover={false}>
          <div className="flex items-start gap-3 mb-5">
            <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 shrink-0">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-display font-semibold text-ink">AI Concert Evaluation Report</h2>
              <p className="text-xs text-ink-faint mt-1 max-w-md">
                Combines ticket sales, attendance, and finance data into a downloadable PDF with an automated
                performance insight.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="glass rounded-xl p-3">
              <span className="text-xs text-ink-faint flex items-center gap-1.5"><Ticket className="w-3 h-3" /> Tickets Sold</span>
              <div className="text-sm font-semibold text-ink mt-1">{ticketSummary.sold.toLocaleString('id-ID')}</div>
            </div>
            <div className="glass rounded-xl p-3">
              <span className="text-xs text-ink-faint flex items-center gap-1.5"><Users className="w-3 h-3" /> Attendance</span>
              <div className="text-sm font-semibold text-ink mt-1">{concertInfo.attendance.toLocaleString('id-ID')}</div>
            </div>
            <div className="glass rounded-xl p-3">
              <span className="text-xs text-ink-faint flex items-center gap-1.5"><Wallet className="w-3 h-3" /> Revenue</span>
              <div className="text-sm font-semibold text-ink mt-1">Rp {(financeSummary.revenue / 1_000_000_000).toFixed(1)}M</div>
            </div>
            <div className="glass rounded-xl p-3">
              <span className="text-xs text-ink-faint flex items-center gap-1.5"><TrendingUp className="w-3 h-3" /> Margin</span>
              <div className="text-sm font-semibold text-ink mt-1">{financeSummary.margin}%</div>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="btn-primary w-full flex items-center justify-center gap-2 px-4 py-3 text-sm disabled:opacity-70"
          >
            {isGenerating ? (
              <motion.div
                className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.7, ease: 'linear' }}
              />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {isGenerating ? 'Generating Report…' : 'Generate Evaluation Report'}
          </button>

          {error && (
            <div className="mt-4 flex items-start gap-2 px-3.5 py-3 rounded-xl bg-status-danger/10 border border-status-danger/30">
              <AlertCircle className="w-4 h-4 text-status-danger shrink-0 mt-0.5" />
              <p className="text-sm text-status-danger">{error}</p>
            </div>
          )}

          {result && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 rounded-xl bg-status-success/10 border border-status-success/30"
            >
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-status-success shrink-0" />
                <span className="text-sm font-medium text-ink">Report ready</span>
                <span className="text-xs text-ink-faint ml-auto">{result.generatedAt}</span>
              </div>
              <p className="text-xs text-ink-faint leading-relaxed mb-3 line-clamp-3">{result.insight}</p>
              <button
                onClick={handleDownload}
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl glass text-sm font-medium text-ink hover:border-primary/30 transition-colors"
              >
                <Download className="w-4 h-4" /> Download PDF
              </button>
            </motion.div>
          )}
        </GlassCard>

        <GlassCard delay={0.1} hover={false}>
          <h2 className="font-display font-semibold text-ink mb-5 flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" /> Generation Process
          </h2>
          <div className="space-y-3">
            {PROCESS_STEPS.map((step) => {
              const isDone = result ? true : activeStep > step.id
              const isActive = isGenerating && activeStep === step.id
              return (
                <div key={step.id} className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                      isDone
                        ? 'bg-status-success/20 text-status-success border border-status-success/40'
                        : isActive
                        ? 'bg-primary/20 text-primary border border-primary/40'
                        : 'bg-white/[0.05] text-ink-faint border border-white/10'
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : step.id}
                  </div>
                  <span className={`text-sm ${isDone || isActive ? 'text-ink' : 'text-ink-faint'}`}>{step.label}</span>
                  {isActive && (
                    <motion.div
                      className="w-3 h-3 border-2 border-primary/40 border-t-primary rounded-full ml-auto"
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 0.7, ease: 'linear' }}
                    />
                  )}
                </div>
              )
            })}
          </div>
          {!isGenerating && !result && (
            <p className="text-xs text-ink-faint mt-5">
              Click "Generate Evaluation Report" to start. This pulls live data from your dashboard stores — no
              manual entry needed.
            </p>
          )}
        </GlassCard>
      </div>

      {/* Manual field reports piped in from the Admin/Event Organizer on-site */}
      <GlassCard delay={0.15} hover={false}>
        <div className="flex items-center gap-2.5 mb-5">
          <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
            <Inbox className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="font-display font-semibold text-ink">Laporan Lapangan dari Event Organizer</h2>
            <p className="text-xs text-ink-faint mt-0.5">Laporan manual dari lokasi konser, masuk secara real-time.</p>
          </div>
        </div>
        {fieldReports.length === 0 ? (
          <p className="text-sm text-ink-faint py-6 text-center">Belum ada laporan lapangan masuk.</p>
        ) : (
          <div className="space-y-2.5 max-h-96 overflow-y-auto scrollbar-thin">
            {fieldReports.map((r) => (
              <div key={r.id} className="glass rounded-xl p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-ink">{r.title}</span>
                  <StatusBadge status={r.category} className="shrink-0" />
                </div>
                <p className="text-xs text-ink-faint mt-1 leading-relaxed">{r.content}</p>
                <span className="text-[10px] text-ink-faint/70 mt-1 block">{r.author} · {r.createdAt}</span>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  )
}
