import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Settings from '../../../pages/admin/Settings'

vi.mock('../../../api/client', () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}))

import api from '../../../api/client'
const mockApi = vi.mocked(api) as any

const mockSettings = {
  business: {
    name: "Webby's Barbershop",
    address: 'Av. Principal 123',
    phone: '5551234567',
    email: 'contacto@webbys.com',
    openingHours: {
      monday: { open: '09:00', close: '18:00' },
      tuesday: { open: '09:00', close: '18:00' },
      wednesday: { open: '09:00', close: '18:00' },
      thursday: { open: '09:00', close: '18:00' },
      friday: { open: '09:00', close: '20:00' },
      saturday: { open: '10:00', close: '16:00' },
      sunday: null,
    },
    timezone: 'America/Mexico_City',
    currency: 'MXN',
  },
  roles: [
    { role: 'ADMIN', permissions: ['*'] },
    { role: 'BARBER', permissions: ['appointments.read', 'appointments.update'] },
  ],
  branding: {
    primaryColor: '#00BCD4',
    secondaryColor: '#1a1a2e',
    welcomeMessage: "Bienvenido a Webby's Barbershop",
  },
}

function renderComponent() {
  localStorage.setItem('user', JSON.stringify({ id: '1', name: 'Admin', role: 'ADMIN' }))
  return render(
    <MemoryRouter initialEntries={['/admin/configuracion']}>
      <Settings />
    </MemoryRouter>
  )
}

describe('Admin Settings Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()

    mockApi.get.mockImplementation((url: string) => {
      if (url === '/settings') {
        return Promise.resolve({ data: mockSettings })
      }
      return Promise.resolve({ data: [] })
    })

    mockApi.put.mockImplementation((url: string, body: any) => {
      if (url === '/settings/business') {
        return Promise.resolve({ data: { ...mockSettings.business, ...body } })
      }
      if (url === '/settings/branding') {
        return Promise.resolve({ data: { ...mockSettings.branding, ...body } })
      }
      return Promise.resolve({ data: {} })
    })
  })

  it('renders loading state initially and then shows business tab content', async () => {
    renderComponent()
    expect(screen.getByText('Configuración')).toBeDefined()
    await waitFor(() => {
      expect(screen.getByDisplayValue("Webby's Barbershop")).toBeDefined()
    })
  })

  it('allows editing business details and saving them', async () => {
    renderComponent()
    await waitFor(() => {
      expect(screen.getByDisplayValue("Webby's Barbershop")).toBeDefined()
    })

    const nameInput = screen.getByLabelText('Nombre del Negocio')
    fireEvent.change(nameInput, { target: { value: "New Webby's" } })
    expect(nameInput).toHaveValue("New Webby's")

    const saveButton = screen.getByRole('button', { name: 'Guardar Cambios' })
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(mockApi.put).toHaveBeenCalledWith('/settings/business', expect.objectContaining({
        name: "New Webby's",
      }))
    })
  })

  it('renders roles matrix as read-only', async () => {
    renderComponent()
    await waitFor(() => {
      expect(screen.getByText('Roles & Permisos')).toBeDefined()
    })

    // Click Roles tab
    const rolesTab = screen.getByText('Roles & Permisos')
    fireEvent.click(rolesTab)

    expect(screen.getByText('ADMIN')).toBeDefined()
    expect(screen.getByText('appointments.read, appointments.update')).toBeDefined()
  })

  it('renders and allows editing operating hours', async () => {
    renderComponent()
    await waitFor(() => {
      expect(screen.getByText('Horarios de Apertura')).toBeDefined()
    })

    // Click Hours tab
    const hoursTab = screen.getByText('Horarios de Apertura')
    fireEvent.click(hoursTab)

    expect(screen.getByText('Lunes')).toBeDefined()
    expect(screen.getByText('Domingo')).toBeDefined()

    // Find Monday opening input
    const mondayOpen = screen.getByLabelText('monday-open')
    fireEvent.change(mondayOpen, { target: { value: '08:00' } })

    const saveButton = screen.getByRole('button', { name: 'Guardar Cambios' })
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(mockApi.put).toHaveBeenCalledWith('/settings/business', expect.objectContaining({
        openingHours: expect.objectContaining({
          monday: expect.objectContaining({ open: '08:00' }),
        }),
      }))
    })
  })

  it('renders and allows editing branding config', async () => {
    renderComponent()
    await waitFor(() => {
      expect(screen.getByText('Branding & Personalización')).toBeDefined()
    })

    // Click Branding tab
    const brandingTab = screen.getByText('Branding & Personalización')
    fireEvent.click(brandingTab)

    const welcomeInput = screen.getByLabelText('Mensaje de Bienvenida')
    fireEvent.change(welcomeInput, { target: { value: 'Welcome to Webby!' } })

    const saveButton = screen.getByRole('button', { name: 'Guardar Cambios' })
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(mockApi.put).toHaveBeenCalledWith('/settings/branding', expect.objectContaining({
        welcomeMessage: 'Welcome to Webby!',
      }))
    })
  })
})
