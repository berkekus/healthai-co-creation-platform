import { Moon, Sun } from 'lucide-react'
import { useThemeStore } from '../../store/themeStore'
import { IconButton } from './IconButton'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore()
  const isDark = theme === 'dark'

  return (
    <IconButton
      onClick={toggleTheme}
      label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      icon={isDark ? <Sun size={17} /> : <Moon size={17} />}
      size="lg"
      variant={isDark ? 'soft' : 'default'}
      style={{
        backgroundColor: isDark ? '#1e1a2e' : '#ffffff',
        borderColor:     isDark ? '#2d2840' : '#e8e8ee',
        color:           isDark ? '#c4b5d8' : '#374151',
      }}
      className="hover:opacity-80"
    />
  )
}
