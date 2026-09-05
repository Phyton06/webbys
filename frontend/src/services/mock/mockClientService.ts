import type { ClientService, ClientProfile } from '../interfaces'
import { load, save, delay } from './storage'

const USERS_KEY = 'webbys_users'
const CLIENT_PROFILES_KEY = 'webbys_client_profiles'
const APPOINTMENTS_KEY = 'webbys_appointments'

interface StoredUser {
  id: string
  name: string
  role: string
  email?: string
  phone?: string
}

function seedUsersAndProfiles() {
  const users = load<StoredUser>(USERS_KEY)
  if (users.length === 0) {
    save(USERS_KEY, [
      { id: 'u3', name: 'Juan Barbero', role: 'BARBER' },
      { id: 'u4', name: 'Pedro Barbero', role: 'BARBER' },
      { id: 'u5', name: 'Ana Cliente', role: 'CLIENT', email: 'ana@example.com', phone: '123456789' },
      { id: 'u6', name: 'Luis Cliente', role: 'CLIENT', email: 'luis@example.com', phone: '987654321' },
    ])
  }

  const profiles = load<Partial<ClientProfile>>(CLIENT_PROFILES_KEY)
  if (profiles.length === 0) {
    save(CLIENT_PROFILES_KEY, [
      {
        id: 'u5',
        totalVisits: 5,
        totalSpent: 12500,
        lastVisit: '2026-09-01',
        preferences: 'Corte degradado',
        notes: 'Cliente puntual',
      },
      {
        id: 'u6',
        totalVisits: 2,
        totalSpent: 5000,
        lastVisit: '2026-08-25',
        preferences: 'Corte clásico',
        notes: '',
      },
    ])
  }
}

export const mockClientService: ClientService = {
  async getAll(search?: string) {
    await delay()
    seedUsersAndProfiles()
    const clients = load<StoredUser>(USERS_KEY).filter(u => u.role === 'CLIENT')
    const profiles = load<Partial<ClientProfile>>(CLIENT_PROFILES_KEY)

    let results = clients.map(c => {
      const p = profiles.find(p => p.id === c.id) || {}
      return {
        id: c.id,
        name: c.name,
        email: c.email || `${c.name.toLowerCase().replace(/\s+/g, '')}@example.com`,
        phone: c.phone || '000000000',
        totalVisits: p.totalVisits ?? 0,
        totalSpent: p.totalSpent ?? 0,
        lastVisit: p.lastVisit,
        preferences: p.preferences || '',
        notes: p.notes || '',
      }
    })

    if (search) {
      const q = search.toLowerCase()
      results = results.filter(
        c =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.phone.includes(q)
      )
    }

    return results
  },

  async getById(id: string) {
    await delay()
    seedUsersAndProfiles()
    const clients = await this.getAll()
    const found = clients.find(c => c.id === id)
    if (!found) {
      throw new Error(`Client ${id} not found`)
    }
    return found
  },

  async update(id: string, data: Partial<ClientProfile>) {
    await delay()
    seedUsersAndProfiles()
    const profiles = load<Partial<ClientProfile>>(CLIENT_PROFILES_KEY)
    const idx = profiles.findIndex(p => p.id === id)

    if (idx === -1) {
      profiles.push({ id, ...data })
    } else {
      profiles[idx] = { ...profiles[idx], ...data }
    }
    save(CLIENT_PROFILES_KEY, profiles)
    return this.getById(id)
  },

  async getHistory(id: string) {
    await delay()
    const appointments = load<any>(APPOINTMENTS_KEY)
    return appointments.filter((a: any) => a.clientId === id)
  },

  async addNote(id: string, note: string) {
    await delay()
    const client = await this.getById(id)
    const newNotes = client.notes ? `${client.notes}\n${note}` : note
    return this.update(id, { notes: newNotes })
  },
}
