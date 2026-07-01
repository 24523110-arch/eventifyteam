import { create } from 'zustand'

interface NotificationPrefs {
  securityIncidents: boolean
  revenueMilestones: boolean
  crowdThresholdAlerts: boolean
  vendorCheckInUpdates: boolean
  systemAlerts: boolean
}

interface SettingsState {
  phone: string
  notificationPrefs: NotificationPrefs
  reduceMotion: boolean
  compactDensity: boolean
  language: 'id' | 'en'
  timezone: string
  setPhone: (phone: string) => void
  toggleNotificationPref: (key: keyof NotificationPrefs) => void
  setReduceMotion: (value: boolean) => void
  setCompactDensity: (value: boolean) => void
  setLanguage: (lang: 'id' | 'en') => void
  setTimezone: (tz: string) => void
}

export const useSettingsStore = create<SettingsState>((set) => ({
  phone: '+62 812-3456-7890',
  notificationPrefs: {
    securityIncidents: true,
    revenueMilestones: true,
    crowdThresholdAlerts: true,
    vendorCheckInUpdates: false,
    systemAlerts: true,
  },
  reduceMotion: false,
  compactDensity: false,
  language: 'id',
  timezone: 'wib',

  setPhone: (phone) => set({ phone }),
  toggleNotificationPref: (key) =>
    set((state) => ({
      notificationPrefs: { ...state.notificationPrefs, [key]: !state.notificationPrefs[key] },
    })),
  setReduceMotion: (value) => set({ reduceMotion: value }),
  setCompactDensity: (value) => set({ compactDensity: value }),
  setLanguage: (language) => set({ language }),
  setTimezone: (timezone) => set({ timezone }),
}))
