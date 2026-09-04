import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider, type UserRole } from '../../contexts/AuthContext'
import RoleRoute from '../../components/RoleRoute'

function renderRoleRoute(allowedRoles: UserRole[], userRole: UserRole) {
  localStorage.setItem('webbys_current_user', JSON.stringify({
    id: '1', name: 'Test', role: userRole, email: 'test@test.com', phone: '555',
  }))

  return render(
    <MemoryRouter initialEntries={['/test']}>
      <AuthProvider>
        <Routes>
          <Route path="/test" element={
            <RoleRoute allowedRoles={allowedRoles}>
              <div>Allowed Content</div>
            </RoleRoute>
          } />
          <Route path="/admin" element={<div>Admin Page</div>} />
          <Route path="/barbero" element={<div>Barber Page</div>} />
          <Route path="/cliente" element={<div>Client Page</div>} />
          <Route path="/asistente" element={<div>Assistant Page</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('RoleRoute', () => {
  it('renders children when user role matches allowed roles', async () => {
    renderRoleRoute(['ADMIN'], 'ADMIN')
    await waitFor(() => {
      expect(screen.getByText('Allowed Content')).toBeInTheDocument()
    })
  })

  it('redirects to /admin when admin tries to access wrong route', async () => {
    renderRoleRoute(['BARBER'], 'ADMIN')
    await waitFor(() => {
      expect(screen.getByText('Admin Page')).toBeInTheDocument()
    })
  })

  it('redirects to /cliente when client tries to access admin route', async () => {
    renderRoleRoute(['ADMIN'], 'CLIENT')
    await waitFor(() => {
      expect(screen.getByText('Client Page')).toBeInTheDocument()
    })
  })

  it('redirects to /barbero when barber tries to access admin route', async () => {
    renderRoleRoute(['ADMIN'], 'BARBER')
    await waitFor(() => {
      expect(screen.getByText('Barber Page')).toBeInTheDocument()
    })
  })
})
