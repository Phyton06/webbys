import { describe, it, expect, beforeEach } from 'vitest'
import { mockClientService } from '../../services/mock/mockClientService'

beforeEach(() => {
  localStorage.clear()
})

describe('mockClientService', () => {
  describe('getAll', () => {
    it('returns client profiles', async () => {
      const clients = await mockClientService.getAll()
      expect(clients.length).toBeGreaterThan(0)
      expect(clients[0].name).toBeTruthy()
    })

    it('filters by search term', async () => {
      const clients = await mockClientService.getAll('Ana')
      expect(clients.length).toBe(1)
      expect(clients[0].name).toContain('Ana')
    })
  })

  describe('getById', () => {
    it('returns client by id', async () => {
      const clients = await mockClientService.getAll()
      const result = await mockClientService.getById(clients[0].id)
      expect(result.id).toBe(clients[0].id)
    })

    it('throws for nonexistent', async () => {
      await expect(mockClientService.getById('nope')).rejects.toThrow()
    })
  })

  describe('update', () => {
    it('updates client data', async () => {
      const clients = await mockClientService.getAll()
      const updated = await mockClientService.update(clients[0].id, { notes: 'VIP client' })
      expect(updated.notes).toBe('VIP client')
    })
  })

  describe('addNote', () => {
    it('appends a note', async () => {
      const clients = await mockClientService.getAll()
      const updated = await mockClientService.addNote(clients[0].id, 'Likes fade cuts')
      expect(updated.notes).toContain('Likes fade cuts')
    })
  })

  describe('getHistory', () => {
    it('returns appointment history', async () => {
      const clients = await mockClientService.getAll()
      const history = await mockClientService.getHistory(clients[0].id)
      expect(Array.isArray(history)).toBe(true)
    })
  })
})
