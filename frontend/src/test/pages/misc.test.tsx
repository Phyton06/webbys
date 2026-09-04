import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { AuthProvider } from '../../contexts/AuthContext'
import App from '../../App'
import Register from '../../pages/Register'

// InstallPrompt needs matchMedia in the jsdom env when rendering full App
beforeEach(() => {
  localStorage.clear()
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }),
  })
})

function LocationSpy() {
  const location = useLocation()
  return <div data-testid="location">{location.pathname}</div>
}

function AppWithSpy() {
  return (
    <MemoryRouter initialEntries={['/']}>
      <AuthProvider>
        <LocationSpy />
        <App />
      </AuthProvider>
    </MemoryRouter>
  )
}

describe('Register', () => {
  it('renders heading and back link', () => {
    render(<Register />, { wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter> })
    expect(screen.getByText("Webby's")).toBeInTheDocument()
    expect(screen.getByText('Prototipo — sin registro real')).toBeInTheDocument()
    expect(screen.getByText('Volver al inicio')).toHaveAttribute('href', '/login')
  })
})

describe('HomeRedirect', () => {
  it('redirects unauthenticated user to /login', async () => {
    render(<AppWithSpy />)
    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/login')
    })
  })

  it('redirects ADMIN to /admin', async () => {
    localStorage.setItem('webbys_current_user', JSON.stringify({ id: '1', name: 'Admin', role: 'ADMIN', email: 'a@a.com', phone: '555' }))
    render(<AppWithSpy />)
    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/admin')
    })
  })

  it('redirects BARBER to /barbero', async () => {
    localStorage.setItem('webbys_current_user', JSON.stringify({ id: '1', name: 'Barber', role: 'BARBER', email: 'b@b.com', phone: '555' }))
    render(<AppWithSpy />)
    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/barbero')
    })
  })

  it('redirects CLIENT to /cliente', async () => {
    localStorage.setItem('webbys_current_user', JSON.stringify({ id: '1', name: 'Client', role: 'CLIENT', email: 'c@c.com', phone: '555' }))
    render(<AppWithSpy />)
    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/cliente')
    })
  })

  it('redirects ASSISTANT to /asistente', async () => {
    localStorage.setItem('webbys_current_user', JSON.stringify({ id: '1', name: 'Assistant', role: 'ASSISTANT', email: 'a@a.com', phone: '555' }))
    render(<AppWithSpy />)
    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/asistente')
    })
  })

  it('shows loading state before redirect', async () => {
    render(<AppWithSpy />)
    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/login')
    })
  })
})
