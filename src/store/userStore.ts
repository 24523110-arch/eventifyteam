import { create } from 'zustand'
import type { AppUser, UserRole } from '@/types'
import { api, ApiError } from '@/services/api'
import { useToastStore } from '@/store/toastStore'

interface UserState {
  users: AppUser[]
  isLoading: boolean
  searchQuery: string
  fetchUsers: () => Promise<void>
  setSearchQuery: (q: string) => void
  filteredUsers: () => AppUser[]
  createUser: (input: { name: string; email: string; role: UserRole; password: string }) => Promise<void>
  updateUser: (id: string, input: { name: string; email: string; role: UserRole }) => Promise<void>
  deleteUser: (id: string) => Promise<void>
  toggleUserStatus: (id: string) => Promise<void>
}

function reportError(err: unknown, fallback: string) {
  const message = err instanceof ApiError ? err.message : fallback
  useToastStore.getState().show(message, 'error')
}

export const useUserStore = create<UserState>((set, get) => ({
  users: [],
  isLoading: false,
  searchQuery: '',

  fetchUsers: async () => {
    set({ isLoading: true })
    try {
      const users = await api.get<AppUser[]>('/api/users')
      set({ users, isLoading: false })
    } catch (err) {
      set({ isLoading: false })
      reportError(err, 'Gagal memuat daftar pengguna.')
    }
  },

  setSearchQuery: (q) => set({ searchQuery: q }),

  filteredUsers: () => {
    const { users, searchQuery } = get()
    if (!searchQuery.trim()) return users
    const q = searchQuery.toLowerCase()
    return users.filter(
      (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.includes(q)
    )
  },

  createUser: async (input) => {
    try {
      const created = await api.post<AppUser>('/api/users', input)
      set((state) => ({ users: [...state.users, created] }))
      useToastStore.getState().show('Pengguna berhasil dibuat.', 'success')
    } catch (err) {
      reportError(err, 'Gagal membuat pengguna.')
    }
  },

  updateUser: async (id, input) => {
    try {
      const updated = await api.put<AppUser>(`/api/users/${id}`, input)
      set((state) => ({ users: state.users.map((u) => (u.id === id ? updated : u)) }))
      useToastStore.getState().show('Pengguna berhasil diperbarui.', 'success')
    } catch (err) {
      reportError(err, 'Gagal memperbarui pengguna.')
    }
  },

  deleteUser: async (id) => {
    const previous = get().users
    set((state) => ({ users: state.users.filter((u) => u.id !== id) }))
    try {
      await api.delete(`/api/users/${id}`)
    } catch (err) {
      set({ users: previous })
      reportError(err, 'Gagal menghapus pengguna.')
    }
  },

  toggleUserStatus: async (id) => {
    try {
      const updated = await api.patch<AppUser>(`/api/users/${id}/toggle-status`)
      set((state) => ({ users: state.users.map((u) => (u.id === id ? updated : u)) }))
    } catch (err) {
      reportError(err, 'Gagal mengubah status pengguna.')
    }
  },
}))
