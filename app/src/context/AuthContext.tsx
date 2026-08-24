import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { supabase } from '../lib/supabase'
import type { Admin, AdminCode } from '../types'

interface AuthContextValue {
  admin: Admin | null
  loading: boolean
  error: string | null
  loginWithCode: (code: string) => Promise<void>
  logout: () => void
  clearError: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const STORAGE_KEY = 'yoshlik_admin_telegram_id'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAdmin = useCallback(async (telegramId: number | string) => {
    const { data, error: dbError } = await supabase
      .from('admins')
      .select('*')
      .eq('telegram_id', telegramId)
      .maybeSingle()

    if (dbError) throw new Error(dbError.message)
    if (!data || !data.is_active) return null
    return data as Admin
  }, [])

  const loginWithCode = useCallback(
    async (code: string) => {
      setError(null)
      setLoading(true)
      try {
        const nowIso = new Date().toISOString()
        const { data: codeRow, error: codeError } = await supabase
          .from('admin_codes')
          .select('*')
          .eq('code', code)
          .eq('used', false)
          .gt('expires_at', nowIso)
          .maybeSingle()

        if (codeError) throw new Error(codeError.message)
        if (!codeRow) {
          setError("Kod noto'g'ri yoki muddati tugagan")
          setAdmin(null)
          return
        }

        const found = await fetchAdmin((codeRow as AdminCode).telegram_id)
        if (!found) {
          setError("Sizda ruxsat yo'q")
          setAdmin(null)
          return
        }

        const { error: updateError } = await supabase
          .from('admin_codes')
          .update({ used: true })
          .eq('id', (codeRow as AdminCode).id)
          .eq('used', false)
        if (updateError) throw new Error(updateError.message)

        setAdmin(found)
        sessionStorage.setItem(STORAGE_KEY, String((codeRow as AdminCode).telegram_id))
      } catch {
        setError('Kirishda xatolik yuz berdi. Qayta urinib ko\'ring.')
        setAdmin(null)
      } finally {
        setLoading(false)
      }
    },
    [fetchAdmin],
  )

  const logout = useCallback(() => {
    setAdmin(null)
    sessionStorage.removeItem(STORAGE_KEY)
  }, [])

  const clearError = useCallback(() => setError(null), [])

  useEffect(() => {
    const storedId = sessionStorage.getItem(STORAGE_KEY)
    if (!storedId) {
      setLoading(false)
      return
    }
    fetchAdmin(storedId)
      .then((found) => {
        if (found) {
          setAdmin(found)
        } else {
          sessionStorage.removeItem(STORAGE_KEY)
        }
      })
      .catch(() => sessionStorage.removeItem(STORAGE_KEY))
      .finally(() => setLoading(false))
  }, [fetchAdmin])

  return (
    <AuthContext.Provider
      value={{ admin, loading, error, loginWithCode, logout, clearError }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
