import { describe, it, expect, beforeEach } from 'vitest'
import { mockAnalyticsService } from '../../services/mock/mockAnalyticsService'

beforeEach(() => {
  localStorage.clear()
})

describe('mockAnalyticsService', () => {
  describe('getSummary', () => {
    it('returns KPIs and analytics data', async () => {
      const summary = await mockAnalyticsService.getSummary()
      expect(summary.kpis.length).toBeGreaterThan(0)
      expect(summary.retention.length).toBeGreaterThan(0)
      expect(summary.peakHours.length).toBeGreaterThan(0)
      expect(summary.noShowRate).toBeGreaterThanOrEqual(0)
    })

    it('includes LTV data', async () => {
      const summary = await mockAnalyticsService.getSummary()
      expect(summary.customerLifetimeValue).toBeDefined()
    })
  })

  describe('getRetention', () => {
    it('returns retention data', async () => {
      const data = await mockAnalyticsService.getRetention(3)
      expect(data.length).toBeGreaterThan(0)
      expect(data[0].month).toBeTruthy()
      expect(data[0].retained).toBeGreaterThanOrEqual(0)
    })
  })

  describe('getPeakHours', () => {
    it('returns peak hours data', async () => {
      const data = await mockAnalyticsService.getPeakHours()
      expect(data.length).toBeGreaterThan(0)
      expect(data[0].hour).toBeGreaterThanOrEqual(0)
      expect(data[0].count).toBeGreaterThanOrEqual(0)
    })
  })

  describe('getCustomerLTV', () => {
    it('returns customer LTV list', async () => {
      const data = await mockAnalyticsService.getCustomerLTV()
      expect(Array.isArray(data)).toBe(true)
    })
  })

  describe('getNoShowRate', () => {
    it('returns a percentage', async () => {
      const rate = await mockAnalyticsService.getNoShowRate()
      expect(typeof rate).toBe('number')
      expect(rate).toBeGreaterThanOrEqual(0)
      expect(rate).toBeLessThanOrEqual(100)
    })
  })
})
