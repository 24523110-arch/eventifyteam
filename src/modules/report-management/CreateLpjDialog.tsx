import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react'
import { ImagePlus, X } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useToastStore } from '@/store/toastStore'
import type { LpjCreateInput } from '@/types'

const EMPTY: LpjCreateInput = {
  concertName: '', theme: '', location: '', eventDate: '', eventTime: '',
  organizer: '', description: '', coverImage: '',
}

interface CreateLpjDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (input: LpjCreateInput) => void
  // Prefill from the active concert so the Admin/EO doesn't retype what the
  // Concert Schedule already knows.
  defaults?: Partial<LpjCreateInput>
}

export function CreateLpjDialog({ open, onOpenChange, onSubmit, defaults }: CreateLpjDialogProps) {
  const showToast = useToastStore((s) => s.show)
  const [form, setForm] = useState<LpjCreateInput>(EMPTY)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setForm({ ...EMPTY, ...Object.fromEntries(Object.entries(defaults ?? {}).filter(([, v]) => v)) })
      setError('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const set = (patch: Partial<LpjCreateInput>) => setForm((f) => ({ ...f, ...patch }))

  function handleCover(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (file.size > 500 * 1024) {
      showToast('Ukuran cover maksimal 500 KB.', 'error')
      return
    }
    const reader = new FileReader()
    reader.onload = () => set({ coverImage: String(reader.result) })
    reader.readAsDataURL(file)
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.concertName.trim() || !form.location.trim() || !form.eventDate.trim() || !form.organizer.trim()) {
      setError('Nama konser, lokasi, tanggal, dan penyelenggara wajib diisi.')
      return
    }
    onSubmit(form)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Buat Laporan LPJ Baru</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[65vh] overflow-y-auto scrollbar-thin pr-1" noValidate>
          {error && <p className="text-xs text-status-danger">{error}</p>}
          <div>
            <Label>Nama Konser</Label>
            <Input value={form.concertName} onChange={(e) => set({ concertName: e.target.value })} placeholder="mis. Pesta Musik Nusantara 2026" />
          </div>
          <div>
            <Label>Tema Konser</Label>
            <Input value={form.theme} onChange={(e) => set({ theme: e.target.value })} placeholder="mis. Harmoni dalam Keberagaman" />
          </div>
          <div>
            <Label>Lokasi</Label>
            <Input value={form.location} onChange={(e) => set({ location: e.target.value })} placeholder="mis. Stadion Utama GBK, Jakarta" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tanggal Pelaksanaan</Label>
              <Input value={form.eventDate} onChange={(e) => set({ eventDate: e.target.value })} placeholder="mis. 6 Juli 2026" />
            </div>
            <div>
              <Label>Waktu Pelaksanaan</Label>
              <Input value={form.eventTime} onChange={(e) => set({ eventTime: e.target.value })} placeholder="mis. 14.00–23.00 WIB" />
            </div>
          </div>
          <div>
            <Label>Nama Penyelenggara</Label>
            <Input value={form.organizer} onChange={(e) => set({ organizer: e.target.value })} placeholder="mis. Eventify Organizer" />
          </div>
          <div>
            <Label>Deskripsi Singkat Konser</Label>
            <textarea
              value={form.description}
              onChange={(e) => set({ description: e.target.value })}
              rows={3}
              className="input-glass resize-y"
              placeholder="Gambaran singkat kegiatan…"
            />
          </div>
          <div>
            <Label>Cover Image (opsional, maks 500 KB)</Label>
            {form.coverImage ? (
              <div className="relative inline-block">
                <img src={form.coverImage} alt="Cover" className="h-24 rounded-xl border border-glass/10 object-cover" />
                <button
                  type="button"
                  onClick={() => set({ coverImage: '' })}
                  className="absolute -top-2 -right-2 p-1 rounded-full bg-status-danger text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <label className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-glass/20 text-ink-faint hover:text-primary hover:border-primary/40 cursor-pointer transition-colors w-fit text-sm">
                <ImagePlus className="w-4 h-4" /> Pilih gambar…
                <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={handleCover} />
              </label>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)}>Batal</Button>
            <Button type="submit" size="sm">Buat Draft LPJ</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
