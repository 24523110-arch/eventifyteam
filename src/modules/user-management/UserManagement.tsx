import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { UserCog, UserPlus, Pencil, Ban, CheckCircle2, Trash2, Search } from 'lucide-react'
import { useUserStore } from '@/store/userStore'
import { useAuthStore } from '@/store/authStore'
import { useToastStore } from '@/store/toastStore'
import { useReferenceStore } from '@/store/referenceStore'
import { GlassCard } from '@/components/GlassCard'
import { DataTable } from '@/components/DataTable'
import { StatusBadge } from '@/components/StatusBadge'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { UserFormDialog } from './UserFormDialog'
import type { AppUser, UserRole } from '@/types'

export function UserManagement() {
  const users = useUserStore((s) => s.filteredUsers())
  const searchQuery = useUserStore((s) => s.searchQuery)
  const setSearchQuery = useUserStore((s) => s.setSearchQuery)
  const createUser = useUserStore((s) => s.createUser)
  const updateUser = useUserStore((s) => s.updateUser)
  const deleteUser = useUserStore((s) => s.deleteUser)
  const toggleUserStatus = useUserStore((s) => s.toggleUserStatus)
  const currentUser = useAuthStore((s) => s.user)
  const showToast = useToastStore((s) => s.show)
  const roleOptions = useReferenceStore((s) => s.roles)

  // Manager-only data — loaded when the page mounts (the endpoint is 403 for
  // other roles, so it isn't fetched globally).
  useEffect(() => {
    useUserStore.getState().fetchUsers()
  }, [])

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<AppUser | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AppUser | null>(null)

  function handleCreate() {
    setEditing(null)
    setFormOpen(true)
  }

  function handleEdit(user: AppUser) {
    setEditing(user)
    setFormOpen(true)
  }

  function handleFormSubmit(input: { name: string; email: string; role: UserRole }) {
    if (editing) {
      updateUser(editing.id, input)
      showToast(`${input.name} updated.`, 'success')
    } else {
      createUser(input)
      showToast(`${input.name} created.`, 'success')
    }
  }

  function handleToggleStatus(user: AppUser) {
    toggleUserStatus(user.id)
    showToast(`${user.name} ${user.status === 'active' ? 'disabled' : 'enabled'}.`, 'success')
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return
    deleteUser(deleteTarget.id)
    showToast(`${deleteTarget.name} deleted.`, 'success')
    setDeleteTarget(null)
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-ink">User Management</h1>
          <p className="text-ink-faint text-sm mt-1">Manage accounts, roles, and access across Eventify.</p>
        </div>
        <button onClick={handleCreate} className="btn-primary flex items-center gap-1.5 px-4 py-2.5 text-sm">
          <UserPlus className="w-4 h-4" /> Create User
        </button>
      </motion.div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name, email, or role…"
          className="input-glass pl-10"
        />
      </div>

      <GlassCard delay={0.1} hover={false}>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
            <UserCog className="w-4 h-4 text-primary" />
          </div>
          <h2 className="font-display font-semibold text-ink">All Users</h2>
        </div>
        <DataTable
          delay={0.15}
          data={users}
          rowKey={(u) => u.id}
          columns={[
            {
              key: 'name',
              header: 'Name',
              render: (u) => (
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-neon-gradient flex items-center justify-center text-[10px] font-bold shrink-0">
                    {u.avatarInitials}
                  </div>
                  <span className="font-medium">{u.name}</span>
                </div>
              ),
            },
            { key: 'email', header: 'Email', render: (u) => <span className="text-ink-faint">{u.email}</span> },
            {
              key: 'role',
              header: 'Role',
              render: (u) => <span className="text-ink-faint">{roleOptions.find((r) => r.value === u.role)?.label ?? u.role}</span>,
            },
            { key: 'status', header: 'Status', render: (u) => <StatusBadge status={u.status} /> },
            { key: 'lastLogin', header: 'Last Login', render: (u) => <span className="text-ink-faint text-xs">{u.lastLogin}</span> },
            {
              key: 'actions',
              header: 'Actions',
              render: (u) => (
                <div className="flex items-center gap-1">
                  <button onClick={() => handleEdit(u)} title="Edit" className="p-1.5 rounded-lg hover:bg-white/[0.06] text-ink-faint hover:text-primary transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleToggleStatus(u)}
                    title={u.status === 'active' ? 'Disable' : 'Enable'}
                    className="p-1.5 rounded-lg hover:bg-white/[0.06] text-ink-faint hover:text-status-warning transition-colors"
                  >
                    {u.status === 'active' ? <Ban className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => setDeleteTarget(u)}
                    disabled={u.id === currentUser?.id}
                    title={u.id === currentUser?.id ? "You can't delete your own account" : 'Delete'}
                    className="p-1.5 rounded-lg hover:bg-white/[0.06] text-ink-faint hover:text-status-danger transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink-faint"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ),
            },
          ]}
        />
      </GlassCard>

      <UserFormDialog open={formOpen} onOpenChange={setFormOpen} user={editing} onSubmit={handleFormSubmit} />
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete User"
        description={`Are you sure you want to delete ${deleteTarget?.name}? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  )
}
