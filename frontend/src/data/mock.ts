// Datos mock para el prototipo — todo en memoria + localStorage

export interface User {
  id: string
  name: string
  email: string
  phone: string
  role: 'ADMIN' | 'BARBER' | 'CLIENT' | 'ASSISTANT'
  password?: string
}

export interface BarberProfile {
  id: string
  userId: string
  specialty?: string
  bio?: string
  photoUrl?: string
  schedule?: Record<string, { start: string; end: string }[]>
}

export interface Service {
  id: string
  name: string
  description?: string
  price: number
  duration: number
  isActive: boolean
}

export interface Appointment {
  id: string
  clientId: string
  barberId: string
  serviceId?: string
  date: string // YYYY-MM-DD
  startTime: string // HH:mm
  endTime: string
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'
  notes?: string
}

const USERS_KEY = 'webbys_users'
const APPOINTMENTS_KEY = 'webbys_appointments'
const SERVICES_KEY = 'webbys_services'
const BARBER_PROFILES_KEY = 'webbys_barber_profiles'
const CURRENT_USER_KEY = 'webbys_current_user'

function genId() {
  return Math.random().toString(36).slice(2, 11)
}

function load<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]')
  } catch {
    return []
  }
}

function save<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data))
}

// Datos iniciales si está vacío
function seed() {
  if (load(USERS_KEY).length > 0) return

  const users: User[] = [
    { id: 'u1', name: 'Carlos Dueño', email: 'carlos@webbys.com', phone: '5551234567', role: 'ADMIN', password: '123456' },
    { id: 'u2', name: 'María Asistente', email: 'maria@webbys.com', phone: '5552345678', role: 'ASSISTANT', password: '123456' },
    { id: 'u3', name: 'Juan Barbero', email: 'juan@webbys.com', phone: '5553456789', role: 'BARBER', password: '123456' },
    { id: 'u4', name: 'Pedro Barbero', email: 'pedro@webbys.com', phone: '5554567890', role: 'BARBER', password: '123456' },
    { id: 'u5', name: 'Ana Cliente', email: 'ana@webbys.com', phone: '5555678901', role: 'CLIENT', password: '123456' },
    { id: 'u6', name: 'Luis Cliente', email: 'luis@webbys.com', phone: '5556789012', role: 'CLIENT', password: '123456' },
  ]
  save(USERS_KEY, users)

  const profiles: BarberProfile[] = [
    { id: 'bp1', userId: 'u3', specialty: 'Corte clásico', bio: '10 años de experiencia', schedule: { lunes: [{ start: '09:00', end: '18:00' }], martes: [{ start: '09:00', end: '18:00' }], miercoles: [{ start: '09:00', end: '18:00' }], jueves: [{ start: '09:00', end: '18:00' }], viernes: [{ start: '09:00', end: '20:00' }], sabado: [{ start: '10:00', end: '16:00' }] } },
    { id: 'bp2', userId: 'u4', specialty: 'Barba y diseño', bio: 'Especialista en barba', schedule: { lunes: [{ start: '10:00', end: '19:00' }], martes: [{ start: '10:00', end: '19:00' }], miercoles: [{ start: '10:00', end: '19:00' }], jueves: [{ start: '10:00', end: '19:00' }], viernes: [{ start: '10:00', end: '20:00' }], sabado: [{ start: '10:00', end: '15:00' }] } },
  ]
  save(BARBER_PROFILES_KEY, profiles)

  const services: Service[] = [
    { id: 's1', name: 'Corte de cabello', description: 'Corte clásico o moderno', price: 150, duration: 30, isActive: true },
    { id: 's2', name: 'Barba', description: 'Diseño y corte de barba', price: 100, duration: 20, isActive: true },
    { id: 's3', name: 'Corte + Barba', description: 'Paquete completo', price: 220, duration: 45, isActive: true },
    { id: 's4', name: 'Cejas', description: 'Diseño de cejas', price: 50, duration: 10, isActive: true },
  ]
  save(SERVICES_KEY, services)

  // Citas de ejemplo
  const today = new Date()
  const fmt = (d: Date) => d.toISOString().split('T')[0]
  const appointments: Appointment[] = [
    { id: 'a1', clientId: 'u5', barberId: 'u3', serviceId: 's1', date: fmt(today), startTime: '10:00', endTime: '10:30', status: 'CONFIRMED' },
    { id: 'a2', clientId: 'u6', barberId: 'u3', serviceId: 's3', date: fmt(today), startTime: '11:00', endTime: '11:45', status: 'PENDING' },
    { id: 'a3', clientId: 'u5', barberId: 'u4', serviceId: 's2', date: fmt(today), startTime: '14:00', endTime: '14:20', status: 'CONFIRMED' },
    { id: 'a4', clientId: 'u6', barberId: 'u4', serviceId: 's1', date: fmt(new Date(today.getTime() + 86400000)), startTime: '09:00', endTime: '09:30', status: 'PENDING' },
  ]
  save(APPOINTMENTS_KEY, appointments)
}

seed()

// ─── Simulador de API ────────────────────────────────────────

function delay(ms = 150) {
  return new Promise(r => setTimeout(r, ms))
}

function jwt(user: User) {
  return btoa(JSON.stringify({ sub: user.id, role: user.role, exp: Date.now() + 900000 }))
}

export const mockApi = {
  // Auth
  async post(path: string, body?: any) {
    await delay()

    if (path === '/auth/login') {
      const users = load<User>(USERS_KEY)
      const u = users.find(u => u.email === body.email && u.password === body.password)
      if (!u) throw { response: { status: 401, data: { message: 'Credenciales incorrectas' } } }
      const token = jwt(u)
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(u))
      return { data: { accessToken: token, refreshToken: token, user: u } }
    }

    if (path === '/auth/register') {
      const users = load<User>(USERS_KEY)
      if (users.find(u => u.email === body.email)) {
        throw { response: { status: 409, data: { message: 'El correo ya está registrado' } } }
      }
      const newUser: User = { id: genId(), ...body, role: body.role || 'CLIENT' }
      users.push(newUser)
      save(USERS_KEY, users)
      const token = jwt(newUser)
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser))
      return { data: { accessToken: token, refreshToken: token, user: newUser } }
    }

    if (path === '/auth/refresh') {
      const raw = localStorage.getItem(CURRENT_USER_KEY)
      if (!raw) throw { response: { status: 401 } }
      const u = JSON.parse(raw) as User
      const token = jwt(u)
      return { data: { accessToken: token, refreshToken: token } }
    }

    if (path.startsWith('/appointments')) {
      const appts = load<Appointment>(APPOINTMENTS_KEY)
      const newAppt: Appointment = { id: genId(), ...body, status: body.status || 'PENDING' }
      appts.push(newAppt)
      save(APPOINTMENTS_KEY, appts)
      return { data: newAppt }
    }

    if (path.startsWith('/notifications/send')) {
      return { data: { success: true } }
    }

    if (path.startsWith('/clients/register-url')) {
      return { data: { url: `https://webbys.app/registro?token=${genId()}` } }
    }

    return { data: {} }
  },

  async get(path: string) {
    await delay()

    if (path === '/auth/me') {
      const raw = localStorage.getItem(CURRENT_USER_KEY)
      if (!raw) throw { response: { status: 401 } }
      return { data: JSON.parse(raw) }
    }

    if (path === '/barbers') {
      const users = load<User>(USERS_KEY).filter(u => u.role === 'BARBER')
      const profiles = load<BarberProfile>(BARBER_PROFILES_KEY)
      const result = users.map(u => ({
        ...u,
        profile: profiles.find(p => p.userId === u.id)
      }))
      return { data: result }
    }

    if (path.startsWith('/barbers/')) {
      const id = path.split('/')[2]
      const users = load<User>(USERS_KEY)
      const profiles = load<BarberProfile>(BARBER_PROFILES_KEY)
      const u = users.find(u => u.id === id)
      if (!u) throw { response: { status: 404 } }
      return { data: { ...u, profile: profiles.find(p => p.userId === u.id) } }
    }

    if (path === '/services') {
      return { data: load<Service>(SERVICES_KEY).filter(s => s.isActive) }
    }

    if (path.startsWith('/appointments/availability/')) {
      const parts = path.split('/')
      const barberId = parts[3]
      const dateStr = new URLSearchParams(path.split('?')[1] || '').get('date')
      if (!dateStr) return { data: [] }

      const appts = load<Appointment>(APPOINTMENTS_KEY)
      const taken = appts
        .filter(a => a.barberId === barberId && a.date === dateStr && a.status !== 'CANCELLED')
        .map(a => ({ start: a.startTime, end: a.endTime }))

      const slots: string[] = []
      for (let h = 9; h < 20; h++) {
        for (let m = 0; m < 60; m += 30) {
          const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
          const endH = m === 30 ? h + 1 : h
          const endM = m === 30 ? 0 : 30
          const end = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`
          const conflict = taken.some(t => t.start < end && t.end > time)
          if (!conflict) slots.push(time)
        }
      }
      return { data: slots }
    }

    if (path === '/appointments') {
      const appts = load<Appointment>(APPOINTMENTS_KEY)
      return { data: appts }
    }

    if (path.startsWith('/appointments/')) {
      const id = path.split('/')[2]
      const appts = load<Appointment>(APPOINTMENTS_KEY)
      const a = appts.find(a => a.id === id)
      if (!a) throw { response: { status: 404 } }
      return { data: a }
    }

    if (path === '/clients') {
      const users = load<User>(USERS_KEY).filter(u => u.role === 'CLIENT')
      return { data: users }
    }

    if (path.startsWith('/clients/')) {
      const id = path.split('/')[2]
      const u = load<User>(USERS_KEY).find(u => u.id === id)
      if (!u) throw { response: { status: 404 } }
      return { data: u }
    }

    if (path === '/notifications') {
      return { data: [] }
    }

    return { data: [] }
  },

  async put(path: string, body?: any) {
    await delay()

    if (path.startsWith('/appointments/') && path.endsWith('/status')) {
      const id = path.split('/')[2]
      const appts = load<Appointment>(APPOINTMENTS_KEY)
      const idx = appts.findIndex(a => a.id === id)
      if (idx === -1) throw { response: { status: 404 } }
      appts[idx].status = body.status
      save(APPOINTMENTS_KEY, appts)
      return { data: appts[idx] }
    }

    if (path.startsWith('/barbers/') && path.endsWith('/schedule')) {
      const id = path.split('/')[2]
      const profiles = load<BarberProfile>(BARBER_PROFILES_KEY)
      const idx = profiles.findIndex(p => p.userId === id)
      if (idx !== -1) {
        profiles[idx].schedule = body.schedule
        save(BARBER_PROFILES_KEY, profiles)
      }
      return { data: { success: true } }
    }

    if (path.startsWith('/barbers/')) {
      const id = path.split('/')[2]
      const users = load<User>(USERS_KEY)
      const idx = users.findIndex(u => u.id === id)
      if (idx !== -1) {
        users[idx] = { ...users[idx], ...body }
        save(USERS_KEY, users)
      }
      return { data: users[idx] }
    }

    if (path.startsWith('/notifications/')) {
      return { data: { success: true } }
    }

    return { data: {} }
  },

  async delete(path: string) {
    await delay()

    if (path.startsWith('/barbers/')) {
      const id = path.split('/')[2]
      const users = load<User>(USERS_KEY).filter(u => u.id !== id)
      save(USERS_KEY, users)
    }

    if (path.startsWith('/services/')) {
      const id = path.split('/')[2]
      const services = load<Service>(SERVICES_KEY)
      const s = services.find(s => s.id === id)
      if (s) s.isActive = false
      save(SERVICES_KEY, services)
    }

    return { data: { success: true } }
  }
}
