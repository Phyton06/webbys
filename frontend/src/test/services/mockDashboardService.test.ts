import { describe, it, expect, beforeEach } from 'vitest'
import { mockDashboardService } from '../../services/mock/mockDashboardService'

beforeEach(() => {
  localStorage.clear()
})

describe('mockDashboardService', () => {
  describe('getData', () => {
    it('returns dashboard data with stats', async () => {
      const data = await mockDashboardService.getData()
      expect(typeof data.todayAppointments).toBe('number')
      expect(typeof data.pendingConfirmations).toBe('number')
      expect(typeof data.weekRevenue).toBe('number')
      expect(Array.isArray(data.recentPayments)).toBe(true)
      expect(Array.isArray(data.upcomingAppointments)).toBe(true)
    })
  })

  describe('getWeeklyRevenue', () => {
    it('returns daily revenue array', async () => {
      const data = await mockDashboardService.getWeeklyRevenue()
      expect(Array.isArray(data)).toBe(true)
      if (data.length > 0) {
        expect(data[0].date).toBeTruthy()
        expect(typeof data[0].total).toBe('number')
      }
    })
  })
})
