import { type ReactElement } from 'react'
import { render, type RenderResult } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider, type User } from '../contexts/AuthContext'

interface RenderWithAuthOptions {
  user?: User
  route?: string
}

const defaultUser: User = {
  id: '1',
  name: 'Test User',
  role: 'CLIENT',
  email: 'test@test.com',
  phone: '555-0000',
}

export function renderWithAuth(
  component: ReactElement,
  options: RenderWithAuthOptions = {},
): RenderResult & { user: User } {
  const { user = defaultUser, route = '/' } = options

  // Seed localStorage so AuthProvider picks up the user
  localStorage.setItem('webbys_current_user', JSON.stringify(user))

  const result = render(
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider>{component}</AuthProvider>
    </MemoryRouter>,
  )

  return { ...result, user }
}
