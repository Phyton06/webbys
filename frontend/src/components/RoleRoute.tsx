import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import type { UserRole } from '../contexts/AuthContext'
import type { ReactNode } from 'react'
import LoadingSpinner from './LoadingSpinner'

const ROLE_ROUTES: Record<UserRole, string> = {
  ADMIN: '/admin',
  BARBER: '/barbero',
  CLIENT: '/cliente',
  ASSISTANT: '/asistente',
}

export default function RoleRoute({ allowedRoles, children }: { allowedRoles: UserRole[]; children: ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) return <LoadingSpinner />
  if (!user) return <Navigate to="/login" replace />
  if (!allowedRoles.includes(user.role)) return <Navigate to={ROLE_ROUTES[user.role]} replace />
  return <>{children}</>
}
