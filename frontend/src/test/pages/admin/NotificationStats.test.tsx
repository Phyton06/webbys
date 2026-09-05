import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import NotificationStatsPage from '../../../pages/admin/NotificationStats'

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
    <MemoryRouter initialEntries={['/admin/reportes/notificaciones']}>
      <NotificationStatsPage />
    </MemoryRouter>
  )
}

const mockStatsData = {
  total: 200,
  sent: 190,
  delivered: 150,
  failed: 10,
  byChannel: {
    SMS: { sent: 120, delivered: 100, failed: 5 },
    EMAIL: { sent: 50, delivered: 40, failed: 3 },
    PUSH: { sent: 20, delivered: 10, failed: 2 },
    WHATSAPP: { sent: 10, delivered: 0, failed: 0 },
  },
  byType: {
    APPOINTMENT_REMINDER: 140,
    PROMOTION: 40,
    STATUS_CHANGE: 15,
    GENERAL: 5,
  },
  trend: [
    { date: '2026-08-29', count: 25 },
    { date: '2026-08-30', count: 30 },
    { date: '2026-08-31', count: 20 },
    { date: '2026-09-01', count: 35 },
    { date: '2026-09-02', count: 40 },
    { date: '2026-09-03', count: 22 },
    { date: '2026-09-04', count: 28 },
  ],
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()

  mockApi.get.mockImplementation((url: string) => {
    if (url.startsWith('/notification-stats') || url.startsWith('/notifications/stats')) {
      return Promise.resolve({ data: mockStatsData })
    }
    return Promise.resolve({ data: {} })
  })
})

describe('Admin NotificationStats Page', () => {
  it('renders heading and overview stat cards', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Estadísticas de Notificaciones')).toBeInTheDocument()
    })

    // Overview cards
    expect(screen.getByText('Total Notificaciones')).toBeInTheDocument()
    expect(screen.getByText('200')).toBeInTheDocument()

    expect(screen.getByText('Tasa de Entrega')).toBeInTheDocument()
    expect(screen.getByText(/75%/)).toBeInTheDocument()

    expect(screen.getByText('Entregadas')).toBeInTheDocument()
    expect(screen.getByText('150')).toBeInTheDocument()

    expect(screen.getByText('Fallidas')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
  })

  it('displays channel breakdown with delivery counts', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Desglose por Canal')).toBeInTheDocument()
    })

    // Channel sections/labels
    expect(screen.getByText('SMS')).toBeInTheDocument()
    expect(screen.getByText('EMAIL')).toBeInTheDocument()
    expect(screen.getByText('PUSH')).toBeInTheDocument()
    expect(screen.getByText('WHATSAPP')).toBeInTheDocument()

    // SMS counts
    expect(screen.getByText(/120 enviados/i)).toBeInTheDocument()
    expect(screen.getByText(/100 entregados/i)).toBeInTheDocument()
  })

  it('renders trend line or chart visualization', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Tendencia de Envíos')).toBeInTheDocument()
    })

    // SVG line/polyline or points
    const svgElement = document.querySelector('svg.trend-chart')
    expect(svgElement).toBeInTheDocument()

    // Dates in trend
    expect(screen.getByText('2026-08-29')).toBeInTheDocument()
    expect(screen.getByText('2026-09-04')).toBeInTheDocument()
  })

  it('allows filtering by date range period', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Estadísticas de Notificaciones')).toBeInTheDocument()
    })

    const periodSelect = screen.getByLabelText(/período|rango/i)
    fireEvent.change(periodSelect, { target: { value: '30d' } })

    await waitFor(() => {
      expect(mockApi.get).toHaveBeenCalledWith(expect.stringContaining('30d'))
    })
  })
})
