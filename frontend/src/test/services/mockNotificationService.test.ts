import { describe, it, expect, beforeEach } from 'vitest'
import { mockNotificationService } from '../../services/mock/mockNotificationService'

beforeEach(() => {
  localStorage.clear()
})

describe('mockNotificationService', () => {
  describe('send', () => {
    it('creates and sends a notification', async () => {
      const result = await mockNotificationService.send({
        type: 'APPOINTMENT_REMINDER',
        title: 'Recordatorio',
        message: 'Tu cita es mañana',
        recipientType: 'CLIENT',
        channel: 'SMS',
        status: 'PENDING',
      })
      expect(result.id).toBeTruthy()
      expect(result.status).toBe('SENT')
      expect(result.sentAt).toBeTruthy()
      expect(result.createdAt).toBeTruthy()
    })

    it('persists to localStorage', async () => {
      await mockNotificationService.send({
        type: 'GENERAL',
        title: 'Test',
        message: 'Body',
        recipientType: 'ALL',
        channel: 'EMAIL',
        status: 'PENDING',
      })
      const raw = localStorage.getItem('webbys_notifications')
      expect(raw).toBeTruthy()
      expect(JSON.parse(raw!)).toHaveLength(1)
    })
  })

  describe('sendBulk', () => {
    it('sends multiple notifications', async () => {
      const result = await mockNotificationService.sendBulk([
        { type: 'PROMOTION', title: 'Promo 1', message: 'Descuento 10%', recipientType: 'ALL', channel: 'WHATSAPP', status: 'PENDING' },
        { type: 'PROMOTION', title: 'Promo 2', message: 'Descuento 20%', recipientType: 'ALL', channel: 'WHATSAPP', status: 'PENDING' },
      ])
      expect(result).toHaveLength(2)
      result.forEach(n => {
        expect(n.id).toBeTruthy()
        expect(n.status).toBe('SENT')
      })
    })
  })

  describe('getAll', () => {
    it('returns empty array when none', async () => {
      expect(await mockNotificationService.getAll()).toEqual([])
    })

    it('returns all notifications', async () => {
      await mockNotificationService.send({ type: 'GENERAL', title: 'T1', message: 'M1', recipientType: 'ALL', channel: 'SMS', status: 'PENDING' })
      await mockNotificationService.send({ type: 'PROMOTION', title: 'T2', message: 'M2', recipientType: 'CLIENT', channel: 'EMAIL', status: 'PENDING' })
      const result = await mockNotificationService.getAll()
      expect(result).toHaveLength(2)
    })

    it('filters by type', async () => {
      await mockNotificationService.send({ type: 'GENERAL', title: 'T1', message: 'M1', recipientType: 'ALL', channel: 'SMS', status: 'PENDING' })
      await mockNotificationService.send({ type: 'PROMOTION', title: 'T2', message: 'M2', recipientType: 'ALL', channel: 'SMS', status: 'PENDING' })
      const result = await mockNotificationService.getAll({ type: 'PROMOTION' })
      expect(result).toHaveLength(1)
      expect(result[0].type).toBe('PROMOTION')
    })

    it('filters by channel', async () => {
      await mockNotificationService.send({ type: 'GENERAL', title: 'T1', message: 'M1', recipientType: 'ALL', channel: 'SMS', status: 'PENDING' })
      await mockNotificationService.send({ type: 'GENERAL', title: 'T2', message: 'M2', recipientType: 'ALL', channel: 'EMAIL', status: 'PENDING' })
      const result = await mockNotificationService.getAll({ channel: 'EMAIL' })
      expect(result).toHaveLength(1)
      expect(result[0].channel).toBe('EMAIL')
    })
  })

  describe('getById', () => {
    it('returns notification by id', async () => {
      const sent = await mockNotificationService.send({ type: 'GENERAL', title: 'T', message: 'M', recipientType: 'ALL', channel: 'SMS', status: 'PENDING' })
      const result = await mockNotificationService.getById(sent.id)
      expect(result.id).toBe(sent.id)
    })

    it('throws for nonexistent id', async () => {
      await expect(mockNotificationService.getById('nope')).rejects.toThrow()
    })
  })

  describe('templates', () => {
    it('returns seeded templates', async () => {
      const templates = await mockNotificationService.getTemplates()
      expect(templates.length).toBeGreaterThan(0)
    })

    it('creates a template', async () => {
      const result = await mockNotificationService.createTemplate({
        name: 'Custom Reminder',
        type: 'APPOINTMENT_REMINDER',
        channel: 'SMS',
        body: 'Hola {{name}}, tu cita es el {{date}}',
        variables: ['name', 'date'],
      })
      expect(result.id).toBeTruthy()
      expect(result.name).toBe('Custom Reminder')
    })

    it('updates a template', async () => {
      const created = await mockNotificationService.createTemplate({
        name: 'Original',
        type: 'GENERAL',
        channel: 'EMAIL',
        body: 'Body',
        variables: [],
      })
      const updated = await mockNotificationService.updateTemplate(created.id, { name: 'Updated' })
      expect(updated.name).toBe('Updated')
    })

    it('deletes a template', async () => {
      const created = await mockNotificationService.createTemplate({
        name: 'ToDelete',
        type: 'GENERAL',
        channel: 'SMS',
        body: 'Body',
        variables: [],
      })
      await mockNotificationService.deleteTemplate(created.id)
      const templates = await mockNotificationService.getTemplates()
      expect(templates.find(t => t.id === created.id)).toBeUndefined()
    })
  })

  describe('renderTemplate', () => {
    it('replaces variables in template body', async () => {
      const templates = await mockNotificationService.getTemplates()
      const reminder = templates.find(t => t.type === 'APPOINTMENT_REMINDER')
      if (reminder) {
        const rendered = await mockNotificationService.renderTemplate(reminder.id, {
          clientName: 'Juan',
          date: '2026-09-05',
          time: '10:00',
          service: 'Corte',
        })
        expect(rendered.body).not.toContain('{{clientName}}')
        expect(rendered.body).toContain('Juan')
      }
    })
  })
})
