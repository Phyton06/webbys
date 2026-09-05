import type { AnalyticsService, RetentionData, PeakHour, DateRange } from '../interfaces'
import { load, delay } from './storage'

const APPOINTMENTS_KEY = 'webbys_appointments'
const PAYMENTS_KEY = 'webbys_payments'

function inRange(date: string, range?: DateRange) {
  if (!range) return true
  return date >= range.start && date <= range.end
}

export const mockAnalyticsService: AnalyticsService = {
  async getSummary(dateRange) {
    await delay()
    const appts = load<any>(APPOINTMENTS_KEY).filter((a: any) => inRange(a.date, dateRange))
    const payments = load<any>(PAYMENTS_KEY).filter((p: any) => p.status === 'COMPLETED' && inRange(p.date, dateRange))

    const totalRevenue = payments.reduce((s: number, p: any) => s + p.amount, 0)
    const completed = appts.filter((a: any) => a.status === 'COMPLETED').length
    const noShows = appts.filter((a: any) => a.status === 'NO_SHOW').length
    const noShowRate = appts.length > 0 ? (noShows / appts.length) * 100 : 0

    return {
      kpis: [
        { label: 'Ingresos totales', value: totalRevenue, change: 12.5, trend: 'UP' },
        { label: 'Citas completadas', value: completed, change: 8.2, trend: 'UP' },
        { label: 'Tasa de asistencia', value: appts.length > 0 ? ((appts.length - noShows) / appts.length) * 100 : 100, change: -1.3, trend: 'DOWN' },
        { label: 'Ticket promedio', value: payments.length > 0 ? totalRevenue / payments.length : 0, change: 0, trend: 'STABLE' },
      ],
      retention: await this.getRetention(6),
      peakHours: await this.getPeakHours(dateRange),
      topServices: [
        { serviceId: 's1', name: 'Corte de cabello', count: 45, revenue: 6750 },
        { serviceId: 's3', name: 'Corte + Barba', count: 30, revenue: 6600 },
        { serviceId: 's2', name: 'Barba', count: 20, revenue: 2000 },
      ],
      customerLifetimeValue: await this.getCustomerLTV(),
      noShowRate,
    }
  },

  async getRetention(months = 6) {
    await delay()
    const data: RetentionData[] = []
    const now = new Date()
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      data.push({
        month: d.toISOString().slice(0, 7),
        retained: 70 + Math.floor(Math.random() * 20),
        churned: 5 + Math.floor(Math.random() * 10),
      })
    }
    return data
  },

  async getPeakHours(_dateRange?: DateRange) {
    await delay()
    const hours: PeakHour[] = []
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    for (const day of days) {
      for (let h = 9; h <= 19; h++) {
        hours.push({ hour: h, day, count: Math.floor(Math.random() * 15) + 1 })
      }
    }
    return hours
  },

  async getCustomerLTV() {
    await delay()
    return [
      { clientId: 'u5', name: 'Ana Cliente', ltv: 2400, visits: 16 },
      { clientId: 'u6', name: 'Luis Cliente', ltv: 1800, visits: 12 },
    ]
  },

  async getNoShowRate(dateRange) {
    await delay()
    const appts = load<any>(APPOINTMENTS_KEY).filter((a: any) => inRange(a.date, dateRange))
    if (appts.length === 0) return 0
    const noShows = appts.filter((a: any) => a.status === 'NO_SHOW').length
    return (noShows / appts.length) * 100
  },
}
