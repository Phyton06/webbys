import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../data/mock', () => ({
  mockApi: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

import api from '../../api/client'
import { mockApi } from '../../data/mock'

const mock = vi.mocked(mockApi)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('api client', () => {
  describe('get', () => {
    it('returns data on success', async () => {
      mock.get.mockResolvedValue({ data: { id: 1 } })
      const res = await api.get('/test')
      expect(res).toEqual({ data: { id: 1 }, status: 200, headers: {} })
      expect(mock.get).toHaveBeenCalledWith('/test')
    })

    it('throws on error', async () => {
      mock.get.mockRejectedValue(new Error('fail'))
      await expect(api.get('/bad')).rejects.toThrow('fail')
    })
  })

  describe('post', () => {
    it('sends body and returns data', async () => {
      mock.post.mockResolvedValue({ data: { created: true } })
      const res = await api.post('/items', { name: 'test' })
      expect(res).toEqual({ data: { created: true }, status: 200, headers: {} })
      expect(mock.post).toHaveBeenCalledWith('/items', { name: 'test' })
    })

    it('throws on error', async () => {
      mock.post.mockRejectedValue(new Error('fail'))
      await expect(api.post('/items')).rejects.toThrow('fail')
    })
  })

  describe('put', () => {
    it('sends body and returns data', async () => {
      mock.put.mockResolvedValue({ data: { updated: true } })
      const res = await api.put('/items/1', { name: 'updated' })
      expect(res).toEqual({ data: { updated: true }, status: 200, headers: {} })
    })

    it('throws on error', async () => {
      mock.put.mockRejectedValue(new Error('fail'))
      await expect(api.put('/items/1')).rejects.toThrow('fail')
    })
  })

  describe('delete', () => {
    it('deletes and returns data', async () => {
      mock.delete.mockResolvedValue({ data: { deleted: true } })
      const res = await api.delete('/items/1')
      expect(res).toEqual({ data: { deleted: true }, status: 200, headers: {} })
    })

    it('throws on error', async () => {
      mock.delete.mockRejectedValue(new Error('fail'))
      await expect(api.delete('/items/1')).rejects.toThrow('fail')
    })
  })
})
