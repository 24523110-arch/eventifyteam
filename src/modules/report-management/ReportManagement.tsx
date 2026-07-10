import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ClipboardList, Plus, ChevronDown, Send, Trash2 } from 'lucide-react'
import { useLpjStore } from '@/store/lpjStore'
import { useDashboardStore } from '@/store/dashboardStore'
import { GlassCard } from '@/components/GlassCard'
import { StatusBadge } from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { CreateLpjDialog } from './CreateLpjDialog'
import { SectionEditor } from './SectionEditor'
import { LPJ_SECTION_CONFIGS } from './sectionConfig'
import { cn } from '@/utils'

// Report Management (Admin/EO) — replaces the old Reports & Ticket Sales and
// Vendor Management pages. One collaborative report per active concert: the
// Admin/EO fills its 11 sections here (finance, tickets, vendors, sponsors,
// …), Security fills its 3 sections from Crowd Monitoring / Incident Center,
// and the Manager reviews everything on its own Reports page.
export function ReportManagement() {
  const { current, loaded, saveSection, submitReport, createReport, deleteReport, fetchActive } = useLpjStore()
  const concertInfo = useDashboardStore((s) => s.concertInfo)

  const [createOpen, setCreateOpen] = useState(false)
  const [openKey, setOpenKey] = useState<string | null>(null)
  const [submitOpen, setSubmitOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  useEffect(() => {
    fetchActive()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const mySections = (current?.sections ?? []).filter((s) => s.ownerRole === 'admin')
  const myConfigs = LPJ_SECTION_CONFIGS.filter((c) => c.owner === 'admin')
  const submittedCount = mySections.filter((s) => s.status === 'Submitted').length
  const locked = current?.status === 'Approved'

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-ink">Report Management</h1>
          <p className="text-ink-faint text-sm mt-1">
            Input seluruh laporan pertanggungjawaban konser aktif — kepanitiaan, pelaksanaan, dokumentasi, keuangan, tiket, evaluasi, kehadiran, media, sponsor, dan vendor.
          </p>
        </div>
        {current && (
          <div className="flex items-center gap-2">
            <StatusBadge status={current.status} />
            {!locked && (
              <>
                <Button size="sm" onClick={() => setSubmitOpen(true)}>
                  <Send className="w-3.5 h-3.5 mr-1.5" /> Submit Report to Manager
                </Button>
                <button
                  onClick={() => setDeleteOpen(true)}
                  title="Hapus laporan"
                  className="p-2 rounded-xl hover:bg-glass/[0.06] text-ink-faint hover:text-status-danger transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        )}
      </motion.div>

      {!loaded ? (
        <p className="text-sm text-ink-faint py-8 text-center">Memuat…</p>
      ) : !current ? (
        <GlassCard hover={false}>
          <div className="text-center py-10 space-y-4">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-display font-semibold text-ink">Belum ada laporan untuk konser aktif</h2>
              <p className="text-sm text-ink-faint mt-1 max-w-md mx-auto">
                Mulai dengan mengisi informasi dasar konser. Setelah dibuat, bagian keamanan otomatis tersedia untuk diisi Security Team.
              </p>
            </div>
            <button onClick={() => setCreateOpen(true)} className="btn-primary inline-flex items-center gap-1.5 px-4 py-2.5 text-sm">
              <Plus className="w-4 h-4" /> Buat Laporan Konser Ini
            </button>
          </div>
        </GlassCard>
      ) : (
        <>
          <GlassCard hover={false}>
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <h2 className="font-display font-semibold text-ink">{current.concertName}</h2>
                <p className="text-xs text-ink-faint mt-1">
                  {current.theme && `"${current.theme}" · `}{current.location} · {current.eventDate} {current.eventTime} · {current.organizer}
                </p>
              </div>
              <span className="text-xs text-ink-faint">
                {submittedCount}/{mySections.length} bagian Admin/EO terkirim
                {locked && ' — laporan disetujui & terkunci'}
              </span>
            </div>
          </GlassCard>

          <div className="space-y-4">
            {myConfigs.map((config) => {
              const section = mySections.find((s) => s.key === config.key)
              if (!section) return null
              const open = openKey === config.key
              return (
                <GlassCard key={config.key} hover={false} className="!p-0 overflow-hidden">
                  <button
                    onClick={() => setOpenKey(open ? null : config.key)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-glass/[0.03] transition-colors"
                  >
                    <span className="font-display font-semibold text-ink">{config.label}</span>
                    <span className="flex items-center gap-3">
                      <StatusBadge status={section.status} />
                      <ChevronDown className={cn('w-4 h-4 text-ink-faint transition-transform', open && 'rotate-180')} />
                    </span>
                  </button>
                  {open && (
                    <div className="px-5 pb-5 border-t border-glass/[0.06] pt-4">
                      <SectionEditor
                        section={section}
                        config={config}
                        editable={!locked}
                        onSave={(data) => saveSection(current.id, config.key, data)}
                      />
                    </div>
                  )}
                </GlassCard>
              )
            })}
          </div>
        </>
      )}

      <CreateLpjDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaults={{ concertName: concertInfo.name, location: concertInfo.venue, eventDate: concertInfo.date }}
        onSubmit={(input) => createReport(input)}
      />
      <ConfirmDialog
        open={submitOpen}
        onOpenChange={setSubmitOpen}
        title="Submit Report to Manager"
        description={`Kirim ${mySections.length} bagian laporan Admin/EO ke Manager untuk direview? Status berubah menjadi Waiting Manager Review setelah semua role mengirim.`}
        onConfirm={() => {
          if (current) submitReport(current.id)
          setSubmitOpen(false)
        }}
      />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Hapus Laporan"
        description={`Hapus laporan "${current?.concertName}"? Seluruh isian semua role ikut terhapus.`}
        onConfirm={() => {
          if (current) deleteReport(current.id)
          setDeleteOpen(false)
        }}
      />
    </div>
  )
}
