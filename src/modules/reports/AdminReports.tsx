import { useEffect, useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import { Ticket, Store, Clock, Send, ClipboardList } from 'lucide-react'
import { useDashboardStore } from '@/store/dashboardStore'
import { useVendorStore } from '@/store/vendorStore'
import { useFieldReportStore } from '@/store/fieldReportStore'
import { GlassCard } from '@/components/GlassCard'
import { StatusBadge } from '@/components/StatusBadge'
import { formatNumber } from '@/utils'
import type { FieldReportCategory } from '@/types'

const CATEGORIES: FieldReportCategory[] = ['Operasional', 'Vendor', 'Tiket', 'Umum']

export function AdminReports() {
  const { ticketSummary, concertInfo } = useDashboardStore()
  const vendors = useVendorStore((s) => s.vendors)
  const reports = useFieldReportStore((s) => s.reports)
  const createReport = useFieldReportStore((s) => s.createReport)

  const [category, setCategory] = useState<FieldReportCategory>('Operasional')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    useFieldReportStore.getState().fetchReports()
  }, [])

  const vendorsByStatus = vendors.reduce<Record<string, number>>((acc, v) => {
    acc[v.status] = (acc[v.status] ?? 0) + 1
    return acc
  }, {})

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return
    setSubmitting(true)
    const ok = await createReport({ category, title: title.trim(), content: content.trim() })
    setSubmitting(false)
    if (ok) {
      setTitle('')
      setContent('')
      setCategory('Operasional')
    }
  }

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-display font-bold text-ink">Reports</h1>
        <p className="text-ink-faint text-sm mt-1">
          Kirim laporan lapangan ke Manager & lihat ringkasan operasional {concertInfo.name}.
        </p>
      </motion.div>

      {/* Manual field report — submitted from the venue, routed to the Manager */}
      <GlassCard delay={0.03} hover={false}>
        <div className="flex items-center gap-2.5 mb-5">
          <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
            <Send className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="font-display font-semibold text-ink">Kirim Laporan Lapangan</h2>
            <p className="text-xs text-ink-faint mt-0.5">
              Laporan masuk ke halaman Reports Manager dan digabung otomatis ke dalam laporan evaluasi AI (di luar laporan keamanan/insiden — itu tetap milik Security Team).
            </p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label className="text-xs font-medium text-ink-muted mb-1.5 block">Kategori</label>
              <select value={category} onChange={(e) => setCategory(e.target.value as FieldReportCategory)} className="input-glass">
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-ink-muted mb-1.5 block">Judul</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="mis. Antrean Gate A padat" className="input-glass" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-ink-muted mb-1.5 block">Isi Laporan</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              placeholder="Deskripsikan kondisi di lokasi…"
              className="input-glass resize-none"
            />
          </div>
          <button type="submit" disabled={submitting || !title.trim() || !content.trim()} className="btn-primary flex items-center gap-2 px-4 py-2.5 text-sm disabled:opacity-60">
            <Send className="w-4 h-4" /> {submitting ? 'Mengirim…' : 'Kirim ke Manager'}
          </button>
        </form>

        {reports.length > 0 && (
          <div className="mt-6 pt-5 border-t border-white/[0.06]">
            <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-ink-faint uppercase tracking-wider">
              <ClipboardList className="w-3.5 h-3.5" /> Laporan terkirim
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
              {reports.map((r) => (
                <div key={r.id} className="glass rounded-xl p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-ink">{r.title}</span>
                    <StatusBadge status={r.category} className="shrink-0" />
                  </div>
                  <p className="text-xs text-ink-faint mt-1">{r.content}</p>
                  <span className="text-[10px] text-ink-faint/70">{r.author} · {r.createdAt}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </GlassCard>

      <GlassCard delay={0.05} hover={false}>
        <div className="flex items-center gap-2.5 mb-5">
          <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
            <Ticket className="w-4 h-4 text-primary" />
          </div>
          <h2 className="font-display font-semibold text-ink">Ticketing Summary</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="glass rounded-xl p-3.5">
            <span className="text-xs text-ink-faint">Sold</span>
            <div className="text-lg font-display font-bold text-ink mt-1">{formatNumber(ticketSummary.sold)}</div>
          </div>
          <div className="glass rounded-xl p-3.5">
            <span className="text-xs text-ink-faint">Remaining</span>
            <div className="text-lg font-display font-bold text-ink mt-1">{formatNumber(ticketSummary.remaining)}</div>
          </div>
          <div className="glass rounded-xl p-3.5">
            <span className="text-xs text-ink-faint">Refunds</span>
            <div className="text-lg font-display font-bold text-ink mt-1">{formatNumber(ticketSummary.refunds)}</div>
          </div>
          <div className="glass rounded-xl p-3.5">
            <span className="text-xs text-ink-faint">Attendance</span>
            <div className="text-lg font-display font-bold text-ink mt-1">{formatNumber(concertInfo.attendance)}</div>
          </div>
        </div>
      </GlassCard>

      <GlassCard delay={0.1} hover={false}>
        <div className="flex items-center gap-2.5 mb-5">
          <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
            <Store className="w-4 h-4 text-primary" />
          </div>
          <h2 className="font-display font-semibold text-ink">Vendor Status Breakdown</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          {Object.entries(vendorsByStatus).map(([status, count]) => (
            <div key={status} className="glass rounded-xl px-4 py-3 flex items-center gap-3">
              <StatusBadge status={status} />
              <span className="text-sm font-semibold text-ink">{count}</span>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard delay={0.15} hover={false} className="flex items-start gap-3">
        <Clock className="w-4 h-4 text-ink-faint shrink-0 mt-0.5" />
        <p className="text-sm text-ink-faint">
          Financial evaluation reports with AI-generated insights are available to Manager accounts under their
          Reports page.
        </p>
      </GlassCard>
    </div>
  )
}
