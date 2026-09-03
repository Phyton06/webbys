import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import type { ReactNode } from 'react'
import LoadingSpinner from './LoadingSpinner'

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) return <LoadingSpinner />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}
