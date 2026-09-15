import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Payments from '../../../pages/admin/Payments'

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
    <MemoryRouter initialEntries={['/admin/pagos']}>
      <Payments />
    </MemoryRouter>
  )
}

const mockPayments = [
  { id: 'p1', clientName: 'Ana Cliente', barberName: 'Juan Barbero', amount: 150, method: 'CASH', status: 'COMPLETED', date: '2026-09-04' },
  { id: 'p2', clientName: 'Luis Cliente', barberName: 'Pedro Barbero', amount: 250, method: 'CARD', status: 'COMPLETED', date: '2026-09-04' },
]

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  mockApi.get.mockImplementation((url: string) => {
    if (url === '/payments') return Promise.resolve({ data: mockPayments })
    return Promise.resolve({ data: [] })
  })
})

describe('Admin Payments Page', () => {
  it('renders heading, summary cards and payment data', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Gestión de Pagos')).toBeInTheDocument()
    })

    // Summary stat cards
    expect(screen.getByText('Ingresos Totales')).toBeInTheDocument()
    expect(screen.getByText('$400')).toBeInTheDocument()
    expect(screen.getByText('Completados')).toBeInTheDocument()
    expect(screen.getByText('Ticket Promedio')).toBeInTheDocument()
    expect(screen.getByText('Pendientes')).toBeInTheDocument()

    // Payment data (mobile card + desktop table = 2 each)
    expect(screen.getAllByText('Ana Cliente').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Luis Cliente').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('$150').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('$250').length).toBeGreaterThanOrEqual(1)
  })

  it('shows empty state when no payments', async () => {
    mockApi.get.mockImplementation((url: string) => {
      if (url === '/payments') return Promise.resolve({ data: [] })
      return Promise.resolve({ data: [] })
    })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Gestión de Pagos')).toBeInTheDocument()
    })

    expect(screen.getAllByText('No hay pagos').length).toBeGreaterThanOrEqual(1)
  })

  it('searches payments by client name', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getAllByText('Ana Cliente').length).toBeGreaterThanOrEqual(1)
    })

    const searchInput = screen.getByRole('textbox', { name: /buscar pagos/i })
    fireEvent.change(searchInput, { target: { value: 'Ana' } })

    expect(screen.getAllByText('Ana Cliente').length).toBeGreaterThanOrEqual(1)
    expect(screen.queryByText('Luis Cliente')).not.toBeInTheDocument()
  })
})
