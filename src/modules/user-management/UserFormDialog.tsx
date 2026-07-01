import { useState, useEffect, type FormEvent } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useReferenceStore } from '@/store/referenceStore'
import { isValidEmail } from '@/utils'
import type { AppUser, UserRole } from '@/types'

interface UserFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: AppUser | null // null = create mode
  onSubmit: (input: { name: string; email: string; role: UserRole }) => void
}

interface FormErrors {
  name?: string
  email?: string
}

export function UserFormDialog({ open, onOpenChange, user, onSubmit }: UserFormDialogProps) {
  const roleOptions = useReferenceStore((s) => s.roles)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<UserRole>('admin')
  const [errors, setErrors] = useState<FormErrors>({})

  useEffect(() => {
    if (open) {
      setName(user?.name ?? '')
      setEmail(user?.email ?? '')
      setRole(user?.role ?? 'admin')
      setErrors({})
    }
  }, [open, user])

  function validate(): boolean {
    const next: FormErrors = {}
    if (!name.trim()) next.name = 'Name is required.'
    if (!email.trim()) {
      next.email = 'Email is required.'
    } else if (!isValidEmail(email)) {
      next.email = 'Invalid email format.'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!validate()) return
    onSubmit({ name: name.trim(), email: email.trim(), role })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{user ? 'Edit User' : 'Create User'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <Label>Full Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Dewi Anggraini" error={!!errors.name} />
            {errors.name && <p className="text-xs text-status-danger mt-1.5">{errors.name}</p>}
          </div>
          <div>
            <Label>Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@eventify.io" error={!!errors.email} />
            {errors.email && <p className="text-xs text-status-danger mt-1.5">{errors.email}</p>}
          </div>
          <div>
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              {user ? 'Save Changes' : 'Create User'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
