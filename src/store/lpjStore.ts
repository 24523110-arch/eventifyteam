import { create } from 'zustand'
import type { LpjReport, LpjCreateInput, LpjNarrative, LpjSectionData } from '@/types'
import { api, ApiError } from '@/services/api'
import { useToastStore } from '@/store/toastStore'

// Report Management store: ONE collaborative report per concert, resolved
// server-side from the active event (`GET /api/lpj/active`). Every page
// (Admin's Report Management, Security's panels on Crowd Monitoring &
// Incident Center, Manager's Reports) shares this `current` report.
interface LpjState {
  current: LpjReport | null
  loaded: boolean
  isLoading: boolean
  isGenerating: boolean
  fetchActive: () => Promise<void>
  createReport: (input: LpjCreateInput) => Promise<boolean>
  deleteReport: (id: string) => Promise<void>
  saveSection: (id: string, key: string, data: LpjSectionData) => Promise<boolean>
  submitReport: (id: string) => Promise<boolean>
  returnSection: (id: string, key: string, note: string) => Promise<boolean>
  generate: (id: string) => Promise<boolean>
  saveNarrative: (id: string, narrative: LpjNarrative) => Promise<boolean>
  approve: (id: string, signature: string) => Promise<boolean>
  exportFile: (id: string, format: 'pdf' | 'docx') => Promise<void>
}

function reportError(err: unknown, fallback: string) {
  const message = err instanceof ApiError ? err.message : fallback
  useToastStore.getState().show(message, 'error')
}

export const useLpjStore = create<LpjState>((set, get) => ({
  current: null,
  loaded: false,
  isLoading: false,
  isGenerating: false,

  fetchActive: async () => {
    set({ isLoading: true })
    try {
      const { report } = await api.get<{ report: LpjReport | null }>('/api/lpj/active')
      set({ current: report, loaded: true, isLoading: false })
    } catch (err) {
      set({ isLoading: false, loaded: true })
      reportError(err, 'Gagal memuat laporan konser aktif.')
    }
  },

  createReport: async (input) => {
    try {
      await api.post<LpjReport>('/api/lpj', input)
      await get().fetchActive()
      useToastStore.getState().show('Laporan konser dibuat — semua bagian siap diisi tiap role.', 'success')
      return true
    } catch (err) {
      reportError(err, 'Gagal membuat laporan.')
      return false
    }
  },

  deleteReport: async (id) => {
    try {
      await api.delete(`/api/lpj/${id}`)
      set({ current: null })
      useToastStore.getState().show('Laporan dihapus.', 'success')
    } catch (err) {
      reportError(err, 'Gagal menghapus laporan.')
    }
  },

  saveSection: async (id, key, data) => {
    try {
      await api.put(`/api/lpj/${id}/sections/${key}`, { data })
      set((s) => ({
        current: s.current && s.current.id === id
          ? {
              ...s.current,
              sections: s.current.sections?.map((sec) =>
                sec.key === key ? { ...sec, data, status: 'In Progress' } : sec
              ),
            }
          : s.current,
      }))
      useToastStore.getState().show('Bagian laporan tersimpan.', 'success')
      return true
    } catch (err) {
      reportError(err, 'Gagal menyimpan bagian laporan.')
      return false
    }
  },

  submitReport: async (id) => {
    try {
      await api.post(`/api/lpj/${id}/submit`)
      await get().fetchActive()
      useToastStore.getState().show('Laporan dikirim — status: Waiting Manager Review.', 'success')
      return true
    } catch (err) {
      reportError(err, 'Gagal mengirim laporan.')
      return false
    }
  },

  returnSection: async (id, key, note) => {
    try {
      await api.post(`/api/lpj/${id}/sections/${key}/return`, { note })
      await get().fetchActive()
      useToastStore.getState().show('Bagian laporan dikembalikan untuk direvisi.', 'success')
      return true
    } catch (err) {
      reportError(err, 'Gagal mengembalikan bagian laporan.')
      return false
    }
  },

  generate: async (id) => {
    set({ isGenerating: true })
    try {
      await api.post(`/api/lpj/${id}/generate`)
      await get().fetchActive()
      set({ isGenerating: false })
      useToastStore.getState().show('Narasi laporan berhasil dibuat oleh AI.', 'success')
      return true
    } catch (err) {
      set({ isGenerating: false })
      reportError(err, 'Gagal membuat narasi laporan.')
      return false
    }
  },

  saveNarrative: async (id, narrative) => {
    try {
      await api.put(`/api/lpj/${id}/narrative`, { narrative })
      set((s) => ({ current: s.current && s.current.id === id ? { ...s.current, narrative } : s.current }))
      useToastStore.getState().show('Narasi tersimpan.', 'success')
      return true
    } catch (err) {
      reportError(err, 'Gagal menyimpan narasi.')
      return false
    }
  },

  approve: async (id, signature) => {
    try {
      await api.post(`/api/lpj/${id}/approve`, { signature })
      await get().fetchActive()
      useToastStore.getState().show('Laporan disetujui dan ditandatangani.', 'success')
      return true
    } catch (err) {
      reportError(err, 'Gagal menyetujui laporan.')
      return false
    }
  },

  exportFile: async (id, format) => {
    try {
      const { filename, fileBase64 } = await api.get<{ filename: string; fileBase64: string }>(
        `/api/lpj/${id}/export/${format}`
      )
      const bytes = Uint8Array.from(atob(fileBase64), (c) => c.charCodeAt(0))
      const mime = format === 'pdf'
        ? 'application/pdf'
        : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      const url = URL.createObjectURL(new Blob([bytes], { type: mime }))
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
      useToastStore.getState().show(`Laporan diunduh sebagai ${format.toUpperCase()}.`, 'success')
    } catch (err) {
      reportError(err, 'Gagal mengekspor laporan.')
    }
  },
}))
