import {
  Users, Wallet, Gauge, ShieldAlert, Store, Star, Ticket, Flame,
  TrendingUp, TrendingDown, Minus, type LucideIcon,
} from 'lucide-react'
import { motion } from 'framer-motion'
import type { KpiCardData } from '@/types'
import { GlassCard } from './GlassCard'
import { cn } from '@/utils'

const ICON_MAP: Record<string, LucideIcon> = {
  users: Users,
  wallet: Wallet,
  gauge: Gauge,
  'shield-alert': ShieldAlert,
  store: Store,
  star: Star,
  ticket: Ticket,
  flame: Flame,
  'trending-up': TrendingUp,
}

interface KpiCardProps extends KpiCardData {
  delay?: number
}

export function KpiCard({ label, value, delta, trend, icon, delay = 0 }: KpiCardProps) {
  const Icon = ICON_MAP[icon] ?? Gauge
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus

  return (
    <GlassCard delay={delay} className="group">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-ink-faint uppercase tracking-wider">{label}</span>
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay + 0.2 }}
            className="text-2xl font-display font-bold text-ink"
          >
            {value}
          </motion.span>
        </div>
        <div className="p-2.5 rounded-xl bg-neon-gradient/10 border border-primary/20 group-hover:shadow-glow-sm transition-shadow">
          <Icon className="w-5 h-5 text-primary" strokeWidth={2} />
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1">
        <TrendIcon
          className={cn('w-3.5 h-3.5', {
            'text-status-success': trend === 'up',
            'text-status-danger': trend === 'down',
            'text-ink-faint': trend === 'flat',
          })}
        />
        <span
          className={cn('text-xs font-semibold', {
            'text-status-success': trend === 'up',
            'text-status-danger': trend === 'down',
            'text-ink-faint': trend === 'flat',
          })}
        >
          {delta}
        </span>
        <span className="text-xs text-ink-faint ml-1">vs last hour</span>
      </div>
    </GlassCard>
  )
}
