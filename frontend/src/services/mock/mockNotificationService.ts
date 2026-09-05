import type { Notification, NotificationService, NotificationTemplate, NotificationFilter } from '../interfaces'
import { load, save, genId, delay } from './storage'

const NOTIF_KEY = 'webbys_notifications'
const TPL_KEY = 'webbys_notification_templates'

function matchesFilter(n: Notification, filter?: NotificationFilter): boolean {
  if (!filter) return true
  if (filter.type && n.type !== filter.type) return false
  if (filter.channel && n.channel !== filter.channel) return false
  if (filter.status && n.status !== filter.status) return false
  if (filter.dateRange) {
    if (n.createdAt < filter.dateRange.start || n.createdAt > filter.dateRange.end) return false
  }
  return true
}

function seed() {
  if (load<NotificationTemplate>(TPL_KEY).length > 0) return
  const templates: NotificationTemplate[] = [
    { id: 't1', name: 'Recordatorio de cita', type: 'APPOINTMENT_REMINDER', channel: 'SMS', body: 'Hola {{clientName}}, te recordamos tu cita de {{service}} el {{date}} a las {{time}}.', variables: ['clientName', 'service', 'date', 'time'] },
    { id: 't2', name: 'Promoción general', type: 'PROMOTION', channel: 'WHATSAPP', subject: '¡Oferta especial!', body: 'Hola {{clientName}}, tenemos una promoción de {{discount}}% en todos nuestros servicios.', variables: ['clientName', 'discount'] },
    { id: 't3', name: 'Cambio de estado', type: 'STATUS_CHANGE', channel: 'EMAIL', subject: 'Actualización de tu cita', body: 'Tu cita del {{date}} ha sido {{status}}.', variables: ['date', 'status'] },
  ]
  save(TPL_KEY, templates)
}

export const mockNotificationService: NotificationService = {
  async getAll(filter) {
    await delay()
    seed() // re-seed if empty (after localStorage.clear in tests)
    return load<Notification>(NOTIF_KEY).filter(n => matchesFilter(n, filter))
  },

  async getById(id) {
    await delay()
    const n = load<Notification>(NOTIF_KEY).find(n => n.id === id)
    if (!n) throw new Error(`Notification ${id} not found`)
    return n
  },

  async send(data) {
    await delay()
    const notifications = load<Notification>(NOTIF_KEY)
    const now = new Date().toISOString()
    const n: Notification = { ...data, id: genId(), status: 'SENT', sentAt: now, createdAt: now }
    notifications.push(n)
    save(NOTIF_KEY, notifications)
    return n
  },

  async sendBulk(items) {
    await delay()
    const notifications = load<Notification>(NOTIF_KEY)
    const now = new Date().toISOString()
    const created = items.map(item => ({
      ...item,
      id: genId(),
      status: 'SENT' as const,
      sentAt: now,
      createdAt: now,
    }))
    notifications.push(...created)
    save(NOTIF_KEY, notifications)
    return created
  },

  async getTemplates() {
    await delay()
    seed()
    return load<NotificationTemplate>(TPL_KEY)
  },

  async createTemplate(data) {
    await delay()
    const templates = load<NotificationTemplate>(TPL_KEY)
    const t: NotificationTemplate = { ...data, id: genId() }
    templates.push(t)
    save(TPL_KEY, templates)
    return t
  },

  async updateTemplate(id, data) {
    await delay()
    const templates = load<NotificationTemplate>(TPL_KEY)
    const idx = templates.findIndex(t => t.id === id)
    if (idx === -1) throw new Error(`Template ${id} not found`)
    templates[idx] = { ...templates[idx], ...data }
    save(TPL_KEY, templates)
    return templates[idx]
  },

  async deleteTemplate(id) {
    await delay()
    const templates = load<NotificationTemplate>(TPL_KEY).filter(t => t.id !== id)
    save(TPL_KEY, templates)
  },

  async renderTemplate(templateId, variables) {
    await delay()
    seed()
    const templates = load<NotificationTemplate>(TPL_KEY)
    const t = templates.find(t => t.id === templateId)
    if (!t) throw new Error(`Template ${templateId} not found`)
    let body = t.body
    for (const [key, value] of Object.entries(variables)) {
      body = body.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value)
    }
    const subject = t.subject
      ? Object.entries(variables).reduce((s, [k, v]) => s.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), v), t.subject)
      : undefined
    return { subject, body }
  },
}
