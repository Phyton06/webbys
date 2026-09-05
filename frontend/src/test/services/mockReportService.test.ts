import { describe, it, expect, beforeEach } from 'vitest'
import { mockReportService } from '../../services/mock/mockReportService'
import { mockPaymentService } from '../../services/mock/mockPaymentService'
import type { Payment } from '../../services/interfaces'

beforeEach(() => {
  localStorage.clear()
})

// Seed payments for reports
async function seedPayments() {
  const payments: Omit<Payment, 'id'>[] = [
    { appointmentId: 'a1', clientId: 'u5', barberId: 'u3', serviceId: 's1', amount: 150, method: 'CASH', status: 'COMPLETED', date: '2026-09-01' },
    { appointmentId: 'a2', clientId: 'u6', barberId: 'u3', serviceId: 's3', amount: 220, method: 'CARD', status: 'COMPLETED', date: '2026-09-02' },
    { appointmentId: 'a3', clientId: 'u5', barberId: 'u4', serviceId: 's2', amount: 100, method: 'CASH', status: 'COMPLETED', date: '2026-09-03' },
    { appointmentId: 'a4', clientId: 'u6', barberId: 'u4', serviceId: 's1', amount: 150, method: 'TRANSFER', status: 'PENDING', date: '2026-09-03' },
  ]
  for (const p of payments) await mockPaymentService.create(p)
}

describe('mockReportService', () => {
  describe('getRevenueReport', () => {
    it('computes revenue report from payments', async () => {
      await seedPayments()
      const report = await mockReportService.getRevenueReport('weekly', {
        start: '2026-09-01',
        end: '2026-09-07',
      })
      expect(report.period).toBe('weekly')
      expect(report.totalRevenue).toBe(470) // 150 + 220 + 100 (only COMPLETED)
      expect(report.appointmentCount).toBe(3)
      expect(report.averageTicket).toBeCloseTo(156.67, 0)
    })

    it('breaks down by barber', async () => {
      await seedPayments()
      const report = await mockReportService.getRevenueReport('weekly', {
        start: '2026-09-01',
        end: '2026-09-07',
      })
      expect(report.byBarber.length).toBeGreaterThan(0)
      const juan = report.byBarber.find(b => b.barberId === 'u3')
      expect(juan!.revenue).toBe(370) // 150 + 220
    })

    it('breaks down by service', async () => {
      await seedPayments()
      const report = await mockReportService.getRevenueReport('weekly', {
        start: '2026-09-01',
        end: '2026-09-07',
      })
      expect(report.byService.length).toBeGreaterThan(0)
    })
  })

  describe('getAppointmentReport', () => {
    it('computes appointment stats', async () => {
      const report = await mockReportService.getAppointmentReport('weekly', {
        start: '2026-09-01',
        end: '2026-09-07',
      })
      expect(report.period).toBe('weekly')
      expect(report.total).toBeGreaterThanOrEqual(0)
    })
  })

  describe('getClientReport', () => {
    it('computes client stats', async () => {
      const report = await mockReportService.getClientReport('monthly', {
        start: '2026-09-01',
        end: '2026-09-30',
      })
      expect(report.period).toBe('monthly')
      expect(report.totalClients).toBeGreaterThanOrEqual(0)
    })
  })

  describe('getBarberReport', () => {
    it('computes barber performance', async () => {
      const report = await mockReportService.getBarberReport('weekly', {
        start: '2026-09-01',
        end: '2026-09-07',
      })
      expect(report.period).toBe('weekly')
      expect(report.barbers).toBeDefined()
    })
  })

  describe('exportCSV', () => {
    it('generates CSV string', async () => {
      await seedPayments()
      const csv = await mockReportService.exportCSV('revenue', {
        start: '2026-09-01',
        end: '2026-09-07',
      })
      expect(typeof csv).toBe('string')
      expect(csv).toContain('date')
    })
  })
})
