import { Moon, Sun } from 'lucide-react'
import { useThemeStore } from '../../store/themeStore'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore()
  const isDark = theme === 'dark'

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        backgroundColor: isDark ? '#1e1a2e' : '#ffffff',
        borderColor:     isDark ? '#2d2840' : '#e8e8ee',
        color:           isDark ? '#c4b5d8' : '#374151',
      }}
      className="w-12 h-12 rounded-full border transition-colors flex items-center justify-center hover:opacity-80"
    >
      {isDark ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  )
}
