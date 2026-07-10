import { useEffect, useState, type ChangeEvent } from 'react'
import { Plus, Trash2, Save, ImagePlus, AlertCircle } from 'lucide-react'
import { StatusBadge } from '@/components/StatusBadge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { useToastStore } from '@/store/toastStore'
import type { LpjSection, LpjSectionData } from '@/types'
import type { LpjSectionConfig, LpjColumn } from './sectionConfig'

const MAX_IMAGE_BYTES = 500 * 1024
type Row = Record<string, unknown>

// Reads an image file into a base64 data-URL (stored inline in section JSON).
function readImage(file: File, onDone: (dataUrl: string) => void, onError: (msg: string) => void) {
  if (file.size > MAX_IMAGE_BYTES) {
    onError('Ukuran gambar maksimal 500 KB.')
    return
  }
  const reader = new FileReader()
  reader.onload = () => onDone(String(reader.result))
  reader.onerror = () => onError('Gagal membaca file gambar.')
  reader.readAsDataURL(file)
}

interface SectionEditorProps {
  section: LpjSection
  config: LpjSectionConfig
  editable: boolean
  saving?: boolean
  onSave?: (data: LpjSectionData) => void
}

export function SectionEditor({ section, config, editable, saving, onSave }: SectionEditorProps) {
  const showToast = useToastStore((s) => s.show)
  const [draft, setDraft] = useState<LpjSectionData>(section.data ?? {})
  const [dirty, setDirty] = useState(false)

  // Re-sync from the store only when the section itself changes (not on every
  // background poll) so an in-progress draft never gets clobbered.
  useEffect(() => {
    setDraft(section.data ?? {})
    setDirty(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section.key, section.status])

  const update = (patch: LpjSectionData) => {
    setDraft((d) => ({ ...d, ...patch }))
    setDirty(true)
  }

  const getRows = (name: string): Row[] => (Array.isArray(draft[name]) ? (draft[name] as Row[]) : [])

  const setRow = (table: string, idx: number, col: string, value: unknown) => {
    const rows = [...getRows(table)]
    rows[idx] = { ...rows[idx], [col]: value }
    update({ [table]: rows })
  }

  const cellInput = (col: LpjColumn, tableName: string, idx: number, row: Row) => {
    const value = row[col.name]
    if (col.type === 'select') {
      return (
        <Select value={String(value ?? '')} onValueChange={(v) => setRow(tableName, idx, col.name, v)} disabled={!editable}>
          <SelectTrigger className="!py-1.5 text-xs min-w-28"><SelectValue placeholder="Pilih…" /></SelectTrigger>
          <SelectContent>
            {(col.options ?? []).map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
          </SelectContent>
        </Select>
      )
    }
    if (col.type === 'image') {
      return (
        <div className="flex items-center gap-2">
          {typeof value === 'string' && value.startsWith('data:image') ? (
            <img src={value} alt="" className="w-14 h-10 object-cover rounded-md border border-glass/10" />
          ) : (
            <span className="text-[10px] text-ink-faint">Belum ada</span>
          )}
          {editable && (
            <label className="p-1.5 rounded-lg hover:bg-glass/[0.06] text-ink-faint hover:text-primary cursor-pointer transition-colors">
              <ImagePlus className="w-3.5 h-3.5" />
              <input
                type="file"
                accept="image/png,image/jpeg"
                className="hidden"
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  const file = e.target.files?.[0]
                  if (file) readImage(file, (url) => setRow(tableName, idx, col.name, url), (msg) => showToast(msg, 'error'))
                  e.target.value = ''
                }}
              />
            </label>
          )}
        </div>
      )
    }
    if (col.type === 'textarea') {
      return (
        <textarea
          value={String(value ?? '')}
          onChange={(e) => setRow(tableName, idx, col.name, e.target.value)}
          disabled={!editable}
          rows={2}
          className="input-glass !py-1.5 text-xs min-w-36 resize-y"
        />
      )
    }
    return (
      <Input
        type={col.type === 'number' ? 'number' : 'text'}
        value={String(value ?? '')}
        onChange={(e) => setRow(tableName, idx, col.name, col.type === 'number' ? e.target.value : e.target.value)}
        disabled={!editable}
        className="!py-1.5 text-xs min-w-24"
      />
    )
  }

  return (
    <div className="space-y-5">
      {section.status === 'Returned' && section.managerNote && (
        <div className="flex items-start gap-2 px-3.5 py-3 rounded-xl bg-status-warning/10 border border-status-warning/30">
          <AlertCircle className="w-4 h-4 text-status-warning shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-status-warning">Dikembalikan oleh Manager — perlu revisi:</p>
            <p className="text-sm text-ink mt-0.5">{section.managerNote}</p>
          </div>
        </div>
      )}

      {config.hint && <p className="text-xs text-ink-faint italic">{config.hint}</p>}

      {config.fields && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {config.fields.map((f) => (
            <div key={f.name}>
              <Label>{f.label}</Label>
              {f.type === 'textarea' ? (
                <textarea
                  value={String(draft[f.name] ?? '')}
                  onChange={(e) => update({ [f.name]: e.target.value })}
                  disabled={!editable}
                  rows={3}
                  className="input-glass resize-y"
                />
              ) : (
                <Input
                  type={f.type === 'number' ? 'number' : 'text'}
                  value={String(draft[f.name] ?? '')}
                  onChange={(e) => update({ [f.name]: e.target.value })}
                  placeholder={f.placeholder}
                  disabled={!editable}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {config.tables?.map((table) => (
        <div key={table.name}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-ink">{table.label}</span>
            {editable && (
              <Button type="button" variant="ghost" size="sm" onClick={() => update({ [table.name]: [...getRows(table.name), {}] })}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Tambah Baris
              </Button>
            )}
          </div>
          <div className="overflow-x-auto scrollbar-thin rounded-xl border border-glass/10">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-glass/10">
                  {table.columns.map((c) => (
                    <th key={c.name} className="px-3 py-2 text-[11px] font-semibold text-ink-faint uppercase tracking-wider whitespace-nowrap">{c.label}</th>
                  ))}
                  {editable && <th className="px-2 py-2 w-8" />}
                </tr>
              </thead>
              <tbody>
                {getRows(table.name).length === 0 && (
                  <tr><td colSpan={table.columns.length + 1} className="px-3 py-4 text-center text-xs text-ink-faint">Belum ada data.</td></tr>
                )}
                {getRows(table.name).map((row, idx) => (
                  <tr key={idx} className="border-b border-glass/[0.06] align-top">
                    {table.columns.map((c) => (
                      <td key={c.name} className="px-2 py-1.5">{cellInput(c, table.name, idx, row)}</td>
                    ))}
                    {editable && (
                      <td className="px-2 py-1.5">
                        <button
                          type="button"
                          onClick={() => update({ [table.name]: getRows(table.name).filter((_, i) => i !== idx) })}
                          className="p-1.5 rounded-lg hover:bg-glass/[0.06] text-ink-faint hover:text-status-danger transition-colors"
                          title="Hapus baris"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {config.computed && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {config.computed(draft).map((c) => (
            <div key={c.label} className="px-3 py-2.5 rounded-xl bg-glass/[0.04] border border-glass/10">
              <div className="text-[10px] text-ink-faint uppercase tracking-wider">{c.label}</div>
              <div className="text-sm font-bold text-ink mt-0.5">{c.value}</div>
            </div>
          ))}
        </div>
      )}

      {editable && onSave && (
        <div className="flex items-center justify-end gap-3">
          {dirty && <span className="text-xs text-status-warning">Perubahan belum disimpan</span>}
          <Button type="button" size="sm" disabled={saving} onClick={() => { onSave(draft); setDirty(false) }}>
            <Save className="w-3.5 h-3.5 mr-1.5" /> Simpan Bagian
          </Button>
        </div>
      )}
    </div>
  )
}

export function SectionStatusBadge({ section }: { section: LpjSection }) {
  return <StatusBadge status={section.status} />
}
