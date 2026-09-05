import type { ScheduleService, WeeklySchedule, ScheduleEntry, ScheduleException, DateRange } from '../interfaces'
import { load, save, genId, delay } from './storage'

const KEY = 'webbys_schedules'
const EX_KEY = 'webbys_schedule_exceptions'

const DEFAULT_ENTRIES: ScheduleEntry[] = [
  { day: 'monday', slots: [{ start: '09:00', end: '18:00' }] },
  { day: 'tuesday', slots: [{ start: '09:00', end: '18:00' }] },
  { day: 'wednesday', slots: [{ start: '09:00', end: '18:00' }] },
  { day: 'thursday', slots: [{ start: '09:00', end: '18:00' }] },
  { day: 'friday', slots: [{ start: '09:00', end: '20:00' }] },
  { day: 'saturday', slots: [{ start: '10:00', end: '16:00' }] },
  { day: 'sunday', slots: [] },
]

function inRange(date: string, range?: DateRange) {
  if (!range) return true
  return date >= range.start && date <= range.end
}

export const mockScheduleService: ScheduleService = {
  async getWeeklySchedule(barberId) {
    await delay()
    const schedules = load<WeeklySchedule>(KEY)
    const existing = schedules.find(s => s.barberId === barberId)
    if (existing) return existing
    // Create default
    const schedule: WeeklySchedule = { barberId, entries: [...DEFAULT_ENTRIES], exceptions: [] }
    schedules.push(schedule)
    save(KEY, schedules)
    return schedule
  },

  async updateWeeklySchedule(barberId, entries) {
    await delay()
    const schedules = load<WeeklySchedule>(KEY)
    const idx = schedules.findIndex(s => s.barberId === barberId)
    const exceptions = idx !== -1 ? schedules[idx].exceptions : []
    const updated: WeeklySchedule = { barberId, entries, exceptions }
    if (idx !== -1) schedules[idx] = updated
    else schedules.push(updated)
    save(KEY, schedules)
    return updated
  },

  async addException(data) {
    await delay()
    const exceptions = load<ScheduleException>(EX_KEY)
    const ex: ScheduleException = { ...data, id: genId() }
    exceptions.push(ex)
    save(EX_KEY, exceptions)
    return ex
  },

  async removeException(id) {
    await delay()
    const exceptions = load<ScheduleException>(EX_KEY).filter(e => e.id !== id)
    save(EX_KEY, exceptions)
  },

  async getExceptions(barberId, dateRange) {
    await delay()
    return load<ScheduleException>(EX_KEY).filter(
      e => e.barberId === barberId && inRange(e.date, dateRange)
    )
  },

  async checkAvailability(barberId, date, start, end) {
    await delay()
    const exceptions = load<ScheduleException>(EX_KEY).filter(
      e => e.barberId === barberId && e.date === date
    )
    // DAY_OFF = completely unavailable
    if (exceptions.some(e => e.type === 'DAY_OFF')) return false
    // Check custom slot exceptions
    for (const ex of exceptions) {
      if (ex.type === 'CUSTOM' && ex.slots) {
        const hasOverlap = ex.slots.some(s => s.start < end && s.end > start)
        if (!hasOverlap) return false
      }
    }
    return true
  },
}
