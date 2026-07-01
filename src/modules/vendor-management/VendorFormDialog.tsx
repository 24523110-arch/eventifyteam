import { useState, useEffect, type FormEvent } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { VENDOR_CATEGORIES } from '@/data/vendorData'
import type { Vendor, VendorStatus } from '@/types'

const STATUSES: VendorStatus[] = ['not_arrived', 'check_in', 'setup', 'ready', 'active', 'completed']

interface VendorFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vendor: Vendor | null // null = create mode
  onSubmit: (input: Omit<Vendor, 'id'>) => void
}

interface FormErrors {
  name?: string
  arrivalTime?: string
  assignedArea?: string
  contact?: string
}

export function VendorFormDialog({ open, onOpenChange, vendor, onSubmit }: VendorFormDialogProps) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState(VENDOR_CATEGORIES[0])
  const [arrivalTime, setArrivalTime] = useState('')
  const [status, setStatus] = useState<VendorStatus>('not_arrived')
  const [assignedArea, setAssignedArea] = useState('')
  const [contact, setContact] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})

  useEffect(() => {
    if (open) {
      setName(vendor?.name ?? '')
      setCategory(vendor?.category ?? VENDOR_CATEGORIES[0])
      setArrivalTime(vendor?.arrivalTime ?? '')
      setStatus(vendor?.status ?? 'not_arrived')
      setAssignedArea(vendor?.assignedArea ?? '')
      setContact(vendor?.contact ?? '')
      setErrors({})
    }
  }, [open, vendor])

  function validate(): boolean {
    const next: FormErrors = {}
    if (!name.trim()) next.name = 'Vendor name is required.'
    if (!arrivalTime.trim()) next.arrivalTime = 'Arrival time is required.'
    if (!assignedArea.trim()) next.assignedArea = 'Assigned area is required.'
    if (!contact.trim()) next.contact = 'Contact number is required.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!validate()) return
    onSubmit({ name: name.trim(), category, arrivalTime: arrivalTime.trim(), status, assignedArea: assignedArea.trim(), contact: contact.trim() })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{vendor ? 'Edit Vendor' : 'Add Vendor'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <Label>Vendor Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sari Roti Catering" error={!!errors.name} />
            {errors.name && <p className="text-xs text-status-danger mt-1.5">{errors.name}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VENDOR_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as VendorStatus)}>
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Arrival Time</Label>
              <Input type="time" value={arrivalTime} onChange={(e) => setArrivalTime(e.target.value)} error={!!errors.arrivalTime} />
              {errors.arrivalTime && <p className="text-xs text-status-danger mt-1.5">{errors.arrivalTime}</p>}
            </div>
            <div>
              <Label>Assigned Area</Label>
              <Input value={assignedArea} onChange={(e) => setAssignedArea(e.target.value)} placeholder="e.g. Food Court" error={!!errors.assignedArea} />
              {errors.assignedArea && <p className="text-xs text-status-danger mt-1.5">{errors.assignedArea}</p>}
            </div>
          </div>
          <div>
            <Label>Contact Number</Label>
            <Input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="08xxxxxxxxxx" error={!!errors.contact} />
            {errors.contact && <p className="text-xs text-status-danger mt-1.5">{errors.contact}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              {vendor ? 'Save Changes' : 'Add Vendor'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
