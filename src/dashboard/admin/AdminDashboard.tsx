import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Store } from 'lucide-react'
import { useDashboardStore } from '@/store/dashboardStore'
import { useVendorStore } from '@/store/vendorStore'
import { KpiCard } from '@/components/KpiCard'
import { GlassCard } from '@/components/GlassCard'
import { DataTable } from '@/components/DataTable'
import { StatusBadge } from '@/components/StatusBadge'

export function AdminDashboard() {
  const { adminKpis, hourlySales, concertInfo } = useDashboardStore()
  const vendors = useVendorStore((s) => s.vendors)

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-display font-bold text-ink">Admin Dashboard</h1>
        <p className="text-ink-faint text-sm mt-1">
          {concertInfo.name} — {concertInfo.date}
        </p>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {adminKpis.map((kpi, i) => (
          <KpiCard key={kpi.id} {...kpi} delay={i * 0.05} />
        ))}
      </div>

      <GlassCard delay={0.2} hover={false}>
        <h2 className="font-display font-semibold text-ink mb-5">Hourly Ticket Sales</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={hourlySales} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="hour" stroke="#8B85A8" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="#8B85A8" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ background: '#141124', border: '1px solid rgba(168,85,247,0.25)', borderRadius: 12, fontSize: 12 }}
              labelStyle={{ color: '#C4B5FD' }}
            />
            <Bar dataKey="tickets" fill="#A855F7" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </GlassCard>

      <GlassCard delay={0.25} hover={false}>
        <div className="flex items-center gap-2.5 mb-5">
          <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
            <Store className="w-4 h-4 text-primary" />
          </div>
          <h2 className="font-display font-semibold text-ink">Vendor Readiness</h2>
        </div>
        <DataTable
          delay={0.3}
          data={vendors}
          rowKey={(v) => v.id}
          columns={[
            { key: 'name', header: 'Vendor', render: (v) => <span className="font-medium">{v.name}</span> },
            { key: 'category', header: 'Category', render: (v) => <span className="text-ink-faint">{v.category}</span> },
            { key: 'arrival', header: 'Arrival Time', render: (v) => v.arrivalTime },
            { key: 'status', header: 'Status', render: (v) => <StatusBadge status={v.status} /> },
            { key: 'area', header: 'Assigned Area', render: (v) => <span className="text-ink-faint">{v.assignedArea}</span> },
          ]}
        />
      </GlassCard>
    </div>
  )
}
