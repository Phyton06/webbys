import { describe, it, expect, beforeEach } from 'vitest'
import { mockAppointmentService } from '../../services/mock/mockAppointmentService'

beforeEach(() => {
  localStorage.clear()
})

describe('mockAppointmentService', () => {
  describe('getAll', () => {
    it('returns appointment details', async () => {
      const appointments = await mockAppointmentService.getAll()
      expect(appointments.length).toBeGreaterThan(0)
      expect(appointments[0].clientName).toBeTruthy()
    })

    it('filters by barberId', async () => {
      const appointments = await mockAppointmentService.getAll()
      const barberId = appointments[0].barberId
      const filtered = await mockAppointmentService.getAll({ barberId })
      expect(filtered.every(a => a.barberId === barberId)).toBe(true)
    })

    it('filters by status', async () => {
      const appointments = await mockAppointmentService.getAll()
      const status = appointments[0].status
      const filtered = await mockAppointmentService.getAll({ status })
      expect(filtered.every(a => a.status === status)).toBe(true)
    })
  })

  describe('getById', () => {
    it('returns appointment by id', async () => {
      const appointments = await mockAppointmentService.getAll()
      const result = await mockAppointmentService.getById(appointments[0].id)
      expect(result.id).toBe(appointments[0].id)
    })

    it('throws for nonexistent', async () => {
      await expect(mockAppointmentService.getById('nope')).rejects.toThrow()
    })
  })

  describe('updateStatus', () => {
    it('updates status of appointment', async () => {
      const appointments = await mockAppointmentService.getAll()
      const result = await mockAppointmentService.updateStatus(appointments[0].id, 'COMPLETED')
      expect(result.status).toBe('COMPLETED')
    })
  })

  describe('cancel', () => {
    it('cancels appointment with reason', async () => {
      const appointments = await mockAppointmentService.getAll()
      const result = await mockAppointmentService.cancel(appointments[0].id, 'No show')
      expect(result.status).toBe('CANCELLED')
      expect(result.notes).toContain('No show')
    })
  })

  describe('reassign', () => {
    it('reassigns appointment to new barber', async () => {
      const appointments = await mockAppointmentService.getAll()
      const result = await mockAppointmentService.reassign(appointments[0].id, 'u4')
      expect(result.barberId).toBe('u4')
    })
  })

  describe('getWaitlist', () => {
    it('returns waitlist appointments', async () => {
      const waitlist = await mockAppointmentService.getWaitlist()
      expect(Array.isArray(waitlist)).toBe(true)
    })
  })
})
