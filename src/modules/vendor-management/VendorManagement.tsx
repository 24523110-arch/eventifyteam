import { useState } from 'react'
import { motion } from 'framer-motion'
import { Truck, CheckCircle2, Clock3, AlertCircle, Plus, Search, Pencil, Trash2 } from 'lucide-react'
import { useVendorStore } from '@/store/vendorStore'
import { useToastStore } from '@/store/toastStore'
import { GlassCard } from '@/components/GlassCard'
import { DataTable } from '@/components/DataTable'
import { StatusBadge } from '@/components/StatusBadge'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { VendorFormDialog } from './VendorFormDialog'
import { cn } from '@/utils'
import type { Vendor, VendorStatus } from '@/types'

const FILTERS: { value: VendorStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'not_arrived', label: 'Not Arrived' },
  { value: 'check_in', label: 'Check-In' },
  { value: 'setup', label: 'Setup' },
  { value: 'ready', label: 'Ready' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
]

export function VendorManagement() {
  const allVendors = useVendorStore((s) => s.vendors)
  const filtered = useVendorStore((s) => s.filteredVendors())
  const searchQuery = useVendorStore((s) => s.searchQuery)
  const setSearchQuery = useVendorStore((s) => s.setSearchQuery)
  const statusFilter = useVendorStore((s) => s.statusFilter)
  const setStatusFilter = useVendorStore((s) => s.setStatusFilter)
  const createVendor = useVendorStore((s) => s.createVendor)
  const updateVendor = useVendorStore((s) => s.updateVendor)
  const deleteVendor = useVendorStore((s) => s.deleteVendor)
  const showToast = useToastStore((s) => s.show)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Vendor | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Vendor | null>(null)

  const activeCount = allVendors.filter((v) => v.status === 'active').length
  const readyCount = allVendors.filter((v) => v.status === 'ready' || v.status === 'setup').length
  const pendingCount = allVendors.filter((v) => v.status === 'not_arrived').length

  function handleCreate() {
    setEditing(null)
    setFormOpen(true)
  }

  function handleEdit(vendor: Vendor) {
    setEditing(vendor)
    setFormOpen(true)
  }

  function handleFormSubmit(input: Omit<Vendor, 'id'>) {
    if (editing) {
      updateVendor(editing.id, input)
      showToast(`${input.name} updated.`, 'success')
    } else {
      createVendor(input)
      showToast(`${input.name} added.`, 'success')
    }
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return
    deleteVendor(deleteTarget.id)
    showToast(`${deleteTarget.name} removed.`, 'success')
    setDeleteTarget(null)
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-ink">Vendor Management</h1>
          <p className="text-ink-faint text-sm mt-1">Track every vendor's arrival, setup, and operational status.</p>
        </div>
        <button onClick={handleCreate} className="btn-primary flex items-center gap-1.5 px-4 py-2.5 text-sm">
          <Plus className="w-4 h-4" /> Add Vendor
        </button>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <GlassCard delay={0.05} hover={false}>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-ink-faint">Active Vendors</span>
              <div className="text-2xl font-display font-bold text-ink mt-1">{activeCount} / {allVendors.length}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-status-success/15 border border-status-success/30">
              <CheckCircle2 className="w-5 h-5 text-status-success" />
            </div>
          </div>
        </GlassCard>
        <GlassCard delay={0.1} hover={false}>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-ink-faint">Setting Up / Ready</span>
              <div className="text-2xl font-display font-bold text-ink mt-1">{readyCount}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-status-info/15 border border-status-info/30">
              <Clock3 className="w-5 h-5 text-status-info" />
            </div>
          </div>
        </GlassCard>
        <GlassCard delay={0.15} hover={false}>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-ink-faint">Not Yet Arrived</span>
              <div className="text-2xl font-display font-bold text-ink mt-1">{pendingCount}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-status-warning/15 border border-status-warning/30">
              <AlertCircle className="w-5 h-5 text-status-warning" />
            </div>
          </div>
        </GlassCard>
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={cn(
                'px-3.5 py-1.5 rounded-full text-xs font-medium transition-all border',
                statusFilter === f.value
                  ? 'bg-neon-gradient text-white border-transparent shadow-glow-sm'
                  : 'glass text-ink-faint hover:text-ink hover:border-primary/30'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search vendors…"
            className="input-glass pl-10"
          />
        </div>
      </div>

      <GlassCard delay={0.2} hover={false}>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
            <Truck className="w-4 h-4 text-primary" />
          </div>
          <h2 className="font-display font-semibold text-ink">Vendor List</h2>
        </div>
        <DataTable
          delay={0.25}
          data={filtered}
          rowKey={(v) => v.id}
          columns={[
            { key: 'name', header: 'Vendor', render: (v) => <span className="font-medium">{v.name}</span> },
            { key: 'category', header: 'Category', render: (v) => <span className="text-ink-faint">{v.category}</span> },
            { key: 'arrival', header: 'Arrival Time', render: (v) => v.arrivalTime },
            { key: 'status', header: 'Status', render: (v) => <StatusBadge status={v.status} /> },
            { key: 'area', header: 'Assigned Area', render: (v) => <span className="text-ink-faint">{v.assignedArea}</span> },
            {
              key: 'actions',
              header: 'Actions',
              render: (v) => (
                <div className="flex items-center gap-1">
                  <button onClick={() => handleEdit(v)} title="Edit" className="p-1.5 rounded-lg hover:bg-white/[0.06] text-ink-faint hover:text-ink transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setDeleteTarget(v)} title="Delete" className="p-1.5 rounded-lg hover:bg-white/[0.06] text-ink-faint hover:text-status-danger transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ),
            },
          ]}
        />
      </GlassCard>

      <VendorFormDialog open={formOpen} onOpenChange={setFormOpen} vendor={editing} onSubmit={handleFormSubmit} />
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Vendor"
        description={`Are you sure you want to remove ${deleteTarget?.name}? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  )
}
