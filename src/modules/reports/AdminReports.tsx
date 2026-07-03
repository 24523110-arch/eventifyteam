import { useEffect, useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import { Ticket, Wallet, Undo2, TicketX, TrendingDown, Send, Store } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line,
} from 'recharts'
import { useDashboardStore } from '@/store/dashboardStore'
import { useVendorStore } from '@/store/vendorStore'
import { GlassCard } from '@/components/GlassCard'
import { ProgressBar } from '@/components/ProgressBar'
import { StatusBadge } from '@/components/StatusBadge'
import { formatIDR, formatNumber, percentage } from '@/utils'

const tooltipStyle = { background: '#141124', border: '1px solid rgba(168,85,247,0.25)', borderRadius: 12, fontSize: 12 }

// Reports + Ticket Sales merged into one Admin/Event Organizer feature.
// The manual ticket & finance report entered here is what the Manager's AI
// evaluation report reads (alongside the Security Team's incident record) —
// there's no separate "field report" step anymore.
export function AdminReports() {
  const { ticketSummary, financeSummary, hourlySales, dailyRevenue, checkInConversion, updateTicketSummary, updateFinance } =
    useDashboardStore()
  const vendors = useVendorStore((s) => s.vendors)

  const [soldInput, setSoldInput] = useState('')
  const [remainingInput, setRemainingInput] = useState('')
  const [revenueInput, setRevenueInput] = useState('')
  const [expensesInput, setExpensesInput] = useState('')
  const [saving, setSaving] = useState(false)

  // Sync forms to the stored figures — only re-fires when the stored values
  // actually change (e.g. after this same form saves), so it never clobbers
  // a draft the user is mid-typing.
  useEffect(() => {
    setSoldInput(String(ticketSummary.sold))
    setRemainingInput(String(ticketSummary.remaining))
  }, [ticketSummary.sold, ticketSummary.remaining])

  useEffect(() => {
    setRevenueInput(String(financeSummary.revenue))
    setExpensesInput(String(financeSummary.expenses))
  }, [financeSummary.revenue, financeSummary.expenses])

  const vendorsByStatus = vendors.reduce<Record<string, number>>((acc, v) => {
    acc[v.status] = (acc[v.status] ?? 0) + 1
    return acc
  }, {})

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (soldInput === '' || remainingInput === '' || revenueInput === '' || expensesInput === '') return
    setSaving(true)
    await Promise.all([
      updateTicketSummary({ sold: Number(soldInput), remaining: Number(remainingInput) }),
      updateFinance(Number(revenueInput), Number(expensesInput)),
    ])
    setSaving(false)
  }

  const ticketKpis = [
    { label: 'Tickets Sold', value: formatNumber(ticketSummary.sold), icon: Ticket },
    { label: 'Ticket Revenue', value: formatIDR(ticketSummary.revenue), icon: Wallet },
    { label: 'Remaining Tickets', value: formatNumber(ticketSummary.remaining), icon: TicketX },
    { label: 'Refunds', value: formatNumber(ticketSummary.refunds), icon: Undo2 },
  ]

  const financeKpis = [
    { label: 'Total Pendapatan', value: formatIDR(financeSummary.revenue), icon: Wallet },
    { label: 'Total Pengeluaran', value: formatIDR(financeSummary.expenses), icon: TrendingDown },
    { label: 'Profit', value: formatIDR(financeSummary.profit), icon: Wallet },
    { label: 'Margin', value: `${financeSummary.margin.toFixed(1)}%`, icon: TrendingDown },
  ]

  const disableSubmit = saving || soldInput === '' || remainingInput === '' || revenueInput === '' || expensesInput === ''

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-display font-bold text-ink">Reports & Ticket Sales</h1>
        <p className="text-ink-faint text-sm mt-1">
          Laporan tiket &amp; keuangan konser — langsung tergabung ke laporan evaluasi AI milik Manager.
        </p>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {ticketKpis.map((kpi, i) => (
          <GlassCard key={kpi.label} delay={i * 0.05} hover={false}>
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-medium text-ink-faint uppercase tracking-wider">{kpi.label}</span>
                <div className="text-xl font-display font-bold text-ink mt-1">{kpi.value}</div>
              </div>
              <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                <kpi.icon className="w-4 h-4 text-primary" />
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {financeKpis.map((kpi, i) => (
          <GlassCard key={kpi.label} delay={0.2 + i * 0.05} hover={false}>
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-medium text-ink-faint uppercase tracking-wider">{kpi.label}</span>
                <div className="text-xl font-display font-bold text-ink mt-1">{kpi.value}</div>
              </div>
              <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
                <kpi.icon className="w-4 h-4 text-primary" />
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Unified manual report — ticket counts + finance totals in one
          submit. No refund input (fixed/reconciled separately). */}
      <GlassCard delay={0.1} hover={false}>
        <div className="flex items-center gap-2.5 mb-5">
          <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
            <Send className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="font-display font-semibold text-ink">Input Laporan Tiket &amp; Keuangan</h2>
            <p className="text-xs text-ink-faint mt-0.5">
              Tersimpan langsung ke laporan evaluasi AI Manager, bersama ringkasan insiden dari Security Team.
            </p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-ink-muted mb-1.5 block">Tiket Terjual</label>
              <input type="number" min="0" value={soldInput} onChange={(e) => setSoldInput(e.target.value)} className="input-glass" />
            </div>
            <div>
              <label className="text-xs font-medium text-ink-muted mb-1.5 block">Tiket Tersisa</label>
              <input type="number" min="0" value={remainingInput} onChange={(e) => setRemainingInput(e.target.value)} className="input-glass" />
            </div>
            <div>
              <label className="text-xs font-medium text-ink-muted mb-1.5 block">Total Pendapatan (Rp)</label>
              <input type="number" min="0" value={revenueInput} onChange={(e) => setRevenueInput(e.target.value)} className="input-glass" />
            </div>
            <div>
              <label className="text-xs font-medium text-ink-muted mb-1.5 block">Total Pengeluaran (Rp)</label>
              <input type="number" min="0" value={expensesInput} onChange={(e) => setExpensesInput(e.target.value)} className="input-glass" />
            </div>
          </div>
          <button type="submit" disabled={disableSubmit} className="btn-primary flex items-center gap-2 px-4 py-2.5 text-sm disabled:opacity-60">
            <Send className="w-4 h-4" /> {saving ? 'Menyimpan…' : 'Simpan Laporan'}
          </button>
        </form>
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard delay={0.2} hover={false}>
          <h2 className="font-display font-semibold text-ink mb-5">Hourly Sales</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={hourlySales} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="hour" stroke="#8B85A8" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#8B85A8" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#C4B5FD' }} />
              <Bar dataKey="tickets" fill="#A855F7" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard delay={0.25} hover={false}>
          <h2 className="font-display font-semibold text-ink mb-5">Daily Revenue (M)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={dailyRevenue} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="day" stroke="#8B85A8" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#8B85A8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}M`} />
              <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#C4B5FD' }} />
              <Line type="monotone" dataKey="revenue" stroke="#D946EF" strokeWidth={2} dot={{ fill: '#D946EF', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>

      <GlassCard delay={0.3} hover={false}>
        <h2 className="font-display font-semibold text-ink mb-5">Check-In Conversion</h2>
        <div className="space-y-4">
          {checkInConversion.map((stage, i) => {
            const pct = percentage(stage.value, checkInConversion[0]?.value ?? 0)
            return (
              <div key={stage.stage}>
                <div className="flex items-center justify-between mb-1.5 text-sm">
                  <span className="text-ink font-medium">{stage.stage}</span>
                  <span className="text-ink-faint">{formatNumber(stage.value)} ({pct}%)</span>
                </div>
                <ProgressBar value={pct} delay={0.35 + i * 0.1} />
              </div>
            )
          })}
        </div>
      </GlassCard>

      <GlassCard delay={0.4} hover={false}>
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
    </div>
  )
}
