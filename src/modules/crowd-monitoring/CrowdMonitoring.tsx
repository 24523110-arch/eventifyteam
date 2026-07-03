import { useEffect, useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import { Users, Gauge, BarChart2, Send } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useDashboardStore } from '@/store/dashboardStore'
import { GlassCard } from '@/components/GlassCard'
import { CrowdHeatmap } from '@/components/CrowdHeatmap'
import { percentage, formatNumber } from '@/utils'

const tooltipStyle = { background: '#141124', border: '1px solid rgba(168,85,247,0.25)', borderRadius: 12, fontSize: 12 }

export function CrowdMonitoring() {
  const { crowdZones, densityTrend, concertInfo, updateAttendance } = useDashboardStore()

  const totalCapacity = crowdZones.reduce((sum, z) => sum + z.capacity, 0)
  const totalCurrent = crowdZones.reduce((sum, z) => sum + z.current, 0)

  const [attendanceInput, setAttendanceInput] = useState('')
  const [saving, setSaving] = useState(false)

  // Sync to the stored figure — only re-fires when it actually changes, so
  // it never clobbers a draft the user is mid-typing.
  useEffect(() => {
    setAttendanceInput(String(concertInfo.attendance))
  }, [concertInfo.attendance])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (attendanceInput === '') return
    setSaving(true)
    await updateAttendance(Number(attendanceInput))
    setSaving(false)
  }

  const kpis = [
    { label: 'Current Crowd', value: formatNumber(totalCurrent), icon: Users },
    { label: 'Maximum Capacity', value: formatNumber(totalCapacity), icon: Gauge },
    { label: 'Occupancy Rate', value: `${percentage(totalCurrent, totalCapacity)}%`, icon: BarChart2 },
  ]

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="text-2xl font-display font-bold text-ink">Crowd Monitoring</h1>
        <p className="text-ink-faint text-sm mt-1">Real-time density and occupancy across all zones.</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {kpis.map((kpi, i) => (
          <GlassCard key={kpi.label} delay={i * 0.06} hover={false}>
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-medium text-ink-faint uppercase tracking-wider">{kpi.label}</span>
                <div className="text-2xl font-display font-bold text-ink mt-1">{kpi.value}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
                <kpi.icon className="w-5 h-5 text-primary" />
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Manual attendance entry — Security Team's own headcount from the
          gates, replacing the old simulator-driven attendance figure. */}
      <GlassCard delay={0.15} hover={false}>
        <div className="flex items-center gap-2.5 mb-5">
          <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
            <Users className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="font-display font-semibold text-ink">Input Kehadiran Penonton</h2>
            <p className="text-xs text-ink-faint mt-0.5">
              Masukkan jumlah penonton yang telah masuk venue (kapasitas: {formatNumber(concertInfo.capacity)}).
            </p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
          <div className="w-full sm:w-64">
            <label className="text-xs font-medium text-ink-muted mb-1.5 block">Jumlah Kehadiran</label>
            <input type="number" min="0" value={attendanceInput} onChange={(e) => setAttendanceInput(e.target.value)} className="input-glass" />
          </div>
          <button
            type="submit"
            disabled={saving || attendanceInput === ''}
            className="btn-primary flex items-center gap-2 px-4 py-2.5 text-sm disabled:opacity-60 shrink-0"
          >
            <Send className="w-4 h-4" /> {saving ? 'Menyimpan…' : 'Simpan Kehadiran'}
          </button>
        </form>
      </GlassCard>

      <GlassCard delay={0.2} hover={false}>
        <h2 className="font-display font-semibold text-ink mb-5">Density Trend</h2>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={densityTrend} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="densityFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#A855F7" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#A855F7" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="time" stroke="#8B85A8" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="#8B85A8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
            <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#C4B5FD' }} />
            <Area type="monotone" dataKey="density" stroke="#A855F7" strokeWidth={2} fill="url(#densityFill)" />
          </AreaChart>
        </ResponsiveContainer>
      </GlassCard>

      <GlassCard delay={0.25} hover={false}>
        <h2 className="font-display font-semibold text-ink mb-5">Zone Density</h2>
        <CrowdHeatmap zones={crowdZones} />
      </GlassCard>
    </div>
  )
}
