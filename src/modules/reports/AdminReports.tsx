import { motion } from 'framer-motion'
import { FileText, Ticket, Store, Clock } from 'lucide-react'
import { useDashboardStore } from '@/store/dashboardStore'
import { useVendorStore } from '@/store/vendorStore'
import { GlassCard } from '@/components/GlassCard'
import { StatusBadge } from '@/components/StatusBadge'
import { formatNumber } from '@/utils'

export function AdminReports() {
  const { ticketSummary, concertInfo } = useDashboardStore()
  const vendors = useVendorStore((s) => s.vendors)

  const vendorsByStatus = vendors.reduce<Record<string, number>>((acc, v) => {
    acc[v.status] = (acc[v.status] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-display font-bold text-ink">Reports</h1>
        <p className="text-ink-faint text-sm mt-1">Operational summary for {concertInfo.name}.</p>
      </motion.div>

      <GlassCard delay={0.05} hover={false}>
        <div className="flex items-center gap-2.5 mb-5">
          <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
            <Ticket className="w-4 h-4 text-primary" />
          </div>
          <h2 className="font-display font-semibold text-ink">Ticketing Summary</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="glass rounded-xl p-3.5">
            <span className="text-xs text-ink-faint">Sold</span>
            <div className="text-lg font-display font-bold text-ink mt-1">{formatNumber(ticketSummary.sold)}</div>
          </div>
          <div className="glass rounded-xl p-3.5">
            <span className="text-xs text-ink-faint">Remaining</span>
            <div className="text-lg font-display font-bold text-ink mt-1">{formatNumber(ticketSummary.remaining)}</div>
          </div>
          <div className="glass rounded-xl p-3.5">
            <span className="text-xs text-ink-faint">Refunds</span>
            <div className="text-lg font-display font-bold text-ink mt-1">{formatNumber(ticketSummary.refunds)}</div>
          </div>
          <div className="glass rounded-xl p-3.5">
            <span className="text-xs text-ink-faint">Attendance</span>
            <div className="text-lg font-display font-bold text-ink mt-1">{formatNumber(concertInfo.attendance)}</div>
          </div>
        </div>
      </GlassCard>

      <GlassCard delay={0.1} hover={false}>
        <div className="flex items-center gap-2.5 mb-5">
          <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
            <Store className="w-4 h-4 text-primary" />
          </div>
          <h2 className="font-display font-semibold text-ink">Vendor Status Breakdown</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          {Object.entries(vendorsByStatus).map(([status, count]) => (
            <div key={status} className="glass rounded-xl px-4 py-3 flex items-center gap-3">
              <StatusBadge status={status} />
              <span className="text-sm font-semibold text-ink">{count}</span>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard delay={0.15} hover={false} className="flex items-start gap-3">
        <Clock className="w-4 h-4 text-ink-faint shrink-0 mt-0.5" />
        <p className="text-sm text-ink-faint">
          Financial evaluation reports with AI-generated insights are available to Manager accounts under their
          Reports page.
        </p>
      </GlassCard>
    </div>
  )
}
