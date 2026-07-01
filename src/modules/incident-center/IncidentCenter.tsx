import { useState } from 'react'
import { motion } from 'framer-motion'
import { ShieldAlert, Plus, Search, Eye, Pencil, Trash2 } from 'lucide-react'
import { useIncidentStore } from '@/store/incidentStore'
import { useToastStore } from '@/store/toastStore'
import { GlassCard } from '@/components/GlassCard'
import { DataTable } from '@/components/DataTable'
import { StatusBadge } from '@/components/StatusBadge'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { IncidentFormDialog } from './IncidentFormDialog'
import { IncidentDetailDialog } from './IncidentDetailDialog'
import type { Incident } from '@/types'

export function IncidentCenter() {
  const incidents = useIncidentStore((s) => s.filteredIncidents())
  const searchQuery = useIncidentStore((s) => s.searchQuery)
  const setSearchQuery = useIncidentStore((s) => s.setSearchQuery)
  const createIncident = useIncidentStore((s) => s.createIncident)
  const updateIncident = useIncidentStore((s) => s.updateIncident)
  const deleteIncident = useIncidentStore((s) => s.deleteIncident)
  const allIncidents = useIncidentStore((s) => s.incidents)
  const showToast = useToastStore((s) => s.show)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Incident | null>(null)
  const [viewing, setViewing] = useState<Incident | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Incident | null>(null)

  const openCount = allIncidents.filter((i) => i.status !== 'closed' && i.status !== 'resolved').length

  function handleCreate() {
    setEditing(null)
    setFormOpen(true)
  }

  function handleEdit(incident: Incident) {
    setEditing(incident)
    setFormOpen(true)
  }

  function handleFormSubmit(input: Omit<Incident, 'id' | 'createdAt'>) {
    if (editing) {
      updateIncident(editing.id, input)
      showToast(`Incident ${editing.id} updated.`, 'success')
    } else {
      createIncident(input)
      showToast('New incident reported.', 'success')
    }
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return
    deleteIncident(deleteTarget.id)
    showToast(`Incident ${deleteTarget.id} deleted.`, 'success')
    setDeleteTarget(null)
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-ink">Incident Center</h1>
          <p className="text-ink-faint text-sm mt-1">Track, assign, and resolve security incidents.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-status-danger/15 border border-status-danger/30">
            <ShieldAlert className="w-3.5 h-3.5 text-status-danger" />
            <span className="text-xs font-bold text-status-danger">{openCount} OPEN</span>
          </div>
          <button onClick={handleCreate} className="btn-primary flex items-center gap-1.5 px-4 py-2.5 text-sm">
            <Plus className="w-4 h-4" /> Report Incident
          </button>
        </div>
      </motion.div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by ID, area, or description…"
          className="input-glass pl-10"
        />
      </div>

      <GlassCard delay={0.1} hover={false}>
        <DataTable
          delay={0.15}
          data={incidents}
          rowKey={(i) => i.id}
          columns={[
            { key: 'id', header: 'Incident ID', render: (i) => <span className="font-mono text-xs text-ink-faint">{i.id}</span> },
            { key: 'area', header: 'Area', render: (i) => i.area },
            { key: 'severity', header: 'Severity', render: (i) => <StatusBadge status={i.severity} /> },
            { key: 'team', header: 'Assigned Team', render: (i) => <span className="text-ink-faint">{i.assignedTeam}</span> },
            { key: 'status', header: 'Status', render: (i) => <StatusBadge status={i.status} /> },
            { key: 'created', header: 'Created At', render: (i) => i.createdAt },
            {
              key: 'actions',
              header: 'Actions',
              render: (i) => (
                <div className="flex items-center gap-1">
                  <button onClick={() => setViewing(i)} title="View details" className="p-1.5 rounded-lg hover:bg-white/[0.06] text-ink-faint hover:text-primary transition-colors">
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleEdit(i)} title="Edit" className="p-1.5 rounded-lg hover:bg-white/[0.06] text-ink-faint hover:text-ink transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setDeleteTarget(i)} title="Delete" className="p-1.5 rounded-lg hover:bg-white/[0.06] text-ink-faint hover:text-status-danger transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ),
            },
          ]}
        />
      </GlassCard>

      <IncidentFormDialog open={formOpen} onOpenChange={setFormOpen} incident={editing} onSubmit={handleFormSubmit} />
      <IncidentDetailDialog incident={viewing} onOpenChange={(open) => !open && setViewing(null)} />
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Incident"
        description={`Are you sure you want to delete ${deleteTarget?.id}? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  )
}
