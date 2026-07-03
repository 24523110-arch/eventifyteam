import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Store, Radio, MapPin, CalendarClock, Music4, ArrowRight } from 'lucide-react'
import { useDashboardStore } from '@/store/dashboardStore'
import { useVendorStore } from '@/store/vendorStore'
import { KpiCard } from '@/components/KpiCard'
import { GlassCard } from '@/components/GlassCard'
import { DataTable } from '@/components/DataTable'
import { StatusBadge } from '@/components/StatusBadge'

export function AdminDashboard() {
  const { adminKpis, hourlySales, concertInfo } = useDashboardStore()
  const vendors = useVendorStore((s) => s.vendors)
  const navigate = useNavigate()
  const isLive = concertInfo.status === 'Live'

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-display font-bold text-ink">Admin Dashboard</h1>
        <p className="text-ink-faint text-sm mt-1">
          {concertInfo.name} — {concertInfo.date}
        </p>
      </motion.div>

      {/* Quick readout of the concert currently active per the schedule —
          full management (create/edit/delete/Mulai Live) lives on its own page. */}
      <GlassCard delay={0.03} hover={false}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${isLive ? 'bg-status-danger/15 border-status-danger/30' : 'bg-glass/[0.06] border-glass/10'}`}>
              <Radio className={`w-5 h-5 ${isLive ? 'text-status-danger' : 'text-ink-faint'}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-semibold text-ink">Jadwal Konser</h2>
                <StatusBadge status={concertInfo.status || 'Scheduled'} />
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-faint mt-1.5">
                <span className="flex items-center gap-1"><Music4 className="w-3 h-3" /> {concertInfo.currentPerformer || concertInfo.name}</span>
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {concertInfo.venue}</span>
                <span className="flex items-center gap-1"><CalendarClock className="w-3 h-3" /> {concertInfo.date}</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate('/concert-schedule')}
            className="btn-primary flex items-center gap-2 px-4 py-2.5 text-sm"
          >
            Kelola Jadwal Konser <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-ink-faint mt-3">
          {isLive
            ? 'Monitoring real-time aktif — data tiket & kepadatan diperbarui langsung selama konser berlangsung.'
            : 'Belum ada konser yang sedang live. Buka Jadwal Konser untuk memulai atau menjadwalkan konser baru.'}
        </p>
      </GlassCard>

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
