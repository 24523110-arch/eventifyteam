import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, XCircle, Info, X } from 'lucide-react'
import { useToastStore } from '@/store/toastStore'
import { cn } from '@/utils'

const VARIANT_CONFIG = {
  success: { icon: CheckCircle2, className: 'border-status-success/40 text-status-success' },
  error: { icon: XCircle, className: 'border-status-danger/40 text-status-danger' },
  info: { icon: Info, className: 'border-status-info/40 text-status-info' },
}

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts)
  const dismiss = useToastStore((s) => s.dismiss)

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const config = VARIANT_CONFIG[toast.variant]
          const Icon = config.icon
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ duration: 0.25 }}
              className={cn('glass-panel p-3.5 flex items-start gap-2.5 pointer-events-auto border', config.className)}
            >
              <Icon className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="text-sm text-ink flex-1">{toast.message}</p>
              <button onClick={() => dismiss(toast.id)} className="text-ink-faint hover:text-ink shrink-0">
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
