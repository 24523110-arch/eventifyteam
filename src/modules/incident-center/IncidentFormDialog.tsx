import { useState, useEffect, type FormEvent } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useReferenceStore } from '@/store/referenceStore'
import type { Incident, IncidentSeverity, IncidentStatus } from '@/types'

const SEVERITIES: IncidentSeverity[] = ['low', 'medium', 'high', 'critical']
const STATUSES: IncidentStatus[] = ['new', 'assigned', 'in_progress', 'escalated', 'resolved', 'closed']

interface IncidentFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  incident: Incident | null // null = create mode
  onSubmit: (input: Omit<Incident, 'id' | 'createdAt'>) => void
}

interface FormErrors {
  area?: string
  description?: string
}

export function IncidentFormDialog({ open, onOpenChange, incident, onSubmit }: IncidentFormDialogProps) {
  const securityTeams = useReferenceStore((s) => s.securityTeams)
  // "Unassigned" is the schema-level sentinel (incidents.assigned_team default)
  // and sorts last in the team list — use it as the new-incident default.
  const defaultTeam = securityTeams[securityTeams.length - 1] ?? 'Unassigned'

  const [area, setArea] = useState('')
  const [description, setDescription] = useState('')
  const [severity, setSeverity] = useState<IncidentSeverity>('low')
  const [status, setStatus] = useState<IncidentStatus>('new')
  const [assignedTeam, setAssignedTeam] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})

  useEffect(() => {
    if (open) {
      setArea(incident?.area ?? '')
      setDescription(incident?.description ?? '')
      setSeverity(incident?.severity ?? 'low')
      setStatus(incident?.status ?? 'new')
      setAssignedTeam(incident?.assignedTeam ?? defaultTeam)
      setErrors({})
    }
  }, [open, incident, defaultTeam])

  function validate(): boolean {
    const next: FormErrors = {}
    if (!area.trim()) next.area = 'Area wajib diisi.'
    if (!description.trim()) next.description = 'Deskripsi wajib diisi.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!validate()) return
    onSubmit({ area: area.trim(), description: description.trim(), severity, status, assignedTeam })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{incident ? 'Edit Incident' : 'Report New Incident'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <Label>Area</Label>
            <Input value={area} onChange={(e) => setArea(e.target.value)} placeholder="e.g. Gate B" error={!!errors.area} />
            {errors.area && <p className="text-xs text-status-danger mt-1.5">{errors.area}</p>}
          </div>
          <div>
            <Label>Description</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Briefly describe what happened"
              error={!!errors.description}
            />
            {errors.description && <p className="text-xs text-status-danger mt-1.5">{errors.description}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Severity</Label>
              <Select value={severity} onValueChange={(v) => setSeverity(v as IncidentSeverity)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SEVERITIES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as IncidentStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.replace('_', ' ').replace(/^\w/, (c) => c.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Assigned Team</Label>
            <Select value={assignedTeam} onValueChange={setAssignedTeam}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {securityTeams.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
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
              {incident ? 'Save Changes' : 'Create Incident'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
