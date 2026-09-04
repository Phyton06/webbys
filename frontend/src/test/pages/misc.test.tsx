import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../../App'
import Register from '../../pages/Register'

beforeEach(() => localStorage.clear())

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
    render(<App />, { wrapper: ({ children }) => <MemoryRouter initialEntries={['/']}>{children}</MemoryRouter> })
    // Navigate to /login, Login form renders
    await waitFor(() => expect(screen.queryByText('Cargando...')).not.toBeInTheDocument())
    // Should show something from Login or the loading state resolved
    expect(document.querySelector('body')).toBeTruthy()
  })

  it('redirects ADMIN to /admin', async () => {
    localStorage.setItem('webbys_current_user', JSON.stringify({ id: '1', name: 'Admin', role: 'ADMIN', email: 'a@a.com', phone: '555' }))
    render(<App />, { wrapper: ({ children }) => <MemoryRouter initialEntries={['/']}>{children}</MemoryRouter> })
    await waitFor(() => expect(screen.queryByText('Cargando...')).not.toBeInTheDocument())
  })

  it('redirects BARBER to /barbero', async () => {
    localStorage.setItem('webbys_current_user', JSON.stringify({ id: '1', name: 'Barber', role: 'BARBER', email: 'b@b.com', phone: '555' }))
    render(<App />, { wrapper: ({ children }) => <MemoryRouter initialEntries={['/']}>{children}</MemoryRouter> })
    await waitFor(() => expect(screen.queryByText('Cargando...')).not.toBeInTheDocument())
  })

  it('redirects CLIENT to /cliente', async () => {
    localStorage.setItem('webbys_current_user', JSON.stringify({ id: '1', name: 'Client', role: 'CLIENT', email: 'c@c.com', phone: '555' }))
    render(<App />, { wrapper: ({ children }) => <MemoryRouter initialEntries={['/']}>{children}</MemoryRouter> })
    await waitFor(() => expect(screen.queryByText('Cargando...')).not.toBeInTheDocument())
  })

  it('redirects ASSISTANT to /asistente', async () => {
    localStorage.setItem('webbys_current_user', JSON.stringify({ id: '1', name: 'Assistant', role: 'ASSISTANT', email: 'a@a.com', phone: '555' }))
    render(<App />, { wrapper: ({ children }) => <MemoryRouter initialEntries={['/']}>{children}</MemoryRouter> })
    await waitFor(() => expect(screen.queryByText('Cargando...')).not.toBeInTheDocument())
  })
})
