import { describe, it, expect, beforeEach } from 'vitest'
import { mockBarberService } from '../../services/mock/mockBarberService'

beforeEach(() => {
  localStorage.clear()
})

describe('mockBarberService', () => {
  describe('getAll', () => {
    it('returns barber performance list', async () => {
      const barbers = await mockBarberService.getAll()
      expect(barbers.length).toBeGreaterThan(0)
      expect(barbers[0].name).toBeTruthy()
      expect(typeof barbers[0].active).toBe('boolean')
    })
  })

  describe('getById', () => {
    it('returns barber by id', async () => {
      const barbers = await mockBarberService.getAll()
      const result = await mockBarberService.getById(barbers[0].barberId)
      expect(result.barberId).toBe(barbers[0].barberId)
    })

    it('throws for nonexistent', async () => {
      await expect(mockBarberService.getById('nope')).rejects.toThrow()
    })
  })

  describe('deactivate/reactivate', () => {
    it('deactivates a barber', async () => {
      const barbers = await mockBarberService.getAll()
      const deactivated = await mockBarberService.deactivate(barbers[0].barberId)
      expect(deactivated.active).toBe(false)
    })

    it('reactivates a barber', async () => {
      const barbers = await mockBarberService.getAll()
      await mockBarberService.deactivate(barbers[0].barberId)
      const reactivated = await mockBarberService.reactivate(barbers[0].barberId)
      expect(reactivated.active).toBe(true)
    })
  })

  describe('getPerformance', () => {
    it('returns performance metrics', async () => {
      const barbers = await mockBarberService.getAll()
      const perf = await mockBarberService.getPerformance(barbers[0].barberId)
      expect(typeof perf.totalAppointments).toBe('number')
      expect(typeof perf.revenue).toBe('number')
    })
  })
})
