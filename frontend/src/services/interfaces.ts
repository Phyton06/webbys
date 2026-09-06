export interface ScheduledNotificationRule {
  id: string
  name: string
  type: 'APPOINTMENT_REMINDER' | 'PROMOTION' | 'CUSTOM'
  offsetHours: number // -24 = 24h before, -1 = 1h before
  frequencyPerDay: number // e.g. 1
  advanceDays: number // e.g. 1
  active: boolean
  title: string
  body: string
}

export interface PushTestPayload {
  title: string
  message: string
}

export interface BarberProfile {
  id: string
  userId: string
  bio?: string
  photoUrl?: string
  schedule?: Record<string, { start: string; end: string }[]>
}
