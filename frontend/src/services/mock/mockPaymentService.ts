import type { Payment, PaymentService, PaymentFilter } from '../interfaces'
import { load, save, genId, delay } from './storage'

const KEY = 'webbys_payments'

function matchesFilter(p: Payment, filter?: PaymentFilter): boolean {
  if (!filter) return true
  if (filter.method && p.method !== filter.method) return false
  if (filter.status && p.status !== filter.status) return false
  if (filter.barberId && p.barberId !== filter.barberId) return false
  if (filter.dateRange) {
    if (p.date < filter.dateRange.start || p.date > filter.dateRange.end) return false
  }
  return true
}

// Seed data for demo
function seed() {
  if (load<Payment>(KEY).length > 0) return
  const today = new Date().toISOString().split('T')[0]
  const payments: Payment[] = [
    { id: 'p1', appointmentId: 'a1', clientId: 'u5', barberId: 'u3', serviceId: 's1', amount: 150, method: 'CASH', status: 'COMPLETED', date: today },
    { id: 'p2', appointmentId: 'a2', clientId: 'u6', barberId: 'u3', serviceId: 's3', amount: 220, method: 'CARD', status: 'COMPLETED', date: today },
    { id: 'p3', appointmentId: 'a3', clientId: 'u5', barberId: 'u4', serviceId: 's2', amount: 100, method: 'TRANSFER', status: 'PENDING', date: today },
    { id: 'p4', appointmentId: 'a4', clientId: 'u6', barberId: 'u4', serviceId: 's1', amount: 150, method: 'CASH', status: 'COMPLETED', date: '2026-09-01' },
  ]
  save(KEY, payments)
}

seed()

export const mockPaymentService: PaymentService = {
  async getAll(filter) {
    await delay()
    return load<Payment>(KEY).filter(p => matchesFilter(p, filter))
  },

  async getById(id) {
    await delay()
    const p = load<Payment>(KEY).find(p => p.id === id)
    if (!p) throw new Error(`Payment ${id} not found`)
    return p
  },

  async create(data) {
    await delay()
    const payments = load<Payment>(KEY)
    const newPayment: Payment = { ...data, id: genId() }
    payments.push(newPayment)
    save(KEY, payments)
    return newPayment
  },

  async updateStatus(id, status) {
    await delay()
    const payments = load<Payment>(KEY)
    const idx = payments.findIndex(p => p.id === id)
    if (idx === -1) throw new Error(`Payment ${id} not found`)
    payments[idx].status = status
    save(KEY, payments)
    return payments[idx]
  },

  async getSummary(filter) {
    await delay()
    const payments = load<Payment>(KEY).filter(p => matchesFilter(p, filter))
    const byMethod: Record<string, number> = {}
    let totalRevenue = 0
    let completedCount = 0
    let pendingCount = 0
    let refundedCount = 0

    for (const p of payments) {
      if (p.status === 'COMPLETED') {
        totalRevenue += p.amount
        completedCount++
      }
      if (p.status === 'PENDING') pendingCount++
      if (p.status === 'REFUNDED') refundedCount++
      byMethod[p.method] = (byMethod[p.method] || 0) + p.amount
    }

    return { totalRevenue, completedCount, pendingCount, refundedCount, byMethod }
  },

  async getDailyRevenue(dateRange) {
    await delay()
    const payments = load<Payment>(KEY).filter(
      p => p.status === 'COMPLETED' && p.date >= dateRange.start && p.date <= dateRange.end
    )
    const byDate: Record<string, number> = {}
    for (const p of payments) {
      byDate[p.date] = (byDate[p.date] || 0) + p.amount
    }
    return Object.entries(byDate).map(([date, total]) => ({ date, total }))
  },
}
