import { motion } from 'framer-motion'
import { Users, Gauge, BarChart2 } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useDashboardStore } from '@/store/dashboardStore'
import { GlassCard } from '@/components/GlassCard'
import { CrowdHeatmap } from '@/components/CrowdHeatmap'
import { percentage, formatNumber } from '@/utils'

const tooltipStyle = { background: '#141124', border: '1px solid rgba(168,85,247,0.25)', borderRadius: 12, fontSize: 12 }

export function CrowdMonitoring() {
  const { crowdZones, densityTrend } = useDashboardStore()

  const totalCapacity = crowdZones.reduce((sum, z) => sum + z.capacity, 0)
  const totalCurrent = crowdZones.reduce((sum, z) => sum + z.current, 0)

  const kpis = [
    { label: 'Current Crowd', value: formatNumber(totalCurrent), icon: Users },
    { label: 'Maximum Capacity', value: formatNumber(totalCapacity), icon: Gauge },
    { label: 'Occupancy Rate', value: `${percentage(totalCurrent, totalCapacity)}%`, icon: BarChart2 },
  ]

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-display font-bold text-ink">Crowd Monitoring</h1>
        <p className="text-ink-faint text-sm mt-1">Real-time density and occupancy across all zones.</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

      <GlassCard delay={0.2} hover={false}>
        <h2 className="font-display font-semibold text-ink mb-5">Density Trend</h2>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={densityTrend} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="densityFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#A855F7" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#A855F7" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="time" stroke="#8B85A8" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="#8B85A8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
            <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#C4B5FD' }} />
            <Area type="monotone" dataKey="density" stroke="#A855F7" strokeWidth={2} fill="url(#densityFill)" />
          </AreaChart>
        </ResponsiveContainer>
      </GlassCard>

      <GlassCard delay={0.25} hover={false}>
        <h2 className="font-display font-semibold text-ink mb-5">Zone Density</h2>
        <CrowdHeatmap zones={crowdZones} />
      </GlassCard>
    </div>
  )
}
