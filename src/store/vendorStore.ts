import { create } from 'zustand'
import type { Vendor, VendorStatus } from '@/types'
import { api, ApiError } from '@/services/api'
import { useToastStore } from '@/store/toastStore'

interface VendorState {
  vendors: Vendor[]
  isLoading: boolean
  searchQuery: string
  statusFilter: VendorStatus | 'all'
  fetchVendors: () => Promise<void>
  setSearchQuery: (q: string) => void
  setStatusFilter: (s: VendorStatus | 'all') => void
  filteredVendors: () => Vendor[]
  createVendor: (input: Omit<Vendor, 'id'>) => Promise<void>
  updateVendor: (id: string, input: Omit<Vendor, 'id'>) => Promise<void>
  deleteVendor: (id: string) => Promise<void>
}

function reportError(err: unknown, fallback: string) {
  const message = err instanceof ApiError ? err.message : fallback
  useToastStore.getState().show(message, 'error')
}

export const useVendorStore = create<VendorState>((set, get) => ({
  vendors: [],
  isLoading: false,
  searchQuery: '',
  statusFilter: 'all',

  fetchVendors: async () => {
    set({ isLoading: true })
    try {
      const vendors = await api.get<Vendor[]>('/api/vendors')
      set({ vendors, isLoading: false })
    } catch (err) {
      set({ isLoading: false })
      reportError(err, 'Gagal memuat daftar vendor.')
    }
  },

  setSearchQuery: (q) => set({ searchQuery: q }),
  setStatusFilter: (s) => set({ statusFilter: s }),

  filteredVendors: () => {
    const { vendors, searchQuery, statusFilter } = get()
    let result = vendors
    if (statusFilter !== 'all') {
      result = result.filter((v) => v.status === statusFilter)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (v) => v.name.toLowerCase().includes(q) || v.category.toLowerCase().includes(q) || v.assignedArea.toLowerCase().includes(q)
      )
    }
    return result
  },

  createVendor: async (input) => {
    try {
      const created = await api.post<Vendor>('/api/vendors', input)
      set((state) => ({ vendors: [...state.vendors, created] }))
      useToastStore.getState().show('Vendor berhasil dibuat.', 'success')
    } catch (err) {
      reportError(err, 'Gagal membuat vendor.')
    }
  },

  updateVendor: async (id, input) => {
    try {
      const updated = await api.put<Vendor>(`/api/vendors/${id}`, input)
      set((state) => ({ vendors: state.vendors.map((v) => (v.id === id ? updated : v)) }))
      useToastStore.getState().show('Vendor berhasil diperbarui.', 'success')
    } catch (err) {
      reportError(err, 'Gagal memperbarui vendor.')
    }
  },

  deleteVendor: async (id) => {
    const previous = get().vendors
    set((state) => ({ vendors: state.vendors.filter((v) => v.id !== id) }))
    try {
      await api.delete(`/api/vendors/${id}`)
    } catch (err) {
      set({ vendors: previous })
      reportError(err, 'Gagal menghapus vendor.')
    }
  },
}))
