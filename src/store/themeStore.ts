import { create } from 'zustand'

export type Theme = 'dark' | 'light'
const STORAGE_KEY = 'eventify_theme'

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('light', theme === 'light')
}

function readStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    /* storage unavailable — fall through to default */
  }
  return 'dark'
}

interface ThemeState {
  theme: Theme
  toggleTheme: () => void
}

// Single-button dark/light theme toggle. Applies the `.light` class on
// <html>, which flips every CSS custom property in src/app/index.css — no
// per-component theming needed. Persisted to localStorage so it survives refresh.
export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: readStoredTheme(),

  toggleTheme: () => {
    const next: Theme = get().theme === 'dark' ? 'light' : 'dark'
    applyTheme(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* storage unavailable — theme still applies for this session */
    }
    set({ theme: next })
  },
}))

// Apply the persisted (or default) theme immediately at module load, before
// React mounts, so there's no flash of the wrong theme.
applyTheme(useThemeStore.getState().theme)
