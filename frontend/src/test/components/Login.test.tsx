import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../../contexts/AuthContext'
import Login from '../../pages/Login'

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthProvider>
        <Login />
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('Login', () => {
  it('renders 4 role buttons', () => {
    renderLogin()
    expect(screen.getByRole('button', { name: /entrar como administrador/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /entrar como asistente/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /entrar como barbero/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /entrar como cliente/i })).toBeInTheDocument()
  })

  it('clicking a role button triggers login and stores user', async () => {
    renderLogin()
    fireEvent.click(screen.getByRole('button', { name: /entrar como administrador/i }))

    await waitFor(() => {
      const stored = localStorage.getItem('webbys_current_user')
      expect(stored).toBeTruthy()
      const user = JSON.parse(stored!)
      expect(user.role).toBe('ADMIN')
      expect(user.name).toBe('Carlos Dueño')
    })
  })
})
