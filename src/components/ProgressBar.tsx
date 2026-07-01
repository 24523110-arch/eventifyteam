import { motion } from 'framer-motion'
import { cn } from '@/utils'

interface ProgressBarProps {
  value: number // 0-100
  tone?: 'primary' | 'success' | 'warning' | 'danger'
  className?: string
  delay?: number
}

const TONE_GRADIENT: Record<string, string> = {
  primary: 'bg-neon-gradient',
  success: 'bg-status-success',
  warning: 'bg-status-warning',
  danger: 'bg-status-danger',
}

export function ProgressBar({ value, tone = 'primary', className, delay = 0 }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <div className={cn('w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden', className)}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${clamped}%` }}
        transition={{ duration: 0.8, delay, ease: 'easeOut' }}
        className={cn('h-full rounded-full', TONE_GRADIENT[tone])}
      />
    </div>
  )
}
