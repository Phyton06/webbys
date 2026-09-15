import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import App from '../../../App'
import { renderWithAuth } from '../../renderWithAuth'

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  configurable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

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

const adminUser = {
  id: 'u1',
  name: 'Carlos Dueño',
  email: 'carlos@webbys.com',
  phone: '5551234567',
  role: 'ADMIN' as const,
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
    { month: '2026-09', retained: 88, churned: 4 },
  ],
  peakHours: [{ hour: 10, day: 'monday', count: 12 }],
  topServices: [{ serviceId: 's1', name: 'Corte de cabello', count: 45, revenue: 6750 }],
  customerLifetimeValue: [{ clientId: 'u5', name: 'Ana Cliente', ltv: 2400, visits: 16 }],
  noShowRate: 8.3,
}

describe('Admin Routes Integration Test', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()

    mockApi.get.mockImplementation((url: string) => {
      if (url === '/auth/me') return Promise.resolve({ data: adminUser })
      if (url === '/clients') return Promise.resolve({ data: [{ id: 'u5', name: 'Ana Cliente', phone: '123' }] })
      if (url === '/barbers') return Promise.resolve({ data: [{ id: 'u3', name: 'Juan Barbero' }] })
      if (url.startsWith('/schedules/exceptions')) return Promise.resolve({ data: [] })
      if (url.startsWith('/schedules')) return Promise.resolve({ data: { barberId: 'u3', entries: [] } })
      if (url.startsWith('/analytics/summary')) return Promise.resolve({ data: mockAnalyticsSummary })
      if (url.startsWith('/reports/revenue')) return Promise.resolve({ data: { period: 'week', totalRevenue: 3500, appointmentCount: 23, averageTicket: 152, byBarber: [], byService: [] } })
      if (url.startsWith('/reports/appointments')) return Promise.resolve({ data: { period: 'month', total: 120, completed: 100, cancelled: 15, noShow: 5, byStatus: {}, byDay: [] } })
      if (url.startsWith('/reports/clients')) return Promise.resolve({ data: { period: 'month', totalClients: 50, newClients: 10, returningClients: 30, retentionRate: 0.6, topClients: [] } })
      if (url.startsWith('/reports/barbers')) return Promise.resolve({ data: { period: 'month', barbers: [] } })
      if (url.startsWith('/reports/export')) return Promise.resolve({ data: 'csv' })
      if (url.startsWith('/notification-stats') || url.startsWith('/notifications/stats')) return Promise.resolve({ data: { total: 200, sent: 190, delivered: 150, failed: 10, byChannel: {}, byType: {}, trend: [] } })
      if (url === '/notifications') return Promise.resolve({ data: [] })
      if (url === '/notifications/templates') return Promise.resolve({ data: [] })
      if (url === '/appointments') return Promise.resolve({ data: [] })
      if (url === '/services') return Promise.resolve({ data: [] })
      if (url === '/payments') return Promise.resolve({ data: [] })
      if (url === '/campaigns') return Promise.resolve({ data: [] })
      if (url === '/assistants') return Promise.resolve({ data: [] })
      return Promise.resolve({ data: [] })
    })
  })

  // Use getByRole('heading') to avoid duplicate text from mobile cards + desktop table
  const testRoutes = [
    { path: '/admin', expectedText: 'Dashboard' },
    { path: '/admin/dashboard', expectedText: 'Dashboard' },
    { path: '/admin/barbers', expectedText: 'Barberos' },
    { path: '/admin/clients', expectedText: 'Clientes' },
    { path: '/admin/services', expectedText: 'Servicios' },
    { path: '/admin/citas', expectedText: 'Citas' },
    { path: '/admin/configuracion', expectedText: 'Datos de Negocio' },
    { path: '/admin/pagos', expectedText: 'Gestión de Pagos' },
    { path: '/admin/notificaciones', expectedText: 'Notificaciones' },
    { path: '/admin/campanas', expectedText: 'Campañas y Promociones' },
    { path: '/admin/reportes', expectedText: 'Centro de Reportes' },
    { path: '/admin/reportes/ingresos', expectedText: 'Reporte de Ingresos y Facturación' },
    { path: '/admin/reportes/citas', expectedText: 'Reporte de Citas y Reservas' },
    { path: '/admin/reportes/clientes', expectedText: 'Reporte de Clientes y Retención' },
    { path: '/admin/reportes/barberos', expectedText: 'Reporte de Rendimiento por Barbero' },
    { path: '/admin/horarios', expectedText: 'Horarios y Disponibilidad' },
    { path: '/admin/analytics', expectedText: 'Análisis y Métricas del Negocio' },
  ]

  testRoutes.forEach(({ path, expectedText }) => {
    it(`navigates to ${path} and renders correctly without crashing`, async () => {
      renderWithAuth(<App />, { user: adminUser, route: path })
      await waitFor(() => {
        // Use getAllByText to handle duplicates from mobile cards + desktop table
        const matches = screen.getAllByText(new RegExp(expectedText, 'i'))
        expect(matches.length).toBeGreaterThan(0)
      })
    })
  })
})
