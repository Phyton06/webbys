import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Notifications from '../../../pages/admin/Notifications'

vi.mock('../../../api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

import api from '../../../api/client'
const mockApi = vi.mocked(api) as any

function renderComponent() {
  localStorage.setItem('user', JSON.stringify({ id: '1', name: 'Admin', role: 'ADMIN' }))
  return render(
    <MemoryRouter initialEntries={['/admin/notificaciones']}>
      <Notifications />
    </MemoryRouter>
  )
}

const mockNotificationsData = [
  { id: 'n1', title: 'Recordatorio de cita', recipientType: 'CLIENT', channel: 'SMS', status: 'SENT', createdAt: '2026-09-04T10:00:00Z' },
  { id: 'n2', title: 'Descuento especial', recipientType: 'CLIENT', channel: 'WHATSAPP', status: 'DELIVERED', createdAt: '2026-09-04T11:00:00Z' },
]

const mockTemplatesData = [
  { id: 't1', name: 'Recordatorio Cita', channel: 'SMS', type: 'APPOINTMENT_REMINDER' },
  { id: 't2', name: 'Promo Verano', channel: 'WHATSAPP', type: 'PROMOTION' },
]

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  mockApi.get.mockImplementation((url: string) => {
    if (url === '/notifications') return Promise.resolve({ data: mockNotificationsData })
    if (url === '/notifications/templates') return Promise.resolve({ data: mockTemplatesData })
    return Promise.resolve({ data: [] })
  })
})

describe('Admin Notifications Page', () => {
  it('renders heading, notification data, and templates section', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Notificaciones' })).toBeInTheDocument()
    })

    // mobile cards + desktop table = 2x each
    expect(screen.getAllByText('Recordatorio de cita').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Descuento especial').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByRole('heading', { name: 'Plantillas' })).toBeInTheDocument()
    expect(screen.getByText('Recordatorio Cita')).toBeInTheDocument()
  })

  it('searches notifications by title', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getAllByText('Recordatorio de cita').length).toBeGreaterThanOrEqual(1)
    })

    const searchInput = screen.getByLabelText('Buscar notificaciones')
    fireEvent.change(searchInput, { target: { value: 'Descuento' } })

    expect(screen.queryAllByText('Recordatorio de cita').length).toBe(0)
    expect(screen.getAllByText('Descuento especial').length).toBeGreaterThanOrEqual(1)
  })

  it('shows empty state when no notifications', async () => {
    mockApi.get.mockImplementation((url: string) => {
      if (url === '/notifications') return Promise.resolve({ data: [] })
      if (url === '/notifications/templates') return Promise.resolve({ data: [] })
      return Promise.resolve({ data: [] })
    })

    renderComponent()

    await waitFor(() => {
      // mobile + desktop both show the empty message
      expect(screen.getAllByText('No hay notificaciones').length).toBeGreaterThanOrEqual(1)
    })
  })

  it('shows empty state when search has no matches', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getAllByText('Recordatorio de cita').length).toBeGreaterThanOrEqual(1)
    })

    fireEvent.change(screen.getByLabelText('Buscar notificaciones'), { target: { value: 'zzz no existe' } })

    expect(screen.getAllByText('No hay notificaciones').length).toBeGreaterThanOrEqual(1)
  })
})
