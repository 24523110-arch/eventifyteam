import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { useDashboardStore } from '@/store/dashboardStore'
import { useIncidentStore } from '@/store/incidentStore'
import { KpiCard } from '@/components/KpiCard'
import { GlassCard } from '@/components/GlassCard'
import { SecurityHeatmap } from '@/components/SecurityHeatmap'
import { StatusBadge } from '@/components/StatusBadge'

export function SecurityDashboard() {
  const { securityKpis, crowdZones } = useDashboardStore()
  const incidents = useIncidentStore((s) => s.incidents)
  const recentIncidents = incidents.slice(0, 4)

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-display font-bold text-ink">Security Dashboard</h1>
        <p className="text-ink-faint text-sm mt-1">Crowd status and active incidents in real time.</p>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {securityKpis.map((kpi, i) => (
          <KpiCard key={kpi.id} {...kpi} delay={i * 0.05} />
        ))}
      </div>

      <GlassCard delay={0.2} hover={false}>
        <h2 className="font-display font-semibold text-ink mb-5">Crowd Safety Zones</h2>
        <SecurityHeatmap zones={crowdZones} />
      </GlassCard>

      <GlassCard delay={0.25} hover={false}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-semibold text-ink">Recent Incidents</h2>
          <Link
            to="/incident-center"
            className="flex items-center gap-1 text-xs font-medium text-primary hover:text-accent-fuchsia transition-colors"
          >
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="space-y-2.5">
          {recentIncidents.map((incident, i) => (
            <motion.div
              key={incident.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.05 }}
              className="glass rounded-xl p-3.5 flex items-center justify-between gap-3 flex-wrap"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs text-ink-faint">{incident.id}</span>
                  <span className="text-sm font-medium text-ink">{incident.area}</span>
                </div>
                <p className="text-xs text-ink-faint mt-0.5 truncate">{incident.description}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <StatusBadge status={incident.severity} />
                <StatusBadge status={incident.status} />
              </div>
            </motion.div>
          ))}
          {recentIncidents.length === 0 && (
            <p className="text-sm text-ink-faint text-center py-6">No incidents reported.</p>
          )}
        </div>
      </GlassCard>
    </div>
  )
}
