import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Analytics from '../../../pages/admin/Analytics'

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
    <MemoryRouter initialEntries={['/admin/analytics']}>
      <Analytics />
    </MemoryRouter>
  )
}

const mockAnalyticsSummary = {
  kpis: [
    { label: 'Ingresos totales', value: 8400, change: 12.5, trend: 'UP' },
    { label: 'Citas completadas', value: 120, change: 8.2, trend: 'UP' },
    { label: 'Tasa de asistencia', value: 91.7, change: -1.3, trend: 'DOWN' },
    { label: 'Ticket promedio', value: 70, change: 0, trend: 'STABLE' },
  ],
  retention: [
    { month: '2026-04', retained: 75, churned: 8 },
    { month: '2026-05', retained: 78, churned: 7 },
    { month: '2026-06', retained: 80, churned: 6 },
    { month: '2026-07', retained: 82, churned: 5 },
    { month: '2026-08', retained: 85, churned: 6 },
    { month: '2026-09', retained: 88, churned: 4 },
  ],
  peakHours: [
    { hour: 10, day: 'monday', count: 12 },
    { hour: 11, day: 'monday', count: 14 },
    { hour: 15, day: 'saturday', count: 20 },
    { hour: 16, day: 'saturday', count: 25 },
  ],
  topServices: [
    { serviceId: 's1', name: 'Corte de cabello', count: 45, revenue: 6750 },
    { serviceId: 's3', name: 'Corte + Barba', count: 30, revenue: 6600 },
  ],
  customerLifetimeValue: [
    { clientId: 'u5', name: 'Ana Cliente', ltv: 2400, visits: 16 },
    { clientId: 'u6', name: 'Luis Cliente', ltv: 1800, visits: 12 },
  ],
  noShowRate: 8.3,
}

describe('Admin Analytics Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()

    mockApi.get.mockImplementation((url: string) => {
      if (url.startsWith('/analytics/summary')) {
        return Promise.resolve({ data: mockAnalyticsSummary })
      }
      return Promise.resolve({ data: mockAnalyticsSummary })
    })
  })

  it('renders heading, KPI cards with trends, and no-show rate', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText(/Análisis y Métricas del Negocio/i)).toBeInTheDocument()
    })

    expect(screen.getByText('Ingresos totales')).toBeInTheDocument()
    expect(screen.getByText('Citas completadas')).toBeInTheDocument()
    expect(screen.getByText('Tasa de asistencia')).toBeInTheDocument()
    expect(screen.getByText('Ticket promedio')).toBeInTheDocument()
    expect(screen.getByText(/8.3%/i)).toBeInTheDocument() // No-show rate
  })

  it('renders retention trend chart and monthly records', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText(/Tendencia de Retención de Clientes/i)).toBeInTheDocument()
    })

    // Months should be rendered
    expect(screen.getAllByText('2026-09').length).toBeGreaterThan(0)
    expect(screen.getAllByText('2026-04').length).toBeGreaterThan(0)
  })

  it('renders peak hours heatmap matrix', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText(/Mapa de Calor: Horas Pico/i)).toBeInTheDocument()
    })

    expect(screen.getByText(/Lunes/i)).toBeInTheDocument()
    expect(screen.getByText(/Sábado/i)).toBeInTheDocument()
  })

  it('renders Customer Lifetime Value (LTV) top client rankings', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText(/Valor de Vida del Cliente \(LTV\)/i)).toBeInTheDocument()
    })

    expect(screen.getByText('Ana Cliente')).toBeInTheDocument()
    expect(screen.getByText('$2,400')).toBeInTheDocument()
    expect(screen.getByText('Luis Cliente')).toBeInTheDocument()
    expect(screen.getByText('$1,800')).toBeInTheDocument()
  })

  it('allows changing date range filter and refetches summary', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText(/Análisis y Métricas del Negocio/i)).toBeInTheDocument()
    })

    const periodSelect = screen.getByLabelText(/Periodo/i)
    fireEvent.change(periodSelect, { target: { value: '30d' } })

    await waitFor(() => {
      expect(mockApi.get).toHaveBeenCalledWith(expect.stringContaining('30d'))
    })
  })
})
