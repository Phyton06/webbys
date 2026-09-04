import { describe, it, expect } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '../../contexts/AuthContext'
import ProtectedRoute from '../../components/ProtectedRoute'
import Login from '../../pages/Login'

const testUser = { id: '1', name: 'Test User', role: 'CLIENT', email: 'test@test.com', phone: '555-0000' }

function renderProtected({ seedUser = false, initialEntries = ['/protected'] } = {}) {
  if (seedUser) {
    localStorage.setItem('webbys_current_user', JSON.stringify(testUser))
  }
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route path="/protected" element={<ProtectedRoute><div>Protected Content</div></ProtectedRoute>} />
          <Route path="/cliente" element={<div>Client Dashboard</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('ProtectedRoute', () => {
  it('redirects to /login when no user in localStorage', async () => {
    renderProtected()
    await waitFor(() => {
      expect(screen.getByText('Login Page')).toBeInTheDocument()
    })
  })

  it('renders children when user exists in localStorage', async () => {
    renderProtected({ seedUser: true })
    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument()
    })
  })

  it('navigates to role route after login (preserves intended destination flow)', async () => {
    render(
      <MemoryRouter initialEntries={['/protected']}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/protected" element={<ProtectedRoute><div>Protected</div></ProtectedRoute>} />
            <Route path="/cliente" element={<div>Client Dashboard</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    )

    // Wait for redirect to login page
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /entrar como cliente/i })).toBeInTheDocument()
    })

    // Login as client
    fireEvent.click(screen.getByRole('button', { name: /entrar como cliente/i }))

    // Should navigate to client dashboard
    await waitFor(() => {
      expect(screen.getByText('Client Dashboard')).toBeInTheDocument()
    })
  })
})
