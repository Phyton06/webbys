import type { Campaign, CampaignService } from '../interfaces'
import { load, save, genId, delay } from './storage'

const KEY = 'webbys_campaigns'

function seed() {
  if (load<Campaign>(KEY).length > 0) return
  const campaigns: Campaign[] = [
    {
      id: 'c1', name: 'Bienvenida', description: 'Cupón de bienvenida para nuevos clientes',
      type: 'REFERRAL', status: 'ACTIVE', channel: 'WHATSAPP',
      referralCode: 'WELCOME10', discountPercent: 10,
      startDate: '2026-09-01', endDate: '2026-12-31', targetAudience: 'NEW',
      stats: { sent: 25, opened: 20, clicked: 12, converted: 8, revenue: 1600 },
      createdAt: '2026-09-01',
    },
    {
      id: 'c2', name: 'Happy Hour Viernes', description: '20% los viernes de 2-5pm',
      type: 'PROMOTION', status: 'PAUSED', channel: 'SMS',
      discountPercent: 20,
      startDate: '2026-09-01', endDate: '2026-09-30', targetAudience: 'CLIENTS',
      stats: { sent: 100, opened: 60, clicked: 30, converted: 15, revenue: 3000 },
      createdAt: '2026-09-01',
    },
  ]
  save(KEY, campaigns)
}

seed()

export const mockCampaignService: CampaignService = {
  async getAll() {
    await delay()
    return load<Campaign>(KEY)
  },

  async getById(id) {
    await delay()
    const c = load<Campaign>(KEY).find(c => c.id === id)
    if (!c) throw new Error(`Campaign ${id} not found`)
    return c
  },

  async create(data) {
    await delay()
    const campaigns = load<Campaign>(KEY)
    const c: Campaign = { ...data, id: genId(), stats: { sent: 0, opened: 0, clicked: 0, converted: 0, revenue: 0 }, createdAt: new Date().toISOString() }
    campaigns.push(c)
    save(KEY, campaigns)
    return c
  },

  async update(id, data) {
    await delay()
    const campaigns = load<Campaign>(KEY)
    const idx = campaigns.findIndex(c => c.id === id)
    if (idx === -1) throw new Error(`Campaign ${id} not found`)
    campaigns[idx] = { ...campaigns[idx], ...data }
    save(KEY, campaigns)
    return campaigns[idx]
  },

  async updateStatus(id, status) {
    await delay()
    const campaigns = load<Campaign>(KEY)
    const idx = campaigns.findIndex(c => c.id === id)
    if (idx === -1) throw new Error(`Campaign ${id} not found`)
    campaigns[idx].status = status
    save(KEY, campaigns)
    return campaigns[idx]
  },

  async getStats(id) {
    await delay()
    const c = load<Campaign>(KEY).find(c => c.id === id)
    if (!c) throw new Error(`Campaign ${id} not found`)
    return c.stats
  },

  async generateReferralCode(id) {
    await delay()
    const campaigns = load<Campaign>(KEY)
    const idx = campaigns.findIndex(c => c.id === id)
    if (idx === -1) throw new Error(`Campaign ${id} not found`)
    const code = Math.random().toString(36).slice(2, 8).toUpperCase()
    campaigns[idx].referralCode = code
    save(KEY, campaigns)
    return code
  },
}
