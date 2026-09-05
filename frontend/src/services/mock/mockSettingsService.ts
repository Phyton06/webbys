import type { SettingsService, AppSettings } from '../interfaces'
import { loadOne, saveOne, delay } from './storage'

const KEY = 'webbys_settings'

const DEFAULT_SETTINGS: AppSettings = {
  business: {
    name: "Webby's Barbershop",
    address: 'Av. Principal 123',
    phone: '5551234567',
    email: 'contacto@webbys.com',
    openingHours: {
      monday: { open: '09:00', close: '18:00' },
      tuesday: { open: '09:00', close: '18:00' },
      wednesday: { open: '09:00', close: '18:00' },
      thursday: { open: '09:00', close: '18:00' },
      friday: { open: '09:00', close: '20:00' },
      saturday: { open: '10:00', close: '16:00' },
      sunday: null,
    },
    timezone: 'America/Mexico_City',
    currency: 'MXN',
  },
  roles: [
    { role: 'ADMIN', permissions: ['*'] },
    { role: 'BARBER', permissions: ['appointments.read', 'appointments.update', 'schedule.read', 'clients.read'] },
    { role: 'ASSISTANT', permissions: ['appointments.*', 'clients.*', 'notifications.*'] },
    { role: 'CLIENT', permissions: ['appointments.read', 'appointments.create', 'profile.*'] },
  ],
  branding: {
    primaryColor: '#00BCD4',
    secondaryColor: '#1a1a2e',
    welcomeMessage: 'Bienvenido a Webby\'s Barbershop',
  },
}

function getSettings(): AppSettings {
  return loadOne<AppSettings>(KEY) || { ...DEFAULT_SETTINGS }
}

export const mockSettingsService: SettingsService = {
  async get() {
    await delay()
    return getSettings()
  },

  async updateBusiness(data) {
    await delay()
    const settings = getSettings()
    settings.business = { ...settings.business, ...data }
    saveOne(KEY, settings)
    return settings.business
  },

  async updateBranding(data) {
    await delay()
    const settings = getSettings()
    settings.branding = { ...settings.branding, ...data }
    saveOne(KEY, settings)
    return settings.branding
  },

  async getRoles() {
    await delay()
    return getSettings().roles
  },
}
