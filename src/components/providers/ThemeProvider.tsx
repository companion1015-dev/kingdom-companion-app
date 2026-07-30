'use client'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

// Genuinely new -- previously the theme preference saved correctly on the
// Profile page, but nothing anywhere actually read it or applied any dark
// styling. This provider is the real foundation everything else builds on:
// it reads the saved preference (localStorage first, for an instant
// correct render with no flash of the wrong theme; then the real profile
// API for signed-in users, in case they set it on another device), applies
// the "dark" class to <html> so Tailwind's dark: variants take effect, and
// exposes a way for any component (starting with the Profile page) to
// change it live, everywhere, immediately -- not just after a reload.

type Theme = 'light' | 'dark'

type ThemeContextValue = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue>({ theme: 'light', setTheme: () => {} })

export function useTheme() {
  return useContext(ThemeContext)
}

const STORAGE_KEY = 'kc-theme'

function applyTheme(theme: Theme) {
  if (theme === 'dark') document.documentElement.classList.add('dark')
  else document.documentElement.classList.remove('dark')
}

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light')

  useEffect(() => {
    // Instant, no-flash application from whatever was saved locally last time.
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Theme | null
      if (saved === 'dark' || saved === 'light') {
        setThemeState(saved)
        applyTheme(saved)
      }
    } catch { /* localStorage unavailable -- stay on light default */ }

    // Then reconcile with the real saved preference for signed-in users,
    // in case it was changed on a different device.
    fetch('/api/v1/user/profile', { credentials: 'include' })
      .then(async res => {
        if (res.status === 401) return
        const data = await res.json()
        if (data.success && (data.data.theme === 'dark' || data.data.theme === 'light')) {
          setThemeState(data.data.theme)
          applyTheme(data.data.theme)
          try { localStorage.setItem(STORAGE_KEY, data.data.theme) } catch { /* ignore */ }
        }
      })
      .catch(() => { /* guests and network failures just keep the local/default theme */ })
  }, [])

  const setTheme = (next: Theme) => {
    setThemeState(next)
    applyTheme(next)
    try { localStorage.setItem(STORAGE_KEY, next) } catch { /* ignore */ }
    // Best-effort sync to the real profile for signed-in users -- failing
    // silently here is fine, since the Profile page's own Save button is
    // the authoritative way to persist this; this just keeps things in sync
    // immediately when toggled from elsewhere in the app in the future.
    fetch('/api/v1/user/profile', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
      body: JSON.stringify({ theme: next }),
    }).catch(() => {})
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}