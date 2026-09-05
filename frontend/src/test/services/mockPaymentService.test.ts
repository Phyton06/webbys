import { describe, it, expect, beforeEach } from 'vitest'
import { mockPaymentService } from '../../services/mock/mockPaymentService'
import type { Payment } from '../../services/interfaces'

beforeEach(() => {
  localStorage.clear()
})

describe('mockPaymentService', () => {
  const seedPayment: Omit<Payment, 'id'> = {
    appointmentId: 'a1',
    clientId: 'u5',
    barberId: 'u3',
    serviceId: 's1',
    amount: 150,
    method: 'CASH',
    status: 'COMPLETED',
    date: '2026-09-01',
  }

  describe('create', () => {
    it('creates a payment with generated id', async () => {
      const result = await mockPaymentService.create(seedPayment)
      expect(result.id).toBeTruthy()
      expect(result.amount).toBe(150)
      expect(result.method).toBe('CASH')
      expect(result.status).toBe('COMPLETED')
    })

    it('persists to localStorage', async () => {
      await mockPaymentService.create(seedPayment)
      const raw = localStorage.getItem('webbys_payments')
      expect(raw).toBeTruthy()
      const stored = JSON.parse(raw!)
      expect(stored).toHaveLength(1)
      expect(stored[0].amount).toBe(150)
    })
  })

  describe('getAll', () => {
    it('returns empty array when no payments', async () => {
      const result = await mockPaymentService.getAll()
      expect(result).toEqual([])
    })

    it('returns all payments', async () => {
      await mockPaymentService.create(seedPayment)
      await mockPaymentService.create({ ...seedPayment, amount: 200, method: 'CARD' })
      const result = await mockPaymentService.getAll()
      expect(result).toHaveLength(2)
    })

    it('filters by method', async () => {
      await mockPaymentService.create(seedPayment)
      await mockPaymentService.create({ ...seedPayment, method: 'CARD' })
      const result = await mockPaymentService.getAll({ method: 'CASH' })
      expect(result).toHaveLength(1)
      expect(result[0].method).toBe('CASH')
    })

    it('filters by status', async () => {
      await mockPaymentService.create(seedPayment)
      await mockPaymentService.create({ ...seedPayment, status: 'PENDING' })
      const result = await mockPaymentService.getAll({ status: 'PENDING' })
      expect(result).toHaveLength(1)
      expect(result[0].status).toBe('PENDING')
    })

    it('filters by date range', async () => {
      await mockPaymentService.create({ ...seedPayment, date: '2026-09-01' })
      await mockPaymentService.create({ ...seedPayment, date: '2026-09-15' })
      const result = await mockPaymentService.getAll({
        dateRange: { start: '2026-09-10', end: '2026-09-20' },
      })
      expect(result).toHaveLength(1)
      expect(result[0].date).toBe('2026-09-15')
    })
  })

  describe('getById', () => {
    it('returns payment by id', async () => {
      const created = await mockPaymentService.create(seedPayment)
      const result = await mockPaymentService.getById(created.id)
      expect(result.id).toBe(created.id)
      expect(result.amount).toBe(150)
    })

    it('throws for nonexistent id', async () => {
      await expect(mockPaymentService.getById('nonexistent')).rejects.toThrow()
    })
  })

  describe('updateStatus', () => {
    it('updates payment status', async () => {
      const created = await mockPaymentService.create(seedPayment)
      const updated = await mockPaymentService.updateStatus(created.id, 'REFUNDED')
      expect(updated.status).toBe('REFUNDED')
    })

    it('persists status change', async () => {
      const created = await mockPaymentService.create(seedPayment)
      await mockPaymentService.updateStatus(created.id, 'FAILED')
      const result = await mockPaymentService.getById(created.id)
      expect(result.status).toBe('FAILED')
    })
  })

  describe('getSummary', () => {
    it('computes summary from payments', async () => {
      await mockPaymentService.create({ ...seedPayment, amount: 100, status: 'COMPLETED' })
      await mockPaymentService.create({ ...seedPayment, amount: 200, status: 'COMPLETED' })
      await mockPaymentService.create({ ...seedPayment, amount: 50, status: 'PENDING' })
      await mockPaymentService.create({ ...seedPayment, amount: 30, status: 'REFUNDED' })

      const summary = await mockPaymentService.getSummary()
      expect(summary.totalRevenue).toBe(300) // only COMPLETED
      expect(summary.completedCount).toBe(2)
      expect(summary.pendingCount).toBe(1)
      expect(summary.refundedCount).toBe(1)
    })

    it('groups by method', async () => {
      await mockPaymentService.create({ ...seedPayment, amount: 100, method: 'CASH', status: 'COMPLETED' })
      await mockPaymentService.create({ ...seedPayment, amount: 200, method: 'CARD', status: 'COMPLETED' })

      const summary = await mockPaymentService.getSummary()
      expect(summary.byMethod['CASH']).toBe(100)
      expect(summary.byMethod['CARD']).toBe(200)
    })
  })

  describe('getDailyRevenue', () => {
    it('groups revenue by date', async () => {
      await mockPaymentService.create({ ...seedPayment, amount: 100, date: '2026-09-01', status: 'COMPLETED' })
      await mockPaymentService.create({ ...seedPayment, amount: 50, date: '2026-09-01', status: 'COMPLETED' })
      await mockPaymentService.create({ ...seedPayment, amount: 200, date: '2026-09-02', status: 'COMPLETED' })

      const result = await mockPaymentService.getDailyRevenue({
        start: '2026-09-01',
        end: '2026-09-02',
      })
      expect(result).toHaveLength(2)
      expect(result.find(d => d.date === '2026-09-01')!.total).toBe(150)
      expect(result.find(d => d.date === '2026-09-02')!.total).toBe(200)
    })
  })
})
