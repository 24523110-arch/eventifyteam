import { motion } from 'framer-motion'
import { Radio, Music4, Users, AlertTriangle } from 'lucide-react'
import { useDashboardStore } from '@/store/dashboardStore'
import { useNotificationStore } from '@/store/notificationStore'
import { useIncidentStore } from '@/store/incidentStore'
import { GlassCard } from '@/components/GlassCard'

const ACTIVITY_DOT: Record<string, string> = {
  security: 'bg-status-danger',
  finance: 'bg-status-success',
  vendor: 'bg-status-info',
  ticket: 'bg-status-info',
  system: 'bg-primary',
}

export function LiveMonitoring() {
  const { concertInfo } = useDashboardStore()
  const { activityFeed } = useNotificationStore()
  const incidents = useIncidentStore((s) => s.incidents)
  const openIncidents = incidents.filter((i) => i.status !== 'closed' && i.status !== 'resolved').length

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-ink">Live Monitoring</h1>
          <p className="text-ink-faint text-sm mt-1">Real-time security and crowd safety pulse.</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-status-danger/15 border border-status-danger/30">
          <Radio className="w-3.5 h-3.5 text-status-danger animate-pulse-live" />
          <span className="text-xs font-bold text-status-danger">{concertInfo.status.toUpperCase()}</span>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <GlassCard delay={0.05} hover={false}>
          <div className="flex items-center gap-2 text-ink-faint text-xs mb-2"><Music4 className="w-3.5 h-3.5" /> Now Playing</div>
          <div className="text-lg font-display font-semibold text-ink">{concertInfo.currentPerformer}</div>
        </GlassCard>
        <GlassCard delay={0.1} hover={false}>
          <div className="flex items-center gap-2 text-ink-faint text-xs mb-2"><Users className="w-3.5 h-3.5" /> Live Attendance</div>
          <div className="text-lg font-display font-semibold text-ink">
            {concertInfo.attendance.toLocaleString('id-ID')}{' '}
            <span className="text-xs text-ink-faint font-normal">/ {concertInfo.capacity.toLocaleString('id-ID')}</span>
          </div>
        </GlassCard>
        <GlassCard delay={0.15} hover={false}>
          <div className="flex items-center gap-2 text-ink-faint text-xs mb-2"><AlertTriangle className="w-3.5 h-3.5" /> Open Incidents</div>
          <div className="text-lg font-display font-semibold text-ink">
            {openIncidents} <span className="text-xs text-ink-faint font-normal">requiring attention</span>
          </div>
        </GlassCard>
      </div>

      <GlassCard delay={0.2} hover={false}>
        <h2 className="font-display font-semibold text-ink mb-5 flex items-center gap-2">
          Live Activity Feed <span className="live-dot" />
        </h2>
        <div className="space-y-3.5 max-h-80 overflow-y-auto scrollbar-thin pr-1">
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
  )
}
