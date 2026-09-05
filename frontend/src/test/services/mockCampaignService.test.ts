import { describe, it, expect, beforeEach } from 'vitest'
import { mockCampaignService } from '../../services/mock/mockCampaignService'

beforeEach(() => {
  localStorage.clear()
})

describe('mockCampaignService', () => {
  describe('create', () => {
    it('creates a campaign with generated id', async () => {
      const result = await mockCampaignService.create({
        name: 'Summer Promo',
        description: '10% off all services',
        type: 'DISCOUNT',
        status: 'DRAFT',
        channel: 'WHATSAPP',
        discountPercent: 10,
        startDate: '2026-09-01',
        endDate: '2026-09-30',
        targetAudience: 'ALL',
      })
      expect(result.id).toBeTruthy()
      expect(result.name).toBe('Summer Promo')
      expect(result.stats).toEqual({ sent: 0, opened: 0, clicked: 0, converted: 0, revenue: 0 })
    })
  })

  describe('getAll', () => {
    it('returns empty when none', async () => {
      expect(await mockCampaignService.getAll()).toEqual([])
    })

    it('returns all campaigns', async () => {
      await mockCampaignService.create({
        name: 'C1', description: 'D1', type: 'PROMOTION', status: 'ACTIVE',
        channel: 'SMS', startDate: '2026-09-01', endDate: '2026-09-30', targetAudience: 'ALL',
      })
      const result = await mockCampaignService.getAll()
      expect(result).toHaveLength(1)
    })
  })

  describe('getById', () => {
    it('returns campaign by id', async () => {
      const created = await mockCampaignService.create({
        name: 'Test', description: 'Desc', type: 'SEASONAL', status: 'DRAFT',
        channel: 'EMAIL', startDate: '2026-09-01', endDate: '2026-09-30', targetAudience: 'NEW',
      })
      const result = await mockCampaignService.getById(created.id)
      expect(result.name).toBe('Test')
    })

    it('throws for nonexistent', async () => {
      await expect(mockCampaignService.getById('nope')).rejects.toThrow()
    })
  })

  describe('updateStatus', () => {
    it('updates campaign status', async () => {
      const created = await mockCampaignService.create({
        name: 'Test', description: 'Desc', type: 'REFERRAL', status: 'DRAFT',
        channel: 'SMS', startDate: '2026-09-01', endDate: '2026-09-30', targetAudience: 'ALL',
      })
      const updated = await mockCampaignService.updateStatus(created.id, 'ACTIVE')
      expect(updated.status).toBe('ACTIVE')
    })
  })

  describe('generateReferralCode', () => {
    it('generates unique code', async () => {
      const created = await mockCampaignService.create({
        name: 'Referral', description: 'Desc', type: 'REFERRAL', status: 'ACTIVE',
        channel: 'WHATSAPP', startDate: '2026-09-01', endDate: '2026-09-30', targetAudience: 'ALL',
      })
      const code = await mockCampaignService.generateReferralCode(created.id)
      expect(code).toBeTruthy()
      expect(code.length).toBeGreaterThan(4)
    })
  })
})
