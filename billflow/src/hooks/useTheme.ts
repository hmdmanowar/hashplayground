import { useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'

// Shares the main Hash Playground app's "theme" localStorage key (same
// origin), so the choice carries over in both directions.
const STORAGE_KEY = 'theme'

function initialTheme(): Theme {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(initialTheme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      // ignore
    }
  }, [theme])

  return { theme, toggleTheme: () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark')) }
}
