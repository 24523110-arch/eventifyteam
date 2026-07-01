import { motion } from 'framer-motion'
import type { CrowdZone } from '@/types'
import { cn } from '@/utils'

const STATUS_STYLE: Record<CrowdZone['status'], { bg: string; label: string }> = {
  safe: { bg: 'bg-status-success/20 border-status-success/40', label: 'Safe' },
  busy: { bg: 'bg-status-warning/20 border-status-warning/40', label: 'Busy' },
  critical: { bg: 'bg-status-danger/25 border-status-danger/50', label: 'Critical' },
}

interface SecurityHeatmapProps {
  zones: CrowdZone[]
}

export function SecurityHeatmap({ zones }: SecurityHeatmapProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {zones.map((zone, i) => {
        const style = STATUS_STYLE[zone.status]
        return (
          <motion.div
            key={zone.id}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            className={cn('relative rounded-xl border p-4', style.bg)}
          >
            {zone.status === 'critical' && (
              <motion.div
                className="absolute inset-0 rounded-xl border-2 border-status-danger"
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ repeat: Infinity, duration: 1.4 }}
              />
            )}
            <div className="text-sm font-semibold text-ink">{zone.name}</div>
            <div className="text-xs text-ink-faint mt-2">{style.label}</div>
          </motion.div>
        )
      })}
    </div>
  )
}
