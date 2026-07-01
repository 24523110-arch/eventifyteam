import { create } from 'zustand'
import type { Incident, IncidentStatus } from '@/types'
import { api, ApiError } from '@/services/api'
import { useToastStore } from '@/store/toastStore'

interface IncidentState {
  incidents: Incident[]
  isLoading: boolean
  searchQuery: string
  fetchIncidents: (opts?: { silent?: boolean }) => Promise<void>
  setSearchQuery: (q: string) => void
  filteredIncidents: () => Incident[]
  createIncident: (input: Omit<Incident, 'id' | 'createdAt'>) => Promise<void>
  updateIncident: (id: string, input: Omit<Incident, 'id' | 'createdAt'>) => Promise<void>
  deleteIncident: (id: string) => Promise<void>
  setStatus: (id: string, status: IncidentStatus) => Promise<void>
  assignTeam: (id: string, team: string) => Promise<void>
}

function reportError(err: unknown, fallback: string) {
  const message = err instanceof ApiError ? err.message : fallback
  useToastStore.getState().show(message, 'error')
}

export const useIncidentStore = create<IncidentState>((set, get) => ({
  incidents: [],
  isLoading: false,
  searchQuery: '',

  fetchIncidents: async (opts) => {
    const silent = opts?.silent ?? false
    if (!silent) set({ isLoading: true })
    try {
      const incidents = await api.get<Incident[]>('/api/incidents')
      set({ incidents, isLoading: false })
    } catch (err) {
      set({ isLoading: false })
      if (!silent) reportError(err, 'Gagal memuat daftar insiden.')
    }
  },

  setSearchQuery: (q) => set({ searchQuery: q }),

  filteredIncidents: () => {
    const { incidents, searchQuery } = get()
    if (!searchQuery.trim()) return incidents
    const q = searchQuery.toLowerCase()
    return incidents.filter(
      (i) => i.id.toLowerCase().includes(q) || i.area.toLowerCase().includes(q) || i.description.toLowerCase().includes(q)
    )
  },

  createIncident: async (input) => {
    try {
      const created = await api.post<Incident>('/api/incidents', input)
      set((state) => ({ incidents: [created, ...state.incidents] }))
      useToastStore.getState().show('Insiden berhasil dibuat.', 'success')
    } catch (err) {
      reportError(err, 'Gagal membuat insiden.')
    }
  },

  updateIncident: async (id, input) => {
    try {
      const updated = await api.put<Incident>(`/api/incidents/${id}`, input)
      set((state) => ({ incidents: state.incidents.map((i) => (i.id === id ? updated : i)) }))
      useToastStore.getState().show('Insiden berhasil diperbarui.', 'success')
    } catch (err) {
      reportError(err, 'Gagal memperbarui insiden.')
    }
  },

  deleteIncident: async (id) => {
    const previous = get().incidents
    set((state) => ({ incidents: state.incidents.filter((i) => i.id !== id) }))
    try {
      await api.delete(`/api/incidents/${id}`)
    } catch (err) {
      set({ incidents: previous })
      reportError(err, 'Gagal menghapus insiden.')
    }
  },

  setStatus: async (id, status) => {
    try {
      const updated = await api.patch<Incident>(`/api/incidents/${id}/status`, { status })
      set((state) => ({ incidents: state.incidents.map((i) => (i.id === id ? updated : i)) }))
    } catch (err) {
      reportError(err, 'Gagal mengubah status insiden.')
    }
  },

  assignTeam: async (id, team) => {
    try {
      const updated = await api.patch<Incident>(`/api/incidents/${id}/assign`, { team })
      set((state) => ({ incidents: state.incidents.map((i) => (i.id === id ? updated : i)) }))
    } catch (err) {
      reportError(err, 'Gagal menugaskan tim.')
    }
  },
}))

useIncidentStore.getState().fetchIncidents()
