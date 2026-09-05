import type { BarberService, DateRange } from '../interfaces'
import { load, save, delay } from './storage'

const USERS_KEY = 'webbys_users'
const APPOINTMENTS_KEY = 'webbys_appointments'
const PAYMENTS_KEY = 'webbys_payments'

interface StoredUser { id: string; name: string; role: string }

function seedUsers() {
  const users = load<StoredUser>(USERS_KEY)
  if (users.length > 0) return
  save(USERS_KEY, [
    { id: 'u3', name: 'Juan Barbero', role: 'BARBER' },
    { id: 'u4', name: 'Pedro Barbero', role: 'BARBER' },
    { id: 'u5', name: 'Ana Cliente', role: 'CLIENT' },
    { id: 'u6', name: 'Luis Cliente', role: 'CLIENT' },
  ])
}

function inRange(date: string, range?: DateRange) {
  if (!range) return true
  return date >= range.start && date <= range.end
}

export const mockBarberService: BarberService = {
  async getAll() {
    await delay()
    seedUsers()
    const users = load<StoredUser>(USERS_KEY).filter(u => u.role === 'BARBER')
    const appointments = load<any>(APPOINTMENTS_KEY)
    const payments = load<any>(PAYMENTS_KEY).filter((p: any) => p.status === 'COMPLETED')

    return users.map(u => {
      const barberAppts = appointments.filter((a: any) => a.barberId === u.id)
      const barberPayments = payments.filter((p: any) => p.barberId === u.id)
      return {
        barberId: u.id,
        name: u.name,
        totalAppointments: barberAppts.length,
        completedAppointments: barberAppts.filter((a: any) => a.status === 'COMPLETED').length,
        revenue: barberPayments.reduce((s: number, p: any) => s + p.amount, 0),
        averageRating: 4.5,
        noShowRate: barberAppts.length > 0
          ? (barberAppts.filter((a: any) => a.status === 'NO_SHOW').length / barberAppts.length) * 100
          : 0,
        active: true,
      }
    })
  },

  async getById(id) {
    await delay()
    const barbers = await this.getAll()
    const b = barbers.find(b => b.barberId === id)
    if (!b) throw new Error(`Barber ${id} not found`)
    return b
  },

  async update(id, data) {
    await delay()
    const barbers = await this.getAll()
    const idx = barbers.findIndex(b => b.barberId === id)
    if (idx === -1) throw new Error(`Barber ${id} not found`)
    barbers[idx] = { ...barbers[idx], ...data }
    return barbers[idx]
  },

  async deactivate(id) {
    await delay()
    return this.update(id, { active: false })
  },

  async reactivate(id) {
    await delay()
    return this.update(id, { active: true })
  },

  async getPerformance(id, dateRange) {
    await delay()
    const appointments = load<any>(APPOINTMENTS_KEY).filter(
      (a: any) => a.barberId === id && inRange(a.date, dateRange)
    )
    const payments = load<any>(PAYMENTS_KEY).filter(
      (p: any) => p.barberId === id && p.status === 'COMPLETED' && inRange(p.date, dateRange)
    )
    const users = load<StoredUser>(USERS_KEY)
    const user = users.find(u => u.id === id)

    return {
      barberId: id,
      name: user?.name || id,
      totalAppointments: appointments.length,
      completedAppointments: appointments.filter((a: any) => a.status === 'COMPLETED').length,
      revenue: payments.reduce((s: number, p: any) => s + p.amount, 0),
      averageRating: 4.5,
      noShowRate: appointments.length > 0
        ? (appointments.filter((a: any) => a.status === 'NO_SHOW').length / appointments.length) * 100
        : 0,
      active: true,
    }
  },
}
