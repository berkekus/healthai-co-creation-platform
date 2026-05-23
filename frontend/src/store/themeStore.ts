import { create } from 'zustand'

type Theme = 'light' | 'dark'

interface ThemeState {
  theme: Theme
  toggleTheme: () => void
}

function applyTheme() {
  document.documentElement.classList.remove('dark')
  localStorage.setItem('theme', 'light')
}

const initial: Theme = 'light'
applyTheme()

export const useThemeStore = create<ThemeState>((set) => ({
  theme: initial,
  toggleTheme: () =>
    set(() => {
      applyTheme()
      return { theme: 'light' }
    }),
}))
