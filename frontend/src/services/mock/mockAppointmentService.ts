import type { AppointmentService, AppointmentDetail } from '../interfaces'
import { load, save, delay } from './storage'

const APPOINTMENTS_KEY = 'webbys_appointments'

function seed() {
  if (load<any>(APPOINTMENTS_KEY).length > 0) return
  const today = new Date().toISOString().split('T')[0]
  const appointments: AppointmentDetail[] = [
    {
      id: 'a1',
      clientId: 'u5',
      clientName: 'Ana Cliente',
      barberId: 'u3',
      barberName: 'Juan Barbero',
      serviceId: 's1',
      serviceName: 'Corte Degradado',
      date: today,
      startTime: '10:00',
      endTime: '10:45',
      status: 'CONFIRMED',
      createdAt: today,
    },
    {
      id: 'a2',
      clientId: 'u6',
      clientName: 'Luis Cliente',
      barberId: 'u3',
      barberName: 'Juan Barbero',
      serviceId: 's3',
      serviceName: 'Corte + Barba',
      date: today,
      startTime: '11:00',
      endTime: '12:00',
      status: 'CONFIRMED',
      createdAt: today,
    },
    {
      id: 'a3',
      clientId: 'u5',
      clientName: 'Ana Cliente',
      barberId: 'u4',
      barberName: 'Pedro Barbero',
      serviceId: 's2',
      serviceName: 'Corte Clásico',
      date: today,
      startTime: '15:00',
      endTime: '15:45',
      status: 'PENDING',
      createdAt: today,
    },
    {
      id: 'a4',
      clientId: 'u6',
      clientName: 'Luis Cliente',
      barberId: 'u4',
      barberName: 'Pedro Barbero',
      serviceId: 's1',
      serviceName: 'Corte Degradado',
      date: '2026-09-01',
      startTime: '16:00',
      endTime: '16:45',
      status: 'COMPLETED',
      createdAt: '2026-09-01',
    },
  ]
  save(APPOINTMENTS_KEY, appointments)
}

seed()

export const mockAppointmentService: AppointmentService = {
  async getAll(filter) {
    await delay()
    seed()
    let list = load<AppointmentDetail>(APPOINTMENTS_KEY)

    if (filter) {
      if (filter.barberId) {
        list = list.filter(a => a.barberId === filter.barberId)
      }
      if (filter.status) {
        list = list.filter(a => a.status === filter.status)
      }
      if (filter.dateRange) {
        list = list.filter(a => a.date >= filter.dateRange!.start && a.date <= filter.dateRange!.end)
      }
    }

    return list
  },

  async getById(id) {
    await delay()
    seed()
    const found = load<AppointmentDetail>(APPOINTMENTS_KEY).find(a => a.id === id)
    if (!found) {
      throw new Error(`Appointment ${id} not found`)
    }
    return found
  },

  async updateStatus(id, status) {
    await delay()
    seed()
    const list = load<AppointmentDetail>(APPOINTMENTS_KEY)
    const idx = list.findIndex(a => a.id === id)
    if (idx === -1) {
      throw new Error(`Appointment ${id} not found`)
    }
    list[idx].status = status
    save(APPOINTMENTS_KEY, list)
    return list[idx]
  },

  async cancel(id, reason) {
    await delay()
    seed()
    const list = load<AppointmentDetail>(APPOINTMENTS_KEY)
    const idx = list.findIndex(a => a.id === id)
    if (idx === -1) {
      throw new Error(`Appointment ${id} not found`)
    }
    list[idx].status = 'CANCELLED'
    if (reason) {
      list[idx].notes = list[idx].notes ? `${list[idx].notes} | Cancel reason: ${reason}` : `Cancel reason: ${reason}`
    }
    save(APPOINTMENTS_KEY, list)
    return list[idx]
  },

  async reassign(id, newBarberId) {
    await delay()
    seed()
    const list = load<AppointmentDetail>(APPOINTMENTS_KEY)
    const idx = list.findIndex(a => a.id === id)
    if (idx === -1) {
      throw new Error(`Appointment ${id} not found`)
    }
    list[idx].barberId = newBarberId
    // Update barber name as well
    if (newBarberId === 'u3') {
      list[idx].barberName = 'Juan Barbero'
    } else if (newBarberId === 'u4') {
      list[idx].barberName = 'Pedro Barbero'
    } else {
      list[idx].barberName = `Barbero ${newBarberId}`
    }
    save(APPOINTMENTS_KEY, list)
    return list[idx]
  },

  async getWaitlist() {
    await delay()
    seed()
    const list = load<AppointmentDetail>(APPOINTMENTS_KEY)
    return list.filter(a => a.status === 'PENDING')
  },
}
