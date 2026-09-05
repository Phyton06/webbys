import { describe, it, expect, beforeEach } from 'vitest'
import { mockSettingsService } from '../../services/mock/mockSettingsService'

beforeEach(() => {
  localStorage.clear()
})

describe('mockSettingsService', () => {
  describe('get', () => {
    it('returns settings with business, roles, branding', async () => {
      const settings = await mockSettingsService.get()
      expect(settings.business).toBeDefined()
      expect(settings.roles).toBeDefined()
      expect(settings.branding).toBeDefined()
      expect(settings.business.name).toBeTruthy()
    })
  })

  describe('updateBusiness', () => {
    it('updates business settings', async () => {
      const updated = await mockSettingsService.updateBusiness({ name: 'New Name' })
      expect(updated.name).toBe('New Name')
    })

    it('persists changes', async () => {
      await mockSettingsService.updateBusiness({ phone: '5559999' })
      const settings = await mockSettingsService.get()
      expect(settings.business.phone).toBe('5559999')
    })
  })

  describe('updateBranding', () => {
    it('updates branding settings', async () => {
      const updated = await mockSettingsService.updateBranding({ primaryColor: '#FF0000' })
      expect(updated.primaryColor).toBe('#FF0000')
    })
  })

  describe('getRoles', () => {
    it('returns role permissions', async () => {
      const roles = await mockSettingsService.getRoles()
      expect(roles.length).toBeGreaterThan(0)
      expect(roles[0].role).toBeTruthy()
      expect(roles[0].permissions).toBeDefined()
    })
  })
})
