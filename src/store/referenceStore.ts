import { create } from 'zustand'
import type { RoleOption } from '@/types'
import { api, ApiError } from '@/services/api'
import { useToastStore } from '@/store/toastStore'

interface ReferenceResponse {
  roles: RoleOption[]
  securityTeams: string[]
  vendorCategories: string[]
}

interface ReferenceState extends ReferenceResponse {
  isLoaded: boolean
  fetchReference: () => Promise<void>
}

// Lookup/config data (role options, security teams, vendor categories)
// fetched once from the API so no dropdown values are hardcoded in the app.
export const useReferenceStore = create<ReferenceState>((set) => ({
  roles: [],
  securityTeams: [],
  vendorCategories: [],
  isLoaded: false,

  fetchReference: async () => {
    try {
      const data = await api.get<ReferenceResponse>('/api/reference')
      set({ ...data, isLoaded: true })
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Gagal memuat data referensi.'
      useToastStore.getState().show(message, 'error')
    }
  },
}))

useReferenceStore.getState().fetchReference()
