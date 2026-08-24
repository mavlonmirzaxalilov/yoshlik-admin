import { useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

export function LoginPage() {
  const { login, error, loading, clearError } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const isValid = email.trim().length > 0 && password.length > 0

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!isValid || loading) return
    clearError()
    login(email.trim(), password)
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-surface-container-low font-body-md text-on-surface transition-colors duration-300">
      <div className="absolute right-6 top-6 z-50">
        <button
          aria-label="Mavzuni almashtirish"
          onClick={toggleTheme}
          className="rounded-full bg-surface-container-highest p-2 text-on-surface-variant shadow-sm transition-colors hover:bg-secondary-container focus:outline-none focus:ring-2 focus:ring-primary-container dark:bg-surface-container dark:text-secondary-fixed-dim dark:hover:bg-secondary-fixed"
        >
          <span className="material-symbols-outlined">
            {theme === 'dark' ? 'dark_mode' : 'light_mode'}
          </span>
        </button>
      </div>

      <div className="relative z-10 w-full max-w-[400px] px-4">
        <div className="overflow-hidden rounded-[20px] border border-outline-variant/30 bg-surface-container-lowest shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-2px_rgba(0,0,0,0.05)] dark:bg-on-secondary-fixed">
          <div className="flex flex-col items-center p-8">
            <div className="mb-8 flex flex-col items-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-container text-on-primary-container shadow-sm">
                <span className="font-display-lg text-display-lg font-bold leading-none">
                  Y
                </span>
              </div>
              <h1 className="text-center font-headline-md text-headline-md font-semibold text-on-surface">
                Yoshlik Kafe
              </h1>
              <p className="mt-1 text-center font-label-caps text-label-caps uppercase tracking-wider text-outline">
                Admin Panel
              </p>
            </div>

            <div className="mb-8 flex w-full flex-col items-center space-y-2 text-center">
              <h2 className="font-title-sm text-title-sm font-semibold text-on-surface">
                Tizimga kirish
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Email va parolingizni kiriting
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex w-full flex-col items-center space-y-4">
              {error && (
                <p className="w-full rounded-lg bg-error-container px-4 py-2 text-center text-status-badge font-status-badge text-on-error-container">
                  {error}
                </p>
              )}

              <input
                value={email}
                onChange={(e) => {
                  clearError()
                  setEmail(e.target.value)
                }}
                type="email"
                autoComplete="email"
                placeholder="email@misol.com"
                aria-label="Email"
                className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-4 py-3 text-left font-body-md text-body-md text-on-surface outline-none transition-colors focus:border-primary-container focus:ring-2 focus:ring-primary-container placeholder:text-outline-variant"
              />

              <input
                value={password}
                onChange={(e) => {
                  clearError()
                  setPassword(e.target.value)
                }}
                type="password"
                autoComplete="current-password"
                placeholder="Parol"
                aria-label="Parol"
                className="w-full rounded-lg border border-outline-variant bg-surface-container-low px-4 py-3 text-left font-body-md text-body-md text-on-surface outline-none transition-colors focus:border-primary-container focus:ring-2 focus:ring-primary-container placeholder:text-outline-variant"
              />

              <button
                type="submit"
                disabled={loading || !isValid}
                className="group flex h-[52px] w-full items-center justify-center space-x-2 rounded-lg bg-primary-container text-on-primary-container shadow-sm transition-colors duration-200 hover:bg-surface-tint focus:outline-none focus:ring-2 focus:ring-primary-container focus:ring-offset-2 focus:ring-offset-surface-container-lowest disabled:opacity-60"
              >
                {loading ? (
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-on-primary-container/40 border-t-on-primary-container" />
                ) : (
                  <span className="material-symbols-outlined text-[20px] transition-transform group-hover:scale-110">
                    login
                  </span>
                )}
                <span className="font-title-sm text-title-sm font-semibold">Kirish</span>
              </button>

              <p className="px-4 text-center font-label-caps text-label-caps text-outline">
                Faqat ruxsat berilgan administratorlar kira oladi
              </p>
            </form>
          </div>
          <div className="h-1 w-full bg-gradient-to-r from-primary-container via-surface-tint to-primary" />
        </div>
        <div className="mt-8 text-center">
          <p className="font-label-caps text-label-caps tracking-wider text-outline">
            © 2026 Yoshlik Kafe
          </p>
        </div>
      </div>
    </div>
  )
}
