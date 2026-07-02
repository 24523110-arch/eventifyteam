import { useState, useEffect, type FormEvent } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import type { ConcertSchedule } from '@/types'

interface ConcertScheduleFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  schedule: ConcertSchedule | null // null = create mode
  onSubmit: (input: { name: string; venue: string; date: string; capacity: number; currentPerformer?: string }) => void
}

interface FormErrors {
  name?: string
  venue?: string
  date?: string
  capacity?: string
}

export function ConcertScheduleFormDialog({ open, onOpenChange, schedule, onSubmit }: ConcertScheduleFormDialogProps) {
  const [name, setName] = useState('')
  const [venue, setVenue] = useState('')
  const [date, setDate] = useState('')
  const [capacity, setCapacity] = useState('')
  const [currentPerformer, setCurrentPerformer] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})

  useEffect(() => {
    if (open) {
      setName(schedule?.name ?? '')
      setVenue(schedule?.venue ?? '')
      setDate(schedule?.date ?? '')
      setCapacity(schedule ? String(schedule.capacity) : '')
      setCurrentPerformer(schedule?.currentPerformer ?? '')
      setErrors({})
    }
  }, [open, schedule])

  function validate(): boolean {
    const next: FormErrors = {}
    if (!name.trim()) next.name = 'Nama konser wajib diisi.'
    if (!venue.trim()) next.venue = 'Venue wajib diisi.'
    if (!date.trim()) next.date = 'Tanggal wajib diisi.'
    if (!capacity.trim() || Number(capacity) <= 0) next.capacity = 'Kapasitas harus lebih dari 0.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!validate()) return
    onSubmit({
      name: name.trim(),
      venue: venue.trim(),
      date: date.trim(),
      capacity: Number(capacity),
      currentPerformer: currentPerformer.trim(),
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{schedule ? 'Edit Jadwal Konser' : 'Jadwal Konser Baru'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <Label>Nama Konser</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Coldplay — Music of the Spheres" error={!!errors.name} />
            {errors.name && <p className="text-xs text-status-danger mt-1.5">{errors.name}</p>}
          </div>
          <div>
            <Label>Venue</Label>
            <Input value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="e.g. Gelora Bung Karno Stadium, Jakarta" error={!!errors.venue} />
            {errors.venue && <p className="text-xs text-status-danger mt-1.5">{errors.venue}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tanggal</Label>
              <Input value={date} onChange={(e) => setDate(e.target.value)} placeholder="19 Juni 2026" error={!!errors.date} />
              {errors.date && <p className="text-xs text-status-danger mt-1.5">{errors.date}</p>}
            </div>
            <div>
              <Label>Kapasitas</Label>
              <Input type="number" min="1" value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="60000" error={!!errors.capacity} />
              {errors.capacity && <p className="text-xs text-status-danger mt-1.5">{errors.capacity}</p>}
            </div>
          </div>
          <div>
            <Label>Performer (opsional)</Label>
            <Input value={currentPerformer} onChange={(e) => setCurrentPerformer(e.target.value)} placeholder="e.g. Coldplay — Main Set" />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" size="sm">
              {schedule ? 'Simpan Perubahan' : 'Buat Jadwal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
