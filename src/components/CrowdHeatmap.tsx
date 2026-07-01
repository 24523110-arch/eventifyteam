import { motion } from 'framer-motion'
import type { CrowdZone } from '@/types'
import { cn, percentage } from '@/utils'

const STATUS_COLOR: Record<CrowdZone['status'], string> = {
  safe: 'from-status-success/40 to-status-success/10 border-status-success/40',
  busy: 'from-status-warning/40 to-status-warning/10 border-status-warning/40',
  critical: 'from-status-danger/50 to-status-danger/10 border-status-danger/50',
}

interface CrowdHeatmapProps {
  zones: CrowdZone[]
}

export function CrowdHeatmap({ zones }: CrowdHeatmapProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {zones.map((zone, i) => {
        const pct = percentage(zone.current, zone.capacity)
        return (
          <motion.div
            key={zone.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, delay: i * 0.06 }}
            className={cn(
              'relative rounded-xl border bg-gradient-to-br p-4 overflow-hidden',
              STATUS_COLOR[zone.status]
            )}
          >
            {zone.status === 'critical' && (
              <motion.div
                className="absolute inset-0 bg-status-danger/10"
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ repeat: Infinity, duration: 1.8 }}
              />
            )}
            <div className="relative z-10">
              <div className="text-sm font-semibold text-ink">{zone.name}</div>
              <div className="text-2xl font-display font-bold text-ink mt-1">{pct}%</div>
              <div className="text-xs text-ink-faint mt-0.5">
                {zone.current.toLocaleString('id-ID')} / {zone.capacity.toLocaleString('id-ID')}
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
