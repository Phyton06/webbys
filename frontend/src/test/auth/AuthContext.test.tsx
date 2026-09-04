import { describe, it, expect } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { type ReactNode } from 'react'
import { AuthProvider, type User } from '../../contexts/AuthContext'
import { useAuth } from '../../hooks/useAuth'

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}

const testUser: User = { id: '1', name: 'Test User', role: 'CLIENT', email: 'test@test.com', phone: '555-0000' }

describe('AuthContext', () => {
  it('loginDirect stores user in localStorage and state', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    act(() => {
      result.current.loginDirect(testUser)
    })

    expect(result.current.user).toEqual(testUser)
    expect(result.current.isAuthenticated).toBe(true)
    expect(JSON.parse(localStorage.getItem('webbys_current_user')!)).toEqual(testUser)
  })

  it('logout clears localStorage and nulls user', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    act(() => {
      result.current.loginDirect(testUser)
    })

    act(() => {
      result.current.logout()
    })

    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
    expect(localStorage.getItem('webbys_current_user')).toBeNull()
  })

  it('reads user from localStorage on mount', async () => {
    localStorage.setItem('webbys_current_user', JSON.stringify(testUser))

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.user).toEqual(testUser)
    expect(result.current.isAuthenticated).toBe(true)
  })
})
