import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { supabase } from '../lib/supabase'
import type { Admin } from '../types'

interface AuthContextValue {
  admin: Admin | null
  loading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  clearError: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAdmin = useCallback(async (authUserId: string) => {
    const { data, error: dbError } = await supabase
      .from('admins')
      .select('*')
      .eq('auth_user_id', authUserId)
      .eq('is_active', true)
      .maybeSingle()

    if (dbError) throw new Error(dbError.message)
    return (data as Admin) ?? null
  }, [])

  const login = useCallback(
    async (email: string, password: string) => {
      setError(null)
      setLoading(true)
      try {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (authError || !data.user) {
          setError('Email yoki parol noto\'g\'ri')
          setAdmin(null)
          return
        }

        const found = await fetchAdmin(data.user.id)
        if (!found) {
          await supabase.auth.signOut()
          setError("Sizda ruxsat yo'q")
          setAdmin(null)
          return
        }

        setAdmin(found)
      } catch {
        setError("Kirishda xatolik yuz berdi. Qayta urinib ko'ring.")
        setAdmin(null)
      } finally {
        setLoading(false)
      }
    },
    [fetchAdmin],
  )

  const logout = useCallback(() => {
    setAdmin(null)
    supabase.auth.signOut()
  }, [])

  const clearError = useCallback(() => setError(null), [])

  useEffect(() => {
    let active = true

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) {
        if (active) setLoading(false)
        return
      }
      try {
        const found = await fetchAdmin(session.user.id)
        if (!active) return
        if (found) {
          setAdmin(found)
        } else {
          await supabase.auth.signOut()
        }
      } finally {
        if (active) setLoading(false)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        setAdmin(null)
      }
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [fetchAdmin])

  return (
    <AuthContext.Provider value={{ admin, loading, error, login, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
