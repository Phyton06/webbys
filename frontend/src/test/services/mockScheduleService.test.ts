import { describe, it, expect, beforeEach } from 'vitest'
import { mockScheduleService } from '../../services/mock/mockScheduleService'

beforeEach(() => {
  localStorage.clear()
})

describe('mockScheduleService', () => {
  describe('getWeeklySchedule', () => {
    it('returns schedule for a barber', async () => {
      const schedule = await mockScheduleService.getWeeklySchedule('u3')
      expect(schedule.barberId).toBe('u3')
      expect(schedule.entries.length).toBeGreaterThan(0)
    })

    it('returns default schedule for unknown barber', async () => {
      const schedule = await mockScheduleService.getWeeklySchedule('unknown')
      expect(schedule.entries.length).toBeGreaterThan(0)
    })
  })

  describe('updateWeeklySchedule', () => {
    it('updates schedule entries', async () => {
      const updated = await mockScheduleService.updateWeeklySchedule('u3', [
        { day: 'monday', slots: [{ start: '08:00', end: '17:00' }] },
        { day: 'tuesday', slots: [{ start: '08:00', end: '17:00' }] },
      ])
      expect(updated.entries).toHaveLength(2)
      expect(updated.entries[0].day).toBe('monday')
    })

    it('persists the update', async () => {
      await mockScheduleService.updateWeeklySchedule('u3', [
        { day: 'friday', slots: [{ start: '10:00', end: '20:00' }] },
      ])
      const schedule = await mockScheduleService.getWeeklySchedule('u3')
      const fri = schedule.entries.find(e => e.day === 'friday')
      expect(fri!.slots[0].start).toBe('10:00')
    })
  })

  describe('exceptions', () => {
    it('adds an exception', async () => {
      const ex = await mockScheduleService.addException({
        barberId: 'u3',
        date: '2026-09-15',
        type: 'DAY_OFF',
        reason: 'Vacaciones',
      })
      expect(ex.id).toBeTruthy()
      expect(ex.type).toBe('DAY_OFF')
    })

    it('gets exceptions for a barber', async () => {
      await mockScheduleService.addException({
        barberId: 'u3', date: '2026-09-15', type: 'DAY_OFF',
      })
      const exceptions = await mockScheduleService.getExceptions('u3')
      expect(exceptions.length).toBeGreaterThan(0)
    })

    it('removes an exception', async () => {
      const ex = await mockScheduleService.addException({
        barberId: 'u3', date: '2026-09-20', type: 'HALF_DAY',
      })
      await mockScheduleService.removeException(ex.id)
      const exceptions = await mockScheduleService.getExceptions('u3')
      expect(exceptions.find(e => e.id === ex.id)).toBeUndefined()
    })
  })

  describe('checkAvailability', () => {
    it('returns true when slot is available', async () => {
      const available = await mockScheduleService.checkAvailability('u3', '2026-09-08', '10:00', '11:00')
      expect(available).toBe(true)
    })

    it('returns false when slot conflicts with exception', async () => {
      await mockScheduleService.addException({
        barberId: 'u3', date: '2026-09-10', type: 'DAY_OFF',
      })
      const available = await mockScheduleService.checkAvailability('u3', '2026-09-10', '10:00', '11:00')
      expect(available).toBe(false)
    })
  })
})
