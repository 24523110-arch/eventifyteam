import { MapPin, Clock, Users, ArrowUpCircle, CheckCircle2, XCircle, Timer } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/StatusBadge'
import { useIncidentStore } from '@/store/incidentStore'
import { useToastStore } from '@/store/toastStore'
import type { Incident } from '@/types'

interface IncidentDetailDialogProps {
  incident: Incident | null
  onOpenChange: (open: boolean) => void
}

export function IncidentDetailDialog({ incident, onOpenChange }: IncidentDetailDialogProps) {
  const setStatus = useIncidentStore((s) => s.setStatus)
  const showToast = useToastStore((s) => s.show)

  if (!incident) return null

  function handleAction(next: 'escalated' | 'resolved' | 'closed', label: string) {
    setStatus(incident!.id, next)
    showToast(`Incident ${incident!.id} marked as ${label}.`, 'success')
    onOpenChange(false)
  }

  return (
    <Dialog open={!!incident} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <span className="text-xs text-ink-faint font-mono">{incident.id}</span>
          <DialogTitle>{incident.description}</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <StatusBadge status={incident.status} />
          <StatusBadge status={incident.severity} />
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-2.5 glass rounded-xl p-3">
            <MapPin className="w-4 h-4 text-primary shrink-0" />
            <div>
              <div className="text-xs text-ink-faint">Area</div>
              <div className="text-ink font-medium">{incident.area}</div>
            </div>
          </div>
          <div className="flex items-center gap-2.5 glass rounded-xl p-3">
            <Users className="w-4 h-4 text-primary shrink-0" />
            <div>
              <div className="text-xs text-ink-faint">Assigned Team</div>
              <div className="text-ink font-medium">{incident.assignedTeam}</div>
            </div>
          </div>
          <div className="flex items-center gap-2.5 glass rounded-xl p-3">
            <Clock className="w-4 h-4 text-primary shrink-0" />
            <div>
              <div className="text-xs text-ink-faint">Created At</div>
              <div className="text-ink font-medium">{incident.createdAt}</div>
            </div>
          </div>
          {(incident.responseMinutes != null || incident.resolutionMinutes != null) && (
            <div className="flex items-center gap-2.5 glass rounded-xl p-3">
              <Timer className="w-4 h-4 text-primary shrink-0" />
              <div>
                <div className="text-xs text-ink-faint">Response / Resolution</div>
                <div className="text-ink font-medium">
                  {incident.responseMinutes != null ? `${incident.responseMinutes.toFixed(1)} min to respond` : 'Not yet responded'}
                  {incident.resolutionMinutes != null && ` · ${incident.resolutionMinutes.toFixed(1)} min to resolve`}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => handleAction('escalated', 'Escalated')}>
            <ArrowUpCircle className="w-3.5 h-3.5 text-status-warning" /> Escalate
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleAction('resolved', 'Resolved')}>
            <CheckCircle2 className="w-3.5 h-3.5 text-status-success" /> Resolve
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleAction('closed', 'Closed')}>
            <XCircle className="w-3.5 h-3.5 text-status-danger" /> Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
