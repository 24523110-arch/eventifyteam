import { create } from 'zustand'
import type { ConcertSchedule, ConcertScheduleStatus } from '@/types'
import { api, ApiError } from '@/services/api'
import { useToastStore } from '@/store/toastStore'

interface EventState {
  schedules: ConcertSchedule[]
  isLoading: boolean
  fetchSchedules: () => Promise<void>
  createSchedule: (input: { name: string; venue: string; date: string; capacity: number; currentPerformer?: string }) => Promise<void>
  updateSchedule: (
    id: string,
    input: { name: string; venue: string; date: string; capacity: number; currentPerformer?: string }
  ) => Promise<void>
  deleteSchedule: (id: string) => Promise<void>
  setStatus: (id: string, status: ConcertScheduleStatus) => Promise<void>
}

function reportError(err: unknown, fallback: string) {
  const message = err instanceof ApiError ? err.message : fallback
  useToastStore.getState().show(message, 'error')
}

// The Event Organizer's concert schedule — many entries tracked as
// Scheduled (belum berlangsung) / Live (sedang berlangsung) / Ended
// (riwayat). Every operational module (dashboard, vendors, incidents,
// notifications, reports) follows whichever schedule entry is Live.
export const useEventStore = create<EventState>((set, get) => ({
  schedules: [],
  isLoading: false,

  fetchSchedules: async () => {
    set({ isLoading: true })
    try {
      const schedules = await api.get<ConcertSchedule[]>('/api/events')
      set({ schedules, isLoading: false })
    } catch (err) {
      set({ isLoading: false })
      reportError(err, 'Gagal memuat jadwal konser.')
    }
  },

  createSchedule: async (input) => {
    try {
      const created = await api.post<ConcertSchedule>('/api/events', input)
      set((state) => ({ schedules: [...state.schedules, created] }))
      useToastStore.getState().show('Jadwal konser berhasil dibuat.', 'success')
    } catch (err) {
      reportError(err, 'Gagal membuat jadwal konser.')
    }
  },

  updateSchedule: async (id, input) => {
    try {
      const updated = await api.put<ConcertSchedule>(`/api/events/${id}`, input)
      set((state) => ({ schedules: state.schedules.map((s) => (s.id === id ? updated : s)) }))
      useToastStore.getState().show('Jadwal konser berhasil diperbarui.', 'success')
    } catch (err) {
      reportError(err, 'Gagal memperbarui jadwal konser.')
    }
  },

  deleteSchedule: async (id) => {
    const previous = get().schedules
    set((state) => ({ schedules: state.schedules.filter((s) => s.id !== id) }))
    try {
      await api.delete(`/api/events/${id}`)
    } catch (err) {
      set({ schedules: previous })
      reportError(err, 'Gagal menghapus jadwal konser.')
    }
  },

  setStatus: async (id, status) => {
    try {
      const updated = await api.patch<ConcertSchedule>(`/api/events/${id}/status`, { status })
      // Starting one Live demotes any other Live entry server-side — refetch
      // the full list so that transition is reflected everywhere.
      set((state) => ({
        schedules: state.schedules.map((s) => {
          if (s.id === id) return updated
          if (status === 'Live' && s.status === 'Live') return { ...s, status: 'Ended' }
          return s
        }),
      }))
    } catch (err) {
      reportError(err, 'Gagal mengubah status konser.')
    }
  },
}))
