import { cn } from '@/utils'

type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

const TONE_STYLES: Record<StatusTone, string> = {
  success: 'bg-status-success/15 text-status-success border border-status-success/30',
  warning: 'bg-status-warning/15 text-status-warning border border-status-warning/30',
  danger: 'bg-status-danger/15 text-status-danger border border-status-danger/30',
  info: 'bg-status-info/15 text-status-info border border-status-info/30',
  neutral: 'bg-white/[0.06] text-ink-faint border border-white/10',
}

// Maps every status string used across modules to a visual tone
const STATUS_TONE_MAP: Record<string, StatusTone> = {
  active: 'success', ready: 'success', resolved: 'success', completed: 'success', safe: 'success',
  check_in: 'info', setup: 'info', assigned: 'info', new: 'info',
  in_progress: 'warning', warning: 'warning', busy: 'warning',
  escalated: 'danger', critical: 'danger',
  not_arrived: 'neutral', closed: 'neutral', disabled: 'neutral',
  low: 'info', medium: 'warning', high: 'danger',
  Live: 'danger', Ended: 'neutral', Scheduled: 'info',
}

const STATUS_LABEL_MAP: Record<string, string> = {
  not_arrived: 'Not Arrived', check_in: 'Check-In', in_progress: 'In Progress',
}

interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const tone = STATUS_TONE_MAP[status] ?? 'neutral'
  const label = STATUS_LABEL_MAP[status] ?? status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ')
  return (
    <span className={cn('badge', TONE_STYLES[tone], className)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', {
        'bg-status-success': tone === 'success',
        'bg-status-warning': tone === 'warning',
        'bg-status-danger': tone === 'danger',
        'bg-status-info': tone === 'info',
        'bg-ink-faint': tone === 'neutral',
      })} />
      {label}
    </span>
  )
}
