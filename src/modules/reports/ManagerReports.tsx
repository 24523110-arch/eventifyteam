import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  FileCheck2, Sparkles, ChevronDown, Undo2, PenLine,
  FileDown, FileText, Printer, Mail, Link2, BadgeCheck,
} from 'lucide-react'
import { useLpjStore } from '@/store/lpjStore'
import { useAuthStore } from '@/store/authStore'
import { useToastStore } from '@/store/toastStore'
import { GlassCard } from '@/components/GlassCard'
import { StatusBadge } from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { SectionEditor } from '@/modules/report-management/SectionEditor'
import { SECTION_CONFIG_BY_KEY } from '@/modules/report-management/sectionConfig'
import { cn } from '@/utils'
import type { LpjNarrative, LpjSection } from '@/types'

const NARRATIVE_PARTS: { key: keyof LpjNarrative; label: string }[] = [
  { key: 'kataPengantar', label: 'Kata Pengantar' },
  { key: 'latarBelakang', label: 'Pendahuluan — Latar Belakang' },
  { key: 'tujuanKegiatan', label: 'Pendahuluan — Tujuan Kegiatan' },
  { key: 'temaKonser', label: 'Pendahuluan — Tema Konser' },
  { key: 'profilKegiatan', label: 'Profil Kegiatan Konser' },
  { key: 'penutup', label: 'Penutup' },
]

// Groups match server/src/lpj/registry.js — completion rolled up per report.
const GROUP_ORDER = ['Admin Report', 'Finance Report', 'Ticket Report', 'Sponsor Report', 'Vendor Report', 'Security Report']

// Manager's Reports page: everything the Admin/EO and Security Team submit
// for the active concert lands here — per-section review (with return-for-
// revision), the AI Generate Report step, narrative editing, approval with a
// digital signature, and PDF/Word export.
export function ManagerReports() {
  const user = useAuthStore((s) => s.user)
  const showToast = useToastStore((s) => s.show)
  const { current, loaded, isGenerating, fetchActive, returnSection, generate, saveNarrative, approve, exportFile } = useLpjStore()

  const [openKey, setOpenKey] = useState<string | null>(null)
  const [returnTarget, setReturnTarget] = useState<LpjSection | null>(null)
  const [returnNote, setReturnNote] = useState('')
  const [approveOpen, setApproveOpen] = useState(false)
  const [signature, setSignature] = useState('')
  const [narrativeDraft, setNarrativeDraft] = useState<LpjNarrative | null>(null)

  useEffect(() => {
    fetchActive()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    setNarrativeDraft(current?.narrative ?? null)
  }, [current?.id, current?.narrative])

  const sections = current?.sections ?? []
  const groups = useMemo(() => {
    const byGroup = new Map<string, LpjSection[]>()
    sections.forEach((s) => byGroup.set(s.group, [...(byGroup.get(s.group) ?? []), s]))
    return GROUP_ORDER.filter((g) => byGroup.has(g)).map((g) => ({ name: g, sections: byGroup.get(g)! }))
  }, [sections])

  const submitted = sections.filter((s) => s.status === 'Submitted').length
  const progressPct = sections.length ? Math.round((submitted / sections.length) * 100) : 0
  const allSubmitted = sections.length > 0 && submitted === sections.length
  const approved = current?.status === 'Approved'

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-ink">Concert Report Dashboard</h1>
          <p className="text-ink-faint text-sm mt-1">
            Seluruh laporan yang diinput Admin/EO dan Security Team untuk konser aktif masuk ke sini — review, generate dengan AI, setujui, lalu ekspor.
          </p>
        </div>
        {current && <StatusBadge status={current.status} />}
      </motion.div>

      {!loaded ? (
        <p className="text-sm text-ink-faint py-8 text-center">Memuat…</p>
      ) : !current ? (
        <GlassCard hover={false}>
          <div className="text-center py-10">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-3">
              <FileCheck2 className="w-5 h-5 text-primary" />
            </div>
            <h2 className="font-display font-semibold text-ink">Belum ada laporan untuk konser aktif</h2>
            <p className="text-sm text-ink-faint mt-1">Menunggu Admin/EO membuat laporan di Report Management.</p>
          </div>
        </GlassCard>
      ) : (
        <>
          <GlassCard hover={false}>
            <div className="flex items-start justify-between flex-wrap gap-3 mb-3">
              <div>
                <h2 className="font-display font-semibold text-ink">{current.concertName}</h2>
                <p className="text-xs text-ink-faint mt-1">
                  {current.location} · {current.eventDate} · {current.organizer}
                  {approved && ` · Disetujui ${current.approvedAt} oleh ${current.approvedBy}`}
                </p>
              </div>
              <span className="text-xs text-ink-faint">{submitted}/{sections.length} bagian terkirim</span>
            </div>
            <div className="h-2 rounded-full bg-glass/[0.06] overflow-hidden mb-5">
              <div className="h-full bg-neon-gradient rounded-full transition-all" style={{ width: `${progressPct}%` }} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {groups.map((g) => {
                const done = g.sections.filter((s) => s.status === 'Submitted').length
                return (
                  <div key={g.name} className="px-3 py-2.5 rounded-xl bg-glass/[0.04] border border-glass/10">
                    <div className="text-[10px] text-ink-faint uppercase tracking-wider">{g.name}</div>
                    <div className="text-sm font-bold text-ink mt-0.5">{done}/{g.sections.length}</div>
                  </div>
                )
              })}
            </div>
          </GlassCard>

          <div className="space-y-3">
            <h2 className="font-display font-semibold text-ink">Review Bagian Laporan</h2>
            {sections.map((section) => {
              const config = SECTION_CONFIG_BY_KEY[section.key]
              if (!config) return null
              const open = openKey === section.key
              return (
                <GlassCard key={section.key} hover={false} className="!p-0 overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3.5">
                    <button onClick={() => setOpenKey(open ? null : section.key)} className="flex-1 flex items-center gap-3 text-left min-w-0">
                      <ChevronDown className={cn('w-4 h-4 text-ink-faint transition-transform shrink-0', open && 'rotate-180')} />
                      <span className="font-medium text-ink truncate">{section.label}</span>
                      <span className="text-[10px] text-ink-faint uppercase shrink-0">({section.ownerRole})</span>
                    </button>
                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge status={section.status} />
                      {!approved && section.status === 'Submitted' && (
                        <button
                          onClick={() => { setReturnTarget(section); setReturnNote('') }}
                          title="Kembalikan untuk revisi"
                          className="p-1.5 rounded-lg hover:bg-glass/[0.06] text-ink-faint hover:text-status-warning transition-colors"
                        >
                          <Undo2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  {open && (
                    <div className="px-5 pb-5 border-t border-glass/[0.06] pt-4">
                      <SectionEditor section={section} config={config} editable={false} />
                    </div>
                  )}
                </GlassCard>
              )
            })}
          </div>

          <GlassCard hover={false}>
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
              <h2 className="font-display font-semibold text-ink flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" /> Narasi Laporan (AI)
              </h2>
              {!approved && (
                <Button size="sm" disabled={!allSubmitted || isGenerating} onClick={() => generate(current.id)}>
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                  {isGenerating ? 'Menyusun laporan…' : current.narrative ? 'Generate Ulang' : 'Generate LPJ with AI'}
                </Button>
              )}
            </div>
            {!allSubmitted && !current.narrative && (
              <p className="text-sm text-ink-faint">Tombol generate aktif setelah semua bagian dari Admin/EO dan Security Team berstatus Submitted.</p>
            )}
            {narrativeDraft && (
              <div className="space-y-4">
                {current.narrativeSource && (
                  <p className="text-xs text-ink-faint">
                    Sumber narasi: {current.narrativeSource === 'ai' ? 'Claude AI' : 'generator lokal (tanpa API key)'} — data isian setiap role tidak diubah, AI hanya menyusun bagian naratif.
                  </p>
                )}
                {NARRATIVE_PARTS.map((p) => (
                  <div key={p.key}>
                    <Label>{p.label}</Label>
                    <textarea
                      value={narrativeDraft[p.key] ?? ''}
                      onChange={(e) => setNarrativeDraft((n) => (n ? { ...n, [p.key]: e.target.value } : n))}
                      disabled={approved}
                      rows={4}
                      className="input-glass resize-y text-sm leading-relaxed"
                    />
                  </div>
                ))}
                {!approved && (
                  <div className="flex justify-end">
                    <Button size="sm" variant="ghost" onClick={() => narrativeDraft && saveNarrative(current.id, narrativeDraft)}>
                      <PenLine className="w-3.5 h-3.5 mr-1.5" /> Simpan Hasil Edit Narasi
                    </Button>
                  </div>
                )}
              </div>
            )}
          </GlassCard>

          <GlassCard hover={false}>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="font-display font-semibold text-ink flex items-center gap-2">
                  <BadgeCheck className="w-4 h-4 text-primary" /> Persetujuan & Ekspor
                </h2>
                <p className="text-xs text-ink-faint mt-1">
                  {approved
                    ? `Ditandatangani secara digital oleh ${current.approvedBy} pada ${current.approvedAt}.`
                    : 'Setujui laporan untuk membubuhkan tanda tangan digital dan tanggal persetujuan.'}
                </p>
              </div>
              {!approved && (
                <Button size="sm" disabled={!current.narrative} onClick={() => { setSignature(user?.name ?? ''); setApproveOpen(true) }}>
                  <BadgeCheck className="w-3.5 h-3.5 mr-1.5" /> Setujui & Tanda Tangani
                </Button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <Button size="sm" variant="ghost" onClick={() => exportFile(current.id, 'pdf')}>
                <FileDown className="w-3.5 h-3.5 mr-1.5" /> PDF
              </Button>
              <Button size="sm" variant="ghost" onClick={() => exportFile(current.id, 'docx')}>
                <FileText className="w-3.5 h-3.5 mr-1.5" /> Word (.docx)
              </Button>
              <Button size="sm" variant="ghost" onClick={() => exportFile(current.id, 'pdf').then(() => showToast('Buka file PDF lalu cetak (Ctrl/Cmd+P).', 'success'))}>
                <Printer className="w-3.5 h-3.5 mr-1.5" /> Print Ready
              </Button>
              <span className="w-px h-5 bg-glass/10 mx-1" />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  window.location.href = `mailto:?subject=${encodeURIComponent(`Laporan ${current.concertName}`)}&body=${encodeURIComponent(`Laporan Pertanggungjawaban "${current.concertName}" dapat diakses di: ${window.location.origin}/reports`)}`
                }}
              >
                <Mail className="w-3.5 h-3.5 mr-1.5" /> Email
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(`${window.location.origin}/reports`)
                    showToast('Tautan laporan disalin ke clipboard.', 'success')
                  } catch {
                    showToast('Gagal menyalin tautan.', 'error')
                  }
                }}
              >
                <Link2 className="w-3.5 h-3.5 mr-1.5" /> Share Link
              </Button>
            </div>
          </GlassCard>
        </>
      )}

      <Dialog open={!!returnTarget} onOpenChange={(o) => !o && setReturnTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kembalikan "{returnTarget?.label}"</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-ink-faint">Bagian ini akan dikembalikan ke role {returnTarget?.ownerRole} dengan catatan revisi.</p>
            <div>
              <Label>Catatan Revisi</Label>
              <textarea
                value={returnNote}
                onChange={(e) => setReturnNote(e.target.value)}
                rows={3}
                className="input-glass resize-y"
                placeholder="Jelaskan data apa yang kurang atau perlu diperbaiki…"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setReturnTarget(null)}>Batal</Button>
            <Button
              size="sm"
              disabled={!returnNote.trim()}
              onClick={async () => {
                if (returnTarget && current) await returnSection(current.id, returnTarget.key, returnNote.trim())
                setReturnTarget(null)
              }}
            >
              <Undo2 className="w-3.5 h-3.5 mr-1.5" /> Kembalikan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Setujui Laporan</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-ink-faint">
              Nama di bawah dibubuhkan sebagai tanda tangan digital pada Lembar Pengesahan beserta tanggal persetujuan hari ini. Setelah disetujui, laporan terkunci.
            </p>
            <div>
              <Label>Nama Penandatangan</Label>
              <Input value={signature} onChange={(e) => setSignature(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setApproveOpen(false)}>Batal</Button>
            <Button
              size="sm"
              disabled={!signature.trim()}
              onClick={async () => {
                if (current) await approve(current.id, signature.trim())
                setApproveOpen(false)
              }}
            >
              <BadgeCheck className="w-3.5 h-3.5 mr-1.5" /> Setujui & Tanda Tangani
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
