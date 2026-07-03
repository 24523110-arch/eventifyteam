import { type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/utils'

interface GlassCardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  delay?: number
}

export function GlassCard({ children, className, hover = true, delay = 0 }: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      className={cn('glass-card p-5', !hover && 'hover:transform-none hover:border-glass/[0.08] hover:shadow-glass', className)}
    >
      {children}
    </motion.div>
  )
}
