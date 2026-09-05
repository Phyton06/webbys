import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import App from '../../../App'
import { renderWithAuth } from '../../renderWithAuth'

// Mock window.matchMedia for JSDOM
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

// Mock the API client
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

// Comprehensive Mock Data Structures
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

const mockAppointmentsReport = {
  period: 'month',
  total: 120,
  completed: 100,
  cancelled: 15,
  noShow: 5,
  byStatus: { COMPLETED: 100, CANCELLED: 15, NO_SHOW: 5 },
  byDay: [
    { date: '2026-09-01', count: 18 },
    { date: '2026-09-02', count: 22 },
  ],
}

const mockClientsReport = {
  period: 'month',
  totalClients: 50,
  newClients: 10,
  returningClients: 30,
  retentionRate: 0.6,
  topClients: [
    { clientId: 'u5', name: 'Ana Cliente', visits: 16, spent: 2400 },
    { clientId: 'u6', name: 'Luis Cliente', visits: 12, spent: 1800 },
  ],
}

const mockBarbersReport = {
  period: 'month',
  barbers: [
    {
      barberId: 'u3',
      name: 'Juan Barbero',
      appointments: 60,
      revenue: 9000,
      averageRating: 4.8,
      noShowRate: 3.3,
    },
    {
      barberId: 'u4',
      name: 'Pedro Barbero',
      appointments: 40,
      revenue: 6000,
      averageRating: 4.6,
      noShowRate: 5.0,
    },
  ],
}

const mockNotificationStats = {
  total: 200,
  sent: 190,
  delivered: 150,
  failed: 10,
  byChannel: {
    SMS: { sent: 120, delivered: 100, failed: 5 },
    EMAIL: { sent: 50, delivered: 40, failed: 3 },
  },
  byType: {
    APPOINTMENT_REMINDER: 140,
  },
  trend: [{ date: '2026-09-04', count: 28 }],
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
  peakHours: [
    { hour: 10, day: 'monday', count: 12 },
  ],
  topServices: [
    { serviceId: 's1', name: 'Corte de cabello', count: 45, revenue: 6750 },
  ],
  customerLifetimeValue: [
    { clientId: 'u5', name: 'Ana Cliente', ltv: 2400, visits: 16 },
  ],
  noShowRate: 8.3,
}

describe('Admin Routes Integration Test', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()

    // Default mock implementation to return empty arrays or expected basic structures
    mockApi.get.mockImplementation((url: string) => {
      if (url === '/auth/me') {
        return Promise.resolve({ data: adminUser })
      }
      if (url === '/settings') {
        return Promise.resolve({
          data: {
            business: {
              name: "Webby's Barbershop",
              openingHours: {
                monday: { open: '09:00', close: '18:00' },
                sunday: null,
              },
              branding: {}
            },
            roles: [],
            branding: { welcomeMessage: 'Bienvenido', primaryColor: '#00BCD4', secondaryColor: '#1a1a2e' },
          },
        })
      }
      if (url === '/clients') {
        return Promise.resolve({ data: [{ id: 'u5', name: 'Ana Cliente', phone: '123' }] })
      }
      if (url === '/barbers') {
        return Promise.resolve({ data: [{ id: 'u3', name: 'Juan Barbero' }] })
      }
      if (url.startsWith('/schedules/exceptions')) {
        return Promise.resolve({ data: [] })
      }
      if (url.startsWith('/schedules')) {
        return Promise.resolve({ data: { barberId: 'u3', entries: [] } })
      }
      if (url.startsWith('/campaigns/')) {
        return Promise.resolve({
          data: { id: 'c1', name: 'Campana Test', stats: { sent: 100, opened: 50, clicked: 20, converted: 10, roi: 50 } },
        })
      }
      if (url.startsWith('/analytics/summary')) {
        return Promise.resolve({ data: mockAnalyticsSummary })
      }
      if (url.startsWith('/reports/revenue')) {
        return Promise.resolve({ data: mockRevenueReportData })
      }
      if (url.startsWith('/reports/appointments')) {
        return Promise.resolve({ data: mockAppointmentsReport })
      }
      if (url.startsWith('/reports/clients')) {
        return Promise.resolve({ data: mockClientsReport })
      }
      if (url.startsWith('/reports/barbers')) {
        return Promise.resolve({ data: mockBarbersReport })
      }
      if (url.startsWith('/notification-stats') || url.startsWith('/notifications/stats')) {
        return Promise.resolve({ data: mockNotificationStats })
      }
      return Promise.resolve({ data: [] })
    })
  })

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
    { path: '/admin/reportes/notificaciones', expectedText: 'Estadísticas de Notificaciones' },
    { path: '/admin/campanas', expectedText: 'Campañas y Promociones' },
    { path: '/admin/campanas/c1', expectedText: 'Mensajes Enviados' },
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
        expect(screen.getByText(new RegExp(expectedText, 'i'))).toBeInTheDocument()
      })
    })
  })
})
