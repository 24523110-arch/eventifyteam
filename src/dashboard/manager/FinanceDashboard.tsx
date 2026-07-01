import { motion } from 'framer-motion'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import { Wallet, TrendingDown, TrendingUp, Percent } from 'lucide-react'
import { useDashboardStore } from '@/store/dashboardStore'
import { GlassCard } from '@/components/GlassCard'
import { formatIDR } from '@/utils'

const PIE_COLORS = ['#A855F7', '#D946EF', '#EC4899', '#9333EA', '#7C3AED']

const TONE_CLASS = {
  success: 'text-status-success bg-status-success/15 border-status-success/30',
  danger: 'text-status-danger bg-status-danger/15 border-status-danger/30',
  info: 'text-status-info bg-status-info/15 border-status-info/30',
} as const

export function FinanceDashboard() {
  const { financeSummary, financeBreakdown, revenueTrend } = useDashboardStore()

  const kpis = [
    { label: 'Revenue', value: formatIDR(financeSummary.revenue), icon: Wallet, tone: 'success' as const },
    { label: 'Expenses', value: formatIDR(financeSummary.expenses), icon: TrendingDown, tone: 'danger' as const },
    { label: 'Profit', value: formatIDR(financeSummary.profit), icon: TrendingUp, tone: 'success' as const },
    { label: 'Profit Margin', value: `${financeSummary.margin}%`, icon: Percent, tone: 'info' as const },
  ]

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-display font-bold text-ink">Finance</h1>
        <p className="text-ink-faint text-sm mt-1">Revenue, expenses, and profitability for this event.</p>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <GlassCard key={kpi.label} delay={i * 0.06} hover={false}>
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-medium text-ink-faint uppercase tracking-wider">{kpi.label}</span>
                <div className="text-2xl font-display font-bold text-ink mt-1">{kpi.value}</div>
              </div>
              <div className={`p-2.5 rounded-xl border ${TONE_CLASS[kpi.tone]}`}>
                <kpi.icon className="w-5 h-5" />
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <GlassCard delay={0.2} className="lg:col-span-2" hover={false}>
          <h2 className="font-display font-semibold text-ink mb-5">Expense Breakdown</h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={financeBreakdown} dataKey="amount" nameKey="category" innerRadius={55} outerRadius={90} paddingAngle={3}>
                {financeBreakdown.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="#0A0715" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#141124', border: '1px solid rgba(168,85,247,0.25)', borderRadius: 12, fontSize: 12 }}
                formatter={(v: number) => formatIDR(v)}
              />
              <Legend wrapperStyle={{ fontSize: 11, color: '#8B85A8' }} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard delay={0.25} className="lg:col-span-3" hover={false}>
          <h2 className="font-display font-semibold text-ink mb-5">Profit &amp; Loss Trend</h2>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={revenueTrend} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="plFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22C55E" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#22C55E" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="time" stroke="#8B85A8" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#8B85A8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}M`} />
              <Tooltip
                contentStyle={{ background: '#141124', border: '1px solid rgba(168,85,247,0.25)', borderRadius: 12, fontSize: 12 }}
                labelStyle={{ color: '#C4B5FD' }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#22C55E" strokeWidth={2} fill="url(#plFill)" name="Net (M)" />
            </AreaChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>
    </div>
  )
}
