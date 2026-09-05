import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ReportsRevenue from '../../../pages/admin/ReportsRevenue'

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
    <MemoryRouter initialEntries={['/admin/reportes/ingresos']}>
      <ReportsRevenue />
    </MemoryRouter>
  )
}

const mockRevenueReportData = {
  period: 'week',
  totalRevenue: 3500,
  appointmentCount: 23,
  averageTicket: 152.17,
  byBarber: [
    { barberId: 'u3', barberName: 'Juan Barbero', revenue: 2000, appointments: 13 },
    { barberId: 'u4', barberName: 'Pedro Barbero', revenue: 1500, appointments: 10 },
  ],
  byService: [
    { serviceId: 's1', serviceName: 'Corte de cabello', revenue: 1500, count: 10 },
    { serviceId: 's2', serviceName: 'Barba', revenue: 500, count: 5 },
    { serviceId: 's3', serviceName: 'Corte + Barba', revenue: 1500, count: 8 },
  ],
}

describe('Admin ReportsRevenue Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()

    mockApi.get.mockImplementation((url: string) => {
      if (url.startsWith('/reports/revenue')) {
        return Promise.resolve({ data: mockRevenueReportData })
      }
      if (url.startsWith('/reports/export')) {
        return Promise.resolve({ data: 'date,barber,amount\n2026-09-04,Juan,2000' })
      }
      return Promise.resolve({ data: {} })
    })
  })

  it('renders heading, KPI cards, and period selector', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText(/Reporte de Ingresos y Facturación/i)).toBeInTheDocument()
    })

    expect(screen.getByText('$3,500')).toBeInTheDocument()
    expect(screen.getByText('23')).toBeInTheDocument()
    expect(screen.getByText('$152')).toBeInTheDocument()
  })

  it('renders barber revenue breakdown and service breakdown', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Juan Barbero')).toBeInTheDocument()
    })

    expect(screen.getByText('Pedro Barbero')).toBeInTheDocument()
    expect(screen.getByText('Corte de cabello')).toBeInTheDocument()
    expect(screen.getByText('Corte + Barba')).toBeInTheDocument()
  })

  it('updates report when period changes', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('$3,500')).toBeInTheDocument()
    })

    const select = screen.getByLabelText(/Periodo/i)
    fireEvent.change(select, { target: { value: 'month' } })

    await waitFor(() => {
      expect(mockApi.get).toHaveBeenCalledWith(expect.stringContaining('period=month'))
    })
  })
})
