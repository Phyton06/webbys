import type { ReportService, DateRange } from '../interfaces'
import { load, delay } from './storage'

const PAYMENTS_KEY = 'webbys_payments'
const APPOINTMENTS_KEY = 'webbys_appointments'
const USERS_KEY = 'webbys_users'

interface StoredPayment {
  id: string; appointmentId: string; clientId: string; barberId: string; serviceId: string
  amount: number; method: string; status: string; date: string
}

interface StoredAppointment {
  id: string; clientId: string; barberId: string; serviceId: string
  date: string; startTime: string; endTime: string; status: string
}

interface StoredUser { id: string; name: string; role: string }

function inRange(date: string, range?: DateRange) {
  if (!range) return true
  return date >= range.start && date <= range.end
}

export const mockReportService: ReportService = {
  async getRevenueReport(period, dateRange) {
    await delay()
    const payments = load<StoredPayment>(PAYMENTS_KEY).filter(
      p => p.status === 'COMPLETED' && inRange(p.date, dateRange)
    )
    const users = load<StoredUser>(USERS_KEY)
    const userMap = Object.fromEntries(users.map(u => [u.id, u.name]))

    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0)
    const byBarberMap: Record<string, { revenue: number; appointments: number }> = {}
    const byServiceMap: Record<string, { revenue: number; count: number }> = {}

    for (const p of payments) {
      if (!byBarberMap[p.barberId]) byBarberMap[p.barberId] = { revenue: 0, appointments: 0 }
      byBarberMap[p.barberId].revenue += p.amount
      byBarberMap[p.barberId].appointments++

      if (!byServiceMap[p.serviceId]) byServiceMap[p.serviceId] = { revenue: 0, count: 0 }
      byServiceMap[p.serviceId].revenue += p.amount
      byServiceMap[p.serviceId].count++
    }

    return {
      period,
      totalRevenue,
      appointmentCount: payments.length,
      averageTicket: payments.length > 0 ? totalRevenue / payments.length : 0,
      byBarber: Object.entries(byBarberMap).map(([barberId, data]) => ({
        barberId, barberName: userMap[barberId] || barberId, ...data,
      })),
      byService: Object.entries(byServiceMap).map(([serviceId, data]) => ({
        serviceId, serviceName: serviceId, ...data,
      })),
    }
  },

  async getAppointmentReport(period, dateRange) {
    await delay()
    const appts = load<StoredAppointment>(APPOINTMENTS_KEY).filter(a => inRange(a.date, dateRange))
    const byStatus: Record<string, number> = {}
    const byDayMap: Record<string, number> = {}

    for (const a of appts) {
      byStatus[a.status] = (byStatus[a.status] || 0) + 1
      byDayMap[a.date] = (byDayMap[a.date] || 0) + 1
    }

    return {
      period,
      total: appts.length,
      completed: byStatus['COMPLETED'] || 0,
      cancelled: byStatus['CANCELLED'] || 0,
      noShow: byStatus['NO_SHOW'] || 0,
      byStatus,
      byDay: Object.entries(byDayMap).map(([date, count]) => ({ date, count })),
    }
  },

  async getClientReport(period, dateRange) {
    await delay()
    const users = load<StoredUser>(USERS_KEY).filter(u => u.role === 'CLIENT')
    const appts = load<StoredAppointment>(APPOINTMENTS_KEY).filter(a => inRange(a.date, dateRange))
    const payments = load<StoredPayment>(PAYMENTS_KEY).filter(p => p.status === 'COMPLETED' && inRange(p.date, dateRange))

    const clientVisits: Record<string, number> = {}
    const clientSpent: Record<string, number> = {}
    for (const a of appts) {
      clientVisits[a.clientId] = (clientVisits[a.clientId] || 0) + 1
    }
    for (const p of payments) {
      clientSpent[p.clientId] = (clientSpent[p.clientId] || 0) + p.amount
    }

    const userMap = Object.fromEntries(users.map(u => [u.id, u.name]))
    const topClients = Object.entries(clientVisits)
      .map(([clientId, visits]) => ({
        clientId, name: userMap[clientId] || clientId, visits, spent: clientSpent[clientId] || 0,
      }))
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 10)

    return {
      period,
      totalClients: users.length,
      newClients: 0,
      returningClients: topClients.filter(c => c.visits > 1).length,
      retentionRate: users.length > 0 ? topClients.filter(c => c.visits > 1).length / users.length : 0,
      topClients,
    }
  },

  async getBarberReport(period, dateRange) {
    await delay()
    const users = load<StoredUser>(USERS_KEY).filter(u => u.role === 'BARBER')
    const appts = load<StoredAppointment>(APPOINTMENTS_KEY).filter(a => inRange(a.date, dateRange))
    const payments = load<StoredPayment>(PAYMENTS_KEY).filter(p => p.status === 'COMPLETED' && inRange(p.date, dateRange))

    return {
      period,
      barbers: users.map(u => {
        const barberAppts = appts.filter(a => a.barberId === u.id)
        const barberPayments = payments.filter(p => p.barberId === u.id)
        return {
          barberId: u.id,
          name: u.name,
          appointments: barberAppts.length,
          revenue: barberPayments.reduce((s, p) => s + p.amount, 0),
          averageRating: 4.5,
          noShowRate: barberAppts.length > 0
            ? (barberAppts.filter(a => a.status === 'NO_SHOW').length / barberAppts.length) * 100
            : 0,
        }
      }),
    }
  },

  async exportCSV(type, dateRange) {
    await delay()
    if (type === 'revenue') {
      const report = await this.getRevenueReport('export', dateRange)
      const header = 'date,totalRevenue,appointments,averageTicket'
      const rows = report.byBarber.map(b => `${b.barberName},${b.revenue},${b.appointments},${(b.revenue / (b.appointments || 1)).toFixed(2)}`)
      return [header, ...rows].join('\n')
    }
    return 'type,data\nno,data'
  },
}
