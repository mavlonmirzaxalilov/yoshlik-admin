import { useTheme } from '../context/ThemeContext'

export function ThemeToggleButton({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      aria-label="Mavzuni almashtirish"
      onClick={toggleTheme}
      className={
        className ??
        'flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant transition-transform scale-95 active:scale-90 hover:bg-surface-container-low'
      }
    >
      <span className="material-symbols-outlined">
        {theme === 'dark' ? 'dark_mode' : 'light_mode'}
      </span>
    </button>
  )
}
