import { motion } from 'framer-motion'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useDashboardStore } from '@/store/dashboardStore'
import { useNotificationStore } from '@/store/notificationStore'
import { KpiCard } from '@/components/KpiCard'
import { GlassCard } from '@/components/GlassCard'
import { CrowdHeatmap } from '@/components/CrowdHeatmap'

const ACTIVITY_DOT: Record<string, string> = {
  security: 'bg-status-danger',
  finance: 'bg-status-success',
  vendor: 'bg-status-info',
  ticket: 'bg-status-info',
  system: 'bg-primary',
}

export function ManagerDashboard() {
  const { managerKpis, revenueTrend, crowdZones } = useDashboardStore()
  const { activityFeed } = useNotificationStore()

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-display font-bold text-ink">Manager Dashboard</h1>
        <p className="text-ink-faint text-sm mt-1">Business performance summary for this event.</p>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {managerKpis.map((kpi, i) => (
          <KpiCard key={kpi.id} {...kpi} delay={i * 0.05} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard delay={0.15} className="lg:col-span-2" hover={false}>
          <h2 className="font-display font-semibold text-ink mb-5">Revenue Trend</h2>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={revenueTrend} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#A855F7" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#A855F7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="time" stroke="#8B85A8" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#8B85A8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}M`} />
              <Tooltip
                contentStyle={{ background: '#141124', border: '1px solid rgba(168,85,247,0.25)', borderRadius: 12, fontSize: 12 }}
                labelStyle={{ color: '#C4B5FD' }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#A855F7" strokeWidth={2} fill="url(#revenueFill)" name="Revenue (M)" />
            </AreaChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard delay={0.2} className="lg:col-span-1" hover={false}>
          <h2 className="font-display font-semibold text-ink mb-5 flex items-center gap-2">
            Activity Feed
            <span className="live-dot" />
          </h2>
          <div className="space-y-3.5 max-h-64 overflow-y-auto scrollbar-thin pr-1">
            {activityFeed.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + i * 0.05 }}
                className="flex items-start gap-2.5"
              >
                <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${ACTIVITY_DOT[item.type] ?? 'bg-primary'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-ink leading-relaxed">{item.message}</p>
                  <span className="text-[10px] text-ink-faint">{item.time}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </GlassCard>
      </div>

      <GlassCard delay={0.25} hover={false}>
        <h2 className="font-display font-semibold text-ink mb-5">Crowd Overview</h2>
        <CrowdHeatmap zones={crowdZones} />
      </GlassCard>
    </div>
  )
}
