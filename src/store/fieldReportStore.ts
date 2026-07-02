import { create } from 'zustand'
import type { FieldReport } from '@/types'
import { api, ApiError } from '@/services/api'
import { useToastStore } from '@/store/toastStore'

interface FieldReportState {
  reports: FieldReport[]
  isLoading: boolean
  fetchReports: () => Promise<void>
  createReport: (input: { category: string; title: string; content: string }) => Promise<boolean>
}

// Manual field reports submitted by the Admin/Event Organizer from the venue,
// read by both the EO (their own list) and the Manager (incoming feed).
export const useFieldReportStore = create<FieldReportState>((set) => ({
  reports: [],
  isLoading: false,

  fetchReports: async () => {
    set({ isLoading: true })
    try {
      const reports = await api.get<FieldReport[]>('/api/field-reports')
      set({ reports, isLoading: false })
    } catch (err) {
      set({ isLoading: false })
      const message = err instanceof ApiError ? err.message : 'Gagal memuat laporan lapangan.'
      useToastStore.getState().show(message, 'error')
    }
  },

  createReport: async (input) => {
    try {
      const created = await api.post<FieldReport>('/api/field-reports', input)
      set((state) => ({ reports: [created, ...state.reports] }))
      useToastStore.getState().show('Laporan lapangan terkirim ke Manager.', 'success')
      return true
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Gagal mengirim laporan.'
      useToastStore.getState().show(message, 'error')
      return false
    }
  },
}))
