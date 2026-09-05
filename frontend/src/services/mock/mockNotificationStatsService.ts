import type { NotificationStatsService, Notification } from '../interfaces'
import { load, save, delay } from './storage'

const NOTIF_KEY = 'webbys_notifications'

function seedNotifications() {
  const notifs = load<Notification>(NOTIF_KEY)
  if (notifs.length > 0) return

  const today = new Date().toISOString().split('T')[0]
  const list: Notification[] = [
    {
      id: 'n1',
      type: 'APPOINTMENT_REMINDER',
      title: 'Recordatorio de cita',
      message: 'Tienes una cita hoy',
      recipientType: 'CLIENT',
      channel: 'SMS',
      status: 'DELIVERED',
      createdAt: today,
      sentAt: today,
    },
    {
      id: 'n2',
      type: 'PROMOTION',
      title: 'Descuento especial',
      message: 'Descuento de 20% en barbería',
      recipientType: 'ALL',
      channel: 'WHATSAPP',
      status: 'SENT',
      createdAt: today,
      sentAt: today,
    },
    {
      id: 'n3',
      type: 'STATUS_CHANGE',
      title: 'Cita cancelada',
      message: 'Tu cita ha sido cancelada',
      recipientType: 'CLIENT',
      channel: 'EMAIL',
      status: 'FAILED',
      createdAt: today,
      sentAt: today,
    },
  ]
  save(NOTIF_KEY, list)
}

export const mockNotificationStatsService: NotificationStatsService = {
  async getStats(dateRange) {
    await delay()
    seedNotifications()
    let list = load<Notification>(NOTIF_KEY)
    if (dateRange) {
      list = list.filter(n => n.createdAt >= dateRange.start && n.createdAt <= dateRange.end)
    }

    const total = list.length
    const sent = list.filter(n => n.status === 'SENT' || n.status === 'DELIVERED').length
    const delivered = list.filter(n => n.status === 'DELIVERED').length
    const failed = list.filter(n => n.status === 'FAILED').length

    const byChannel: Record<string, { sent: number; delivered: number; failed: number }> = {
      SMS: { sent: 0, delivered: 0, failed: 0 },
      EMAIL: { sent: 0, delivered: 0, failed: 0 },
      PUSH: { sent: 0, delivered: 0, failed: 0 },
      WHATSAPP: { sent: 0, delivered: 0, failed: 0 },
    }

    const byType: Record<string, number> = {
      APPOINTMENT_REMINDER: 0,
      PROMOTION: 0,
      STATUS_CHANGE: 0,
      GENERAL: 0,
    }

    list.forEach(n => {
      if (byChannel[n.channel]) {
        if (n.status === 'SENT') byChannel[n.channel].sent++
        if (n.status === 'DELIVERED') byChannel[n.channel].delivered++
        if (n.status === 'FAILED') byChannel[n.channel].failed++
      }
      if (byType[n.type] !== undefined) {
        byType[n.type]++
      }
    })

    const trend = await this.getTrend()

    return {
      total,
      sent,
      delivered,
      failed,
      byChannel,
      byType,
      trend,
    }
  },

  async getStatsByChannel(dateRange) {
    const stats = await this.getStats(dateRange)
    return stats.byChannel
  },

  async getTrend(days = 7) {
    await delay()
    seedNotifications()
    const list = load<Notification>(NOTIF_KEY)
    const trendMap: Record<string, number> = {}

    // Init last 7 days
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      trendMap[dateStr] = 0
    }

    list.forEach(n => {
      const dateStr = n.createdAt.split('T')[0]
      if (trendMap[dateStr] !== undefined) {
        trendMap[dateStr]++
      }
    })

    return Object.entries(trendMap).map(([date, count]) => ({ date, count }))
  },
}
