import { motion } from 'framer-motion'
import { Music4, Activity, ShieldCheck, BarChart3, ChevronDown } from 'lucide-react'

const FEATURES = [
  { icon: Activity, label: 'Real-Time Monitoring', desc: 'Live crowd, ticket & revenue data in one place' },
  { icon: ShieldCheck, label: 'Incident Response', desc: 'Track and resolve security incidents instantly' },
  { icon: BarChart3, label: 'Business Insight', desc: 'AI-assisted evaluation reports for management' },
]

interface SplashSectionProps {
  onScrollToLogin: () => void
}

export function SplashSection({ onScrollToLogin }: SplashSectionProps) {
  return (
    <section className="min-h-screen w-full flex flex-col items-center justify-center relative px-6 py-20 overflow-hidden">
      <div className="absolute inset-0 bg-radial-glow" />
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[640px] h-[640px] bg-primary/10 rounded-full blur-[140px]" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 flex items-center gap-2.5 mb-10"
      >
        <div className="p-2 rounded-xl bg-neon-gradient shadow-glow-sm">
          <Music4 className="w-5 h-5 text-white" />
        </div>
        <span className="text-lg font-display font-bold tracking-tight">EVENTIFY</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.1 }}
        className="relative z-10 text-center max-w-xl"
      >
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold leading-tight tracking-tight mb-5">
          Concert Management,
          <br />
          <span className="text-gradient">Simplified.</span>
        </h1>
        <p className="text-ink-faint text-base leading-relaxed max-w-md mx-auto">
          One platform to monitor ticketing, crowd safety, and business performance for large-scale concerts.
        </p>
      </motion.div>

      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-4 mt-14 max-w-3xl w-full">
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 + i * 0.1 }}
            className="glass rounded-2xl p-5 text-center"
          >
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-3">
              <f.icon className="w-4 h-4 text-primary" />
            </div>
            <div className="text-sm font-semibold text-ink">{f.label}</div>
            <div className="text-xs text-ink-faint mt-1.5 leading-relaxed">{f.desc}</div>
          </motion.div>
        ))}
      </div>

      <motion.button
        onClick={onScrollToLogin}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.7 }}
        className="absolute bottom-10 z-10 flex flex-col items-center gap-1.5 text-ink-faint hover:text-ink transition-colors"
      >
        <span className="text-xs">Sign in to continue</span>
        <motion.span animate={{ y: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 1.6 }}>
          <ChevronDown className="w-4 h-4" />
        </motion.span>
      </motion.button>
    </section>
  )
}
