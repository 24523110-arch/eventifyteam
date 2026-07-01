import { create } from 'zustand'
import type { AppUser, UserRole } from '@/types'
import { api, ApiError, setAuthToken, setUnauthorizedHandler } from '@/services/api'

const USER_KEY = 'eventify_user'
const TOKEN_KEY = 'eventify_token'

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

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

// Rehydrate the session from localStorage so a page refresh keeps the user
// logged in. The token is seeded into the API client too.
const persistedToken = readStorage(TOKEN_KEY)
const persistedUserRaw = readStorage(USER_KEY)
let persistedUser: AppUser | null = null
try {
  persistedUser = persistedUserRaw ? (JSON.parse(persistedUserRaw) as AppUser) : null
} catch {
  persistedUser = null
}
if (persistedToken) setAuthToken(persistedToken)

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: Boolean(persistedToken && persistedUser),
  user: persistedUser,
  isLoading: false,
  error: null,
  rememberMe: false,

  login: async (email, password, role, rememberMe) => {
    set({ isLoading: true, error: null })

    try {
      const { user, token } = await api.post<{ user: AppUser; token: string }>('/api/auth/login', {
        email,
        password,
        role,
      })
      setAuthToken(token)
      try {
        localStorage.setItem(USER_KEY, JSON.stringify(user))
      } catch {
        /* storage unavailable — session lives in memory only */
      }
      set({ isAuthenticated: true, user, isLoading: false, error: null, rememberMe })
      return true
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Gagal login. Silakan coba lagi.'
      set({ isLoading: false, error: message })
      return false
    }
  },

  logout: () => {
    setAuthToken(null)
    try {
      localStorage.removeItem(USER_KEY)
    } catch {
      /* ignore */
    }
    set({ isAuthenticated: false, user: null, error: null })
  },

  clearError: () => set({ error: null }),
}))

// When any request 401s, log out so ProtectedRoute redirects to /login.
setUnauthorizedHandler(() => useAuthStore.getState().logout())

export const ROLE_TO_DASHBOARD: Record<UserRole, string> = {
  manager: '/dashboard/manager',
  admin: '/dashboard/admin',
  security: '/dashboard/security',
}
