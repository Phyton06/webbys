import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Notifications from '../../../pages/admin/Notifications'

vi.mock('../../../api/client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

import api from '../../../api/client'
const mockApi = vi.mocked(api) as any

function renderComponent() {
  localStorage.setItem('user', JSON.stringify({ id: '1', name: 'Admin', role: 'ADMIN' }))
  return render(
    <MemoryRouter initialEntries={['/admin/notificaciones']}>
      <Notifications />
    </MemoryRouter>
  )
}

const mockNotificationsData = [
  {
    id: 'n1',
    type: 'APPOINTMENT_REMINDER',
    title: 'Recordatorio de cita',
    message: 'Hola Ana, tienes una cita hoy a las 10:00.',
    recipientId: 'u5',
    recipientType: 'CLIENT',
    channel: 'SMS',
    status: 'SENT',
    sentAt: '2026-09-04T10:00:00Z',
    createdAt: '2026-09-04T10:00:00Z',
  },
  {
    id: 'n2',
    type: 'PROMOTION',
    title: 'Descuento especial',
    message: '20% de descuento en todos los servicios.',
    recipientId: 'u6',
    recipientType: 'CLIENT',
    channel: 'WHATSAPP',
    status: 'DELIVERED',
    sentAt: '2026-09-04T11:00:00Z',
    createdAt: '2026-09-04T11:00:00Z',
  },
]

const mockTemplatesData = [
  {
    id: 't1',
    name: 'Recordatorio Cita',
    type: 'APPOINTMENT_REMINDER',
    channel: 'SMS',
    body: 'Hola {{clientName}}, tu cita es el {{date}} a las {{time}}',
    variables: ['clientName', 'date', 'time'],
  },
  {
    id: 't2',
    name: 'Promo Verano',
    type: 'PROMOTION',
    channel: 'WHATSAPP',
    subject: 'Oferta Especial',
    body: '¡Hola! 20% de descuento este fin de semana.',
    variables: [],
  },
]

const mockClients = [
  { id: 'u5', name: 'Ana Cliente', phone: '555-1111' },
  { id: 'u6', name: 'Luis Cliente', phone: '555-2222' },
]

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()

  mockApi.get.mockImplementation((url: string) => {
    if (url === '/notifications') return Promise.resolve({ data: mockNotificationsData })
    if (url === '/notifications/templates') return Promise.resolve({ data: mockTemplatesData })
    if (url === '/clients') return Promise.resolve({ data: mockClients })
    return Promise.resolve({ data: [] })
  })
})

describe('Admin Notifications Page', () => {
  it('renders heading, history list, and templates', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Notificaciones')).toBeInTheDocument()
    })

    // History items
    expect(screen.getByText('Recordatorio de cita')).toBeInTheDocument()
    expect(screen.getByText('Descuento especial')).toBeInTheDocument()

    // Templates visible or tab
    expect(screen.getByText('Plantillas')).toBeInTheDocument()
    expect(screen.getByText('Historial')).toBeInTheDocument()
  })

  it('sends a single notification to a client', async () => {
    mockApi.post.mockResolvedValueOnce({
      data: {
        id: 'n3',
        type: 'GENERAL',
        title: 'Aviso importante',
        message: 'Apertura de nueva sucursal',
        recipientId: 'u5',
        recipientType: 'CLIENT',
        channel: 'SMS',
        status: 'SENT',
        createdAt: '2026-09-04T12:00:00Z',
      },
    })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Notificaciones')).toBeInTheDocument()
    })

    const sendTabOrBtn = screen.getByRole('button', { name: /\+ enviar notificación|nueva notificación/i })
    fireEvent.click(sendTabOrBtn)

    // Fill send form
    const titleInput = screen.getByLabelText(/título|asunto/i)
    fireEvent.change(titleInput, { target: { value: 'Aviso importante' } })

    const msgInput = screen.getByLabelText(/mensaje/i)
    fireEvent.change(msgInput, { target: { value: 'Apertura de nueva sucursal' } })

    const clientSelect = screen.getByLabelText(/^destinatario$/i)
    fireEvent.change(clientSelect, { target: { value: 'u5' } })

    const submitBtn = screen.getByRole('button', { name: /^enviar$/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith('/notifications', expect.objectContaining({
        title: 'Aviso importante',
        message: 'Apertura de nueva sucursal',
        recipientId: 'u5',
      }))
    })
  })

  it('sends bulk notification to all clients', async () => {
    mockApi.post.mockResolvedValueOnce({
      data: [
        { id: 'n4', recipientId: 'u5', status: 'SENT' },
        { id: 'n5', recipientId: 'u6', status: 'SENT' },
      ],
    })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Notificaciones')).toBeInTheDocument()
    })

    const sendBtn = screen.getByRole('button', { name: /\+ enviar notificación|nueva notificación/i })
    fireEvent.click(sendBtn)

    const typeSelect = screen.getByLabelText(/tipo de destinatario/i)
    fireEvent.change(typeSelect, { target: { value: 'ALL' } })

    const titleInput = screen.getByLabelText(/título|asunto/i)
    fireEvent.change(titleInput, { target: { value: 'Promoción Viernes' } })

    const msgInput = screen.getByLabelText(/mensaje/i)
    fireEvent.change(msgInput, { target: { value: '2x1 en cortes hoy' } })

    const submitBtn = screen.getByRole('button', { name: /^enviar$/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith('/notifications/bulk', expect.any(Object))
    })
  })

  it('creates a new notification template', async () => {
    mockApi.post.mockResolvedValueOnce({
      data: {
        id: 't3',
        name: 'Recordatorio 1 hora antes',
        type: 'APPOINTMENT_REMINDER',
        channel: 'SMS',
        body: 'Tu cita comenzará pronto.',
        variables: [],
      },
    })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Notificaciones')).toBeInTheDocument()
    })

    // Click on Templates tab
    const templatesTab = screen.getByRole('button', { name: /^plantillas$/i })
    fireEvent.click(templatesTab)

    expect(screen.getByText('Recordatorio Cita')).toBeInTheDocument()

    // Open template creation
    const newTemplateBtn = screen.getByRole('button', { name: /\+ nueva plantilla/i })
    fireEvent.click(newTemplateBtn)

    const nameInput = screen.getByLabelText(/nombre de plantilla/i)
    fireEvent.change(nameInput, { target: { value: 'Recordatorio 1 hora antes' } })

    const bodyInput = screen.getByLabelText(/cuerpo de la plantilla|contenido/i)
    fireEvent.change(bodyInput, { target: { value: 'Tu cita comenzará pronto.' } })

    const saveTemplateBtn = screen.getByRole('button', { name: /guardar plantilla/i })
    fireEvent.click(saveTemplateBtn)

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith('/notifications/templates', expect.objectContaining({
        name: 'Recordatorio 1 hora antes',
        body: 'Tu cita comenzará pronto.',
      }))
    })
  })

  it('filters notification history by channel', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Recordatorio de cita')).toBeInTheDocument()
      expect(screen.getByText('Descuento especial')).toBeInTheDocument()
    })

    const channelSelect = screen.getByLabelText(/canal/i)
    fireEvent.change(channelSelect, { target: { value: 'SMS' } })

    expect(screen.getByText('Recordatorio de cita')).toBeInTheDocument()
    expect(screen.queryByText('Descuento especial')).not.toBeInTheDocument()
  })
})
