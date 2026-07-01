import { create } from 'zustand'
import type { AppUser, UserRole } from '@/types'
import { api, ApiError } from '@/services/api'

interface AuthState {
  isAuthenticated: boolean
  user: AppUser | null
  isLoading: boolean
  error: string | null
  rememberMe: boolean
  login: (email: string, password: string, role: UserRole, rememberMe: boolean) => Promise<boolean>
  logout: () => void
  clearError: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  isLoading: false,
  error: null,
  rememberMe: false,

  login: async (email, password, role, rememberMe) => {
    set({ isLoading: true, error: null })

    try {
      const { user } = await api.post<{ user: AppUser }>('/api/auth/login', { email, password, role })
      set({ isAuthenticated: true, user, isLoading: false, error: null, rememberMe })
      return true
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Gagal login. Silakan coba lagi.'
      set({ isLoading: false, error: message })
      return false
    }
  },

  logout: () => set({ isAuthenticated: false, user: null, error: null }),
  clearError: () => set({ error: null }),
}))

export const ROLE_TO_DASHBOARD: Record<UserRole, string> = {
  manager: '/dashboard/manager',
  admin: '/dashboard/admin',
  security: '/dashboard/security',
}
