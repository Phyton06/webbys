import { describe, it, expect, beforeEach } from 'vitest'
import { mockNotificationStatsService } from '../../services/mock/mockNotificationStatsService'

beforeEach(() => {
  localStorage.clear()
})

describe('mockNotificationStatsService', () => {
  it('returns aggregated stats', async () => {
    const stats = await mockNotificationStatsService.getStats()
    expect(stats.total).toBeGreaterThan(0)
    expect(stats.byChannel).toBeDefined()
    expect(stats.byType).toBeDefined()
    expect(stats.trend).toBeDefined()
  })

  it('returns stats by channel', async () => {
    const statsByChannel = await mockNotificationStatsService.getStatsByChannel()
    expect(statsByChannel).toBeDefined()
    expect(statsByChannel.SMS).toBeDefined()
  })

  it('returns notification trend data', async () => {
    const trend = await mockNotificationStatsService.getTrend()
    expect(trend.length).toBeGreaterThan(0)
    expect(trend[0].date).toBeTruthy()
  })
})
