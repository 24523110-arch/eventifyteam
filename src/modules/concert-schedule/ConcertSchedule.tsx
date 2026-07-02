import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { CalendarClock, Plus, Pencil, Trash2, PlayCircle, Power, MapPin, Users } from 'lucide-react'
import { useEventStore } from '@/store/eventStore'
import { useToastStore } from '@/store/toastStore'
import { GlassCard } from '@/components/GlassCard'
import { DataTable } from '@/components/DataTable'
import { StatusBadge } from '@/components/StatusBadge'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { ConcertScheduleFormDialog } from './ConcertScheduleFormDialog'
import { cn, formatNumber } from '@/utils'
import type { ConcertSchedule as ConcertScheduleType, ConcertScheduleStatus } from '@/types'

const FILTERS: { value: ConcertScheduleStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Semua' },
  { value: 'Live', label: 'Sedang Berlangsung' },
  { value: 'Scheduled', label: 'Belum Berlangsung' },
  { value: 'Ended', label: 'Riwayat' },
]

export function ConcertSchedule() {
  const schedules = useEventStore((s) => s.schedules)
  const createSchedule = useEventStore((s) => s.createSchedule)
  const updateSchedule = useEventStore((s) => s.updateSchedule)
  const deleteSchedule = useEventStore((s) => s.deleteSchedule)
  const setStatus = useEventStore((s) => s.setStatus)
  const showToast = useToastStore((s) => s.show)

  useEffect(() => {
    useEventStore.getState().fetchSchedules()
  }, [])

  const [statusFilter, setStatusFilter] = useState<ConcertScheduleStatus | 'all'>('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<ConcertScheduleType | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ConcertScheduleType | null>(null)

  const filtered = statusFilter === 'all' ? schedules : schedules.filter((s) => s.status === statusFilter)
  const liveCount = schedules.filter((s) => s.status === 'Live').length

  function handleCreate() {
    setEditing(null)
    setFormOpen(true)
  }

  function handleEdit(schedule: ConcertScheduleType) {
    setEditing(schedule)
    setFormOpen(true)
  }

  function handleFormSubmit(input: { name: string; venue: string; date: string; capacity: number; currentPerformer?: string }) {
    if (editing) {
      updateSchedule(editing.id, input)
    } else {
      createSchedule(input)
    }
  }

  async function handleStartLive(schedule: ConcertScheduleType) {
    await setStatus(schedule.id, 'Live')
    showToast(`${schedule.name} sekarang LIVE — monitoring real-time aktif.`, 'success')
  }

  async function handleEndConcert(schedule: ConcertScheduleType) {
    await setStatus(schedule.id, 'Ended')
    showToast(`${schedule.name} ditandai selesai.`, 'success')
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return
    if (deleteTarget.status === 'Live') {
      showToast('Akhiri konser ini sebelum menghapusnya.', 'error')
      setDeleteTarget(null)
      return
    }
    deleteSchedule(deleteTarget.id)
    showToast(`Jadwal "${deleteTarget.name}" dihapus.`, 'success')
    setDeleteTarget(null)
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-ink">Jadwal Konser</h1>
          <p className="text-ink-faint text-sm mt-1">Kelola konser yang sedang berlangsung, belum berlangsung, dan riwayat.</p>
        </div>
        <div className="flex items-center gap-2">
          {liveCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-status-danger/15 border border-status-danger/30">
              <span className="live-dot" />
              <span className="text-xs font-bold text-status-danger">{liveCount} LIVE</span>
            </div>
          )}
          <button onClick={handleCreate} className="btn-primary flex items-center gap-1.5 px-4 py-2.5 text-sm">
            <Plus className="w-4 h-4" /> Jadwal Baru
          </button>
        </div>
      </motion.div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={cn(
              'px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors border',
              statusFilter === f.value
                ? 'bg-primary/15 border-primary/40 text-primary'
                : 'bg-white/[0.04] border-white/10 text-ink-faint hover:text-ink'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <GlassCard delay={0.1} hover={false}>
        <DataTable
          delay={0.15}
          data={filtered}
          rowKey={(s) => s.id}
          columns={[
            {
              key: 'name',
              header: 'Konser',
              render: (s) => (
                <div>
                  <div className="font-medium flex items-center gap-1.5">
                    <CalendarClock className="w-3.5 h-3.5 text-ink-faint shrink-0" /> {s.name}
                  </div>
                  <div className="text-xs text-ink-faint mt-0.5 flex items-center gap-1"><MapPin className="w-3 h-3" /> {s.venue}</div>
                </div>
              ),
            },
            { key: 'date', header: 'Tanggal', render: (s) => s.date },
            {
              key: 'capacity',
              header: 'Kapasitas',
              render: (s) => (
                <span className="flex items-center gap-1 text-ink-faint">
                  <Users className="w-3 h-3" /> {formatNumber(s.attendance)} / {formatNumber(s.capacity)}
                </span>
              ),
            },
            { key: 'status', header: 'Status', render: (s) => <StatusBadge status={s.status} /> },
            {
              key: 'actions',
              header: 'Aksi',
              render: (s) => (
                <div className="flex items-center gap-1">
                  {s.status !== 'Live' && (
                    <button
                      onClick={() => handleStartLive(s)}
                      title="Mulai Live"
                      className="p-1.5 rounded-lg hover:bg-white/[0.06] text-ink-faint hover:text-status-success transition-colors"
                    >
                      <PlayCircle className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {s.status === 'Live' && (
                    <button
                      onClick={() => handleEndConcert(s)}
                      title="Akhiri Konser"
                      className="p-1.5 rounded-lg hover:bg-white/[0.06] text-ink-faint hover:text-status-danger transition-colors"
                    >
                      <Power className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button onClick={() => handleEdit(s)} title="Edit" className="p-1.5 rounded-lg hover:bg-white/[0.06] text-ink-faint hover:text-ink transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setDeleteTarget(s)} title="Hapus" className="p-1.5 rounded-lg hover:bg-white/[0.06] text-ink-faint hover:text-status-danger transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ),
            },
          ]}
        />
      </GlassCard>

      <ConcertScheduleFormDialog open={formOpen} onOpenChange={setFormOpen} schedule={editing} onSubmit={handleFormSubmit} />
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Hapus Jadwal Konser"
        description={`Apakah Anda yakin ingin menghapus jadwal "${deleteTarget?.name}"? Semua data terkait (vendor, insiden, laporan) akan terhapus. Tindakan ini tidak dapat dibatalkan.`}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  )
}
