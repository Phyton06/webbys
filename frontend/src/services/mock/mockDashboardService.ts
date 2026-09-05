import type { DashboardService } from '../interfaces'
import { load, delay } from './storage'

const APPOINTMENTS_KEY = 'webbys_appointments'
const PAYMENTS_KEY = 'webbys_payments'
const USERS_KEY = 'webbys_users'
const SERVICES_KEY = 'webbys_services'

export const mockDashboardService: DashboardService = {
  async getData() {
    await delay()
    const today = new Date().toISOString().split('T')[0]
    const appts = load<any>(APPOINTMENTS_KEY)
    const payments = load<any>(PAYMENTS_KEY).filter((p: any) => p.status === 'COMPLETED')
    const users = load<any>(USERS_KEY)
    const services = load<any>(SERVICES_KEY)

    const userMap = Object.fromEntries(users.map((u: any) => [u.id, u.name]))
    const serviceMap = Object.fromEntries(services.map((s: any) => [s.id, s.name]))

    const todayAppts = appts.filter((a: any) => a.date === today)
    const pending = appts.filter((a: any) => a.status === 'PENDING' || a.status === 'CONFIRMED')

    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    const weekStr = weekStart.toISOString().split('T')[0]
    const weekPayments = payments.filter((p: any) => p.date >= weekStr)

    return {
      todayAppointments: todayAppts.length,
      pendingConfirmations: pending.length,
      weekRevenue: weekPayments.reduce((s: number, p: any) => s + p.amount, 0),
      recentPayments: payments.slice(-5).map((p: any) => ({
        ...p,
        clientName: userMap[p.clientId] || p.clientId,
        barberName: userMap[p.barberId] || p.barberId,
        serviceName: serviceMap[p.serviceId] || p.serviceId,
      })),
      upcomingAppointments: appts
        .filter((a: any) => a.date >= today && a.status !== 'CANCELLED')
        .slice(0, 5)
        .map((a: any) => ({
          id: a.id,
          clientName: userMap[a.clientId] || a.clientId,
          barberName: userMap[a.barberId] || a.barberId,
          service: serviceMap[a.serviceId] || a.serviceId,
          time: a.startTime,
        })),
    }
  },

  async getWeeklyRevenue() {
    await delay()
    const payments = load<any>(PAYMENTS_KEY).filter((p: any) => p.status === 'COMPLETED')
    const byDate: Record<string, number> = {}
    for (const p of payments) {
      byDate[p.date] = (byDate[p.date] || 0) + p.amount
    }
    return Object.entries(byDate)
      .map(([date, total]) => ({ date, total }))
      .sort((a, b) => a.date.localeCompare(b.date))
  },
}
