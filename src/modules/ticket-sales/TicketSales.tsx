import { motion } from 'framer-motion'
import { Ticket, Wallet, Undo2, TicketX } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line,
} from 'recharts'
import { useDashboardStore } from '@/store/dashboardStore'
import { GlassCard } from '@/components/GlassCard'
import { ProgressBar } from '@/components/ProgressBar'
import { formatIDR, formatNumber, percentage } from '@/utils'

const tooltipStyle = { background: '#141124', border: '1px solid rgba(168,85,247,0.25)', borderRadius: 12, fontSize: 12 }

export function TicketSales() {
  const { ticketSummary, hourlySales, dailyRevenue, checkInConversion } = useDashboardStore()

  const kpis = [
    { label: 'Tickets Sold', value: formatNumber(ticketSummary.sold), icon: Ticket },
    { label: 'Revenue', value: formatIDR(ticketSummary.revenue), icon: Wallet },
    { label: 'Refunds', value: formatNumber(ticketSummary.refunds), icon: Undo2 },
    { label: 'Remaining Tickets', value: formatNumber(ticketSummary.remaining), icon: TicketX },
  ]

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-display font-bold text-ink">Ticket Sales</h1>
        <p className="text-ink-faint text-sm mt-1">Sales velocity, revenue, and check-in conversion.</p>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <GlassCard key={kpi.label} delay={i * 0.06} hover={false}>
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-medium text-ink-faint uppercase tracking-wider">{kpi.label}</span>
                <div className="text-2xl font-display font-bold text-ink mt-1">{kpi.value}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
                <kpi.icon className="w-5 h-5 text-primary" />
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

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
            const pct = percentage(stage.value, checkInConversion[0].value)
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
    </div>
  )
}
