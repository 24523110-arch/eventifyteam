import { create } from 'zustand'
import type { NotificationItem, ActivityFeedItem } from '@/types'
import { api, ApiError } from '@/services/api'
import { useToastStore } from '@/store/toastStore'

interface NotificationState {
  notifications: NotificationItem[]
  activityFeed: ActivityFeedItem[]
  isLoading: boolean
  fetchNotifications: (opts?: { silent?: boolean }) => Promise<void>
  unreadCount: () => number
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  clearAll: () => Promise<void>
}

function reportError(err: unknown, fallback: string) {
  const message = err instanceof ApiError ? err.message : fallback
  useToastStore.getState().show(message, 'error')
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  activityFeed: [],
  isLoading: false,

  fetchNotifications: async (opts) => {
    const silent = opts?.silent ?? false
    if (!silent) set({ isLoading: true })
    try {
      const { notifications, activityFeed } = await api.get<{
        notifications: NotificationItem[]
        activityFeed: ActivityFeedItem[]
      }>('/api/notifications')
      set({ notifications, activityFeed, isLoading: false })
    } catch (err) {
      set({ isLoading: false })
      if (!silent) reportError(err, 'Gagal memuat notifikasi.')
    }
  },

  unreadCount: () => get().notifications.filter((n) => !n.read).length,

  markAsRead: async (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }))
    try {
      await api.patch(`/api/notifications/${id}/read`)
    } catch (err) {
      reportError(err, 'Gagal menandai notifikasi.')
    }
  },

  markAllAsRead: async () => {
    set((state) => ({ notifications: state.notifications.map((n) => ({ ...n, read: true })) }))
    try {
      await api.patch('/api/notifications/read-all')
    } catch (err) {
      reportError(err, 'Gagal menandai semua notifikasi.')
    }
  },

  clearAll: async () => {
    const previous = get().notifications
    set({ notifications: [] })
    try {
      await api.delete('/api/notifications')
    } catch (err) {
      set({ notifications: previous })
      reportError(err, 'Gagal menghapus notifikasi.')
    }
  },
}))

useNotificationStore.getState().fetchNotifications()
