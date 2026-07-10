import { useEffect, useState } from 'react'
import { ShieldCheck, ChevronDown, Send } from 'lucide-react'
import { useLpjStore } from '@/store/lpjStore'
import { GlassCard } from '@/components/GlassCard'
import { StatusBadge } from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { SectionEditor } from './SectionEditor'
import { SECTION_CONFIG_BY_KEY } from './sectionConfig'
import { cn } from '@/utils'

interface SecurityReportPanelProps {
  // Which of the security-owned report sections this page hosts:
  // Crowd Monitoring → security_resources + security_stats,
  // Incident Center → incidents.
  sectionKeys: string[]
  title: string
  description: string
}

// Security Team's slice of the collaborative concert report, embedded into
// the pages where that data naturally lives instead of a separate feature.
// "Submit Security Report" submits ALL security sections at once, from
// whichever page it's pressed on.
export function SecurityReportPanel({ sectionKeys, title, description }: SecurityReportPanelProps) {
  const { current, loaded, fetchActive, saveSection, submitReport } = useLpjStore()
  const [openKey, setOpenKey] = useState<string | null>(sectionKeys.length === 1 ? sectionKeys[0] : null)
  const [submitOpen, setSubmitOpen] = useState(false)

  useEffect(() => {
    fetchActive()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const securitySections = (current?.sections ?? []).filter((s) => s.ownerRole === 'security')
  const hostedSections = securitySections
    .filter((s) => sectionKeys.includes(s.key))
    .sort((a, b) => sectionKeys.indexOf(a.key) - sectionKeys.indexOf(b.key))
  const submittedCount = securitySections.filter((s) => s.status === 'Submitted').length
  const locked = current?.status === 'Approved'

  return (
    <GlassCard hover={false}>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-1">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
            <ShieldCheck className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="font-display font-semibold text-ink">{title}</h2>
            <p className="text-xs text-ink-faint mt-0.5">{description}</p>
          </div>
        </div>
        {current && (
          <div className="flex items-center gap-2">
            <StatusBadge status={current.status} />
            {!locked && (
              <Button size="sm" onClick={() => setSubmitOpen(true)}>
                <Send className="w-3.5 h-3.5 mr-1.5" /> Submit Security Report
              </Button>
            )}
          </div>
        )}
      </div>

      {!loaded ? (
        <p className="text-sm text-ink-faint py-6 text-center">Memuat…</p>
      ) : !current ? (
        <p className="text-sm text-ink-faint py-6 text-center">
          Belum ada laporan konser aktif — menunggu Admin/EO membuatnya di Report Management.
        </p>
      ) : (
        <>
          <p className="text-xs text-ink-faint mb-4">
            {submittedCount}/{securitySections.length} bagian keamanan terkirim{locked && ' — laporan disetujui & terkunci'}.
          </p>
          <div className="space-y-3">
            {hostedSections.map((section) => {
              const config = SECTION_CONFIG_BY_KEY[section.key]
              if (!config) return null
              const open = openKey === section.key
              return (
                <div key={section.key} className="rounded-xl border border-glass/10 overflow-hidden">
                  <button
                    onClick={() => setOpenKey(open ? null : section.key)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-glass/[0.03] transition-colors"
                  >
                    <span className="text-sm font-medium text-ink">{config.label}</span>
                    <span className="flex items-center gap-3">
                      <StatusBadge status={section.status} />
                      <ChevronDown className={cn('w-4 h-4 text-ink-faint transition-transform', open && 'rotate-180')} />
                    </span>
                  </button>
                  {open && (
                    <div className="px-4 pb-4 border-t border-glass/[0.06] pt-4">
                      <SectionEditor
                        section={section}
                        config={config}
                        editable={!locked}
                        onSave={(data) => saveSection(current.id, section.key, data)}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}

      <ConfirmDialog
        open={submitOpen}
        onOpenChange={setSubmitOpen}
        title="Submit Security Report"
        description={`Kirim ${securitySections.length} bagian laporan keamanan (Laporan Keamanan & Keselamatan, Laporan Insiden, Statistik Keamanan) ke Manager? Status berubah menjadi Waiting Manager Review setelah semua role mengirim.`}
        onConfirm={() => {
          if (current) submitReport(current.id)
          setSubmitOpen(false)
        }}
      />
    </GlassCard>
  )
}
