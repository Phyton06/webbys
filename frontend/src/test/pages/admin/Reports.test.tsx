import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Reports from '../../../pages/admin/Reports'
import ReportsAppointments from '../../../pages/admin/ReportsAppointments'
import ReportsClients from '../../../pages/admin/ReportsClients'
import ReportsBarbers from '../../../pages/admin/ReportsBarbers'
import ReportsNotifications from '../../../pages/admin/ReportsNotifications'

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

describe('Admin Reports Hub & Sub-pages', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    localStorage.setItem('user', JSON.stringify({ id: '1', name: 'Admin', role: 'ADMIN' }))

    mockApi.get.mockImplementation((url: string) => {
      if (url.startsWith('/reports/appointments')) {
        return Promise.resolve({ data: mockAppointmentsReport })
      }
      if (url.startsWith('/reports/clients')) {
        return Promise.resolve({ data: mockClientsReport })
      }
      if (url.startsWith('/reports/barbers')) {
        return Promise.resolve({ data: mockBarbersReport })
      }
      if (url.startsWith('/reports/export')) {
        return Promise.resolve({ data: 'col1,col2\nval1,val2' })
      }
      if (url.startsWith('/notification-stats') || url.startsWith('/notifications/stats')) {
        return Promise.resolve({ data: mockNotificationStats })
      }
      return Promise.resolve({ data: {} })
    })
  })

  describe('Reports Hub Page', () => {
    it('renders report hub title and links to all report sub-pages', () => {
      render(
        <MemoryRouter initialEntries={['/admin/reportes']}>
          <Reports />
        </MemoryRouter>
      )

      expect(screen.getByText(/Centro de Reportes/i)).toBeInTheDocument()
      expect(screen.getByText(/Reporte de Ingresos/i)).toBeInTheDocument()
      expect(screen.getByText(/Reporte de Citas/i)).toBeInTheDocument()
      expect(screen.getByText(/Reporte de Clientes/i)).toBeInTheDocument()
      expect(screen.getByText(/Rendimiento de Barberos/i)).toBeInTheDocument()
      expect(screen.getByText(/Métricas de Notificaciones/i)).toBeInTheDocument()
    })
  })

  describe('Reports Appointments Page', () => {
    it('renders appointment KPIs and completion rate', async () => {
      render(
        <MemoryRouter initialEntries={['/admin/reportes/citas']}>
          <ReportsAppointments />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText(/Reporte de Citas y Reservas/i)).toBeInTheDocument()
      })

      expect(screen.getByText('120')).toBeInTheDocument() // Total
      expect(screen.getAllByText('100').length).toBeGreaterThan(0) // Completed
      expect(screen.getAllByText(/83\.3%/i).length).toBeGreaterThan(0) // Completion rate
    })
  })

  describe('Reports Clients Page', () => {
    it('renders client counts, retention rate, and top clients table', async () => {
      render(
        <MemoryRouter initialEntries={['/admin/reportes/clientes']}>
          <ReportsClients />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText(/Reporte de Clientes y Retención/i)).toBeInTheDocument()
      })

      expect(screen.getByText('50')).toBeInTheDocument() // Total clients
      expect(screen.getByText('10')).toBeInTheDocument() // New clients
      expect(screen.getByText(/60\.0%/i)).toBeInTheDocument() // Retention rate
      expect(screen.getByText('Ana Cliente')).toBeInTheDocument()
      expect(screen.getByText('$2,400')).toBeInTheDocument()
    })
  })

  describe('Reports Barbers Page', () => {
    it('renders barber rankings, appointments count, and revenues', async () => {
      render(
        <MemoryRouter initialEntries={['/admin/reportes/barberos']}>
          <ReportsBarbers />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText(/Reporte de Rendimiento por Barbero/i)).toBeInTheDocument()
      })

      expect(screen.getAllByText('Juan Barbero').length).toBeGreaterThan(0)
      expect(screen.getAllByText('$9,000').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Pedro Barbero').length).toBeGreaterThan(0)
      expect(screen.getAllByText('$6,000').length).toBeGreaterThan(0)
    })
  })

  describe('Reports Notifications Page', () => {
    it('renders notification stats with channel breakdown and overview', async () => {
      render(
        <MemoryRouter initialEntries={['/admin/reportes/notificaciones']}>
          <ReportsNotifications />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText(/Estadísticas de Notificaciones/i)).toBeInTheDocument()
      })

      expect(screen.getByText('200')).toBeInTheDocument() // Total
      expect(screen.getByText('150')).toBeInTheDocument() // Delivered
    })
  })
})
