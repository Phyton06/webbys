import { describe, it, expect } from 'vitest'
import { screen, waitFor, fireEvent } from '@testing-library/react'
import { Routes, Route } from 'react-router-dom'
import { renderWithAuth } from '../renderWithAuth'
import Layout from '../../components/Layout'
import type { UserRole } from '../../contexts/AuthContext'

function renderLayout(role: UserRole, route: string) {
  return renderWithAuth(
    <Routes>
      <Route path={route} element={<Layout />}>
        <Route index element={<div>Outlet Content</div>} />
      </Route>
      <Route path="/login" element={<div>Login Page</div>} />
    </Routes>,
    {
      user: { id: '1', name: 'Test User', role, email: 'test@test.com', phone: '555' },
      route,
    },
  )
}

describe('Layout', () => {
  it('shows correct nav items for admin role', async () => {
    renderLayout('ADMIN', '/admin')
    await waitFor(() => {
      expect(screen.getByText('Inicio')).toBeInTheDocument()
      expect(screen.getByText('Barberos')).toBeInTheDocument()
      expect(screen.getByText('Clientes')).toBeInTheDocument()
      expect(screen.getByText('Servicios')).toBeInTheDocument()
      expect(screen.getByText('Citas')).toBeInTheDocument()
    })
  })

  it('shows correct nav items for barber role', async () => {
    renderLayout('BARBER', '/barbero')
    await waitFor(() => {
      expect(screen.getByText('Mis Citas')).toBeInTheDocument()
      expect(screen.getByText('Perfil')).toBeInTheDocument()
      expect(screen.getByText('Horario')).toBeInTheDocument()
    })
  })

  it('shows correct nav items for client role', async () => {
    renderLayout('CLIENT', '/cliente')
    await waitFor(() => {
      expect(screen.getByText('Agendar')).toBeInTheDocument()
      expect(screen.getByText('Mis Citas')).toBeInTheDocument()
      expect(screen.getByText('Barberos')).toBeInTheDocument()
    })
  })

  it('shows logout button', async () => {
    renderLayout('ADMIN', '/admin')
    await waitFor(() => {
      expect(screen.getByLabelText('Cerrar sesión')).toBeInTheDocument()
    })
  })

  it('logout clears auth and navigates to login', async () => {
    renderLayout('ADMIN', '/admin')
    await waitFor(() => {
      expect(screen.getByLabelText('Cerrar sesión')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByLabelText('Cerrar sesión'))

    await waitFor(() => {
      expect(localStorage.getItem('webbys_current_user')).toBeNull()
      expect(screen.getByText('Login Page')).toBeInTheDocument()
    })
  })
})
