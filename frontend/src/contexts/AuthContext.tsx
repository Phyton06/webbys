import { createContext, useState, useEffect, type ReactNode } from 'react'

export type UserRole = 'ADMIN' | 'BARBER' | 'CLIENT' | 'ASSISTANT'

export interface User {
  id: string
  name: string
  email: string
  phone: string
  role: UserRole
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  loginDirect: (user: User) => void
  logout: () => void
}

export const AuthContext = createContext<AuthContextType | null>(null)

const USER_KEY = 'webbys_current_user'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Cargar usuario de localStorage al iniciar
    const raw = localStorage.getItem(USER_KEY)
    if (raw) {
      try { setUser(JSON.parse(raw)) } catch { /* ignore */ }
    }
    setLoading(false)
  }, [])

  // Login directo con objeto user (prototipo, sin API)
  const loginDirect = (u: User) => {
    localStorage.setItem(USER_KEY, JSON.stringify(u))
    setUser(u)
  }

  const logout = () => {
    localStorage.removeItem(USER_KEY)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, loginDirect, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
