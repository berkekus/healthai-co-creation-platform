import { Moon, Sun } from 'lucide-react'
import { useThemeStore } from '../../store/themeStore'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore()

  return (
    <button
      onClick={toggleTheme}
      aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-[#2d1838] text-white shadow-[0_8px_24px_-6px_rgba(45,24,56,0.5)] transition-all duration-200 hover:scale-110 hover:shadow-[0_12px_28px_-8px_rgba(45,24,56,0.6)] dark:bg-[rgb(var(--hai-offwhite))] dark:text-[rgb(var(--hai-plum))] dark:shadow-[0_8px_24px_-6px_rgba(0,0,0,0.5)]"
    >
      {theme === 'light' ? (
        <Moon size={19} strokeWidth={2} />
      ) : (
        <Sun size={19} strokeWidth={2} />
      )}
    </button>
  )
}
