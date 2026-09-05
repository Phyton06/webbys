import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Payments from '../../../pages/admin/Payments'

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
    <MemoryRouter initialEntries={['/admin/pagos']}>
      <Payments />
    </MemoryRouter>
  )
}

const mockPaymentsData = [
  {
    id: 'p1',
    appointmentId: 'a1',
    clientId: 'u5',
    barberId: 'u3',
    serviceId: 's1',
    amount: 150,
    method: 'CASH',
    status: 'COMPLETED',
    date: '2026-09-04',
    notes: 'Pago en efectivo',
  },
  {
    id: 'p2',
    appointmentId: 'a2',
    clientId: 'u6',
    barberId: 'u4',
    serviceId: 's2',
    amount: 250,
    method: 'CARD',
    status: 'COMPLETED',
    date: '2026-09-04',
    notes: 'Pago con tarjeta',
  },
]

const mockSummaryData = {
  totalRevenue: 400,
  completedCount: 2,
  pendingCount: 0,
  refundedCount: 0,
  byMethod: { CASH: 150, CARD: 250 },
}

const mockAppointments = [
  { id: 'a1', clientId: 'u5', barberId: 'u3', serviceId: 's1', date: '2026-09-04', status: 'COMPLETED' },
  { id: 'a2', clientId: 'u6', barberId: 'u4', serviceId: 's2', date: '2026-09-04', status: 'COMPLETED' },
  { id: 'a3', clientId: 'u5', barberId: 'u3', serviceId: 's1', date: '2026-09-04', status: 'COMPLETED' },
]

const mockClients = [
  { id: 'u5', name: 'Ana Cliente' },
  { id: 'u6', name: 'Luis Cliente' },
]

const mockBarbers = [
  { id: 'u3', name: 'Juan Barbero' },
  { id: 'u4', name: 'Pedro Barbero' },
]

const mockServices = [
  { id: 's1', name: 'Corte de cabello', price: 150 },
  { id: 's2', name: 'Barba', price: 100 },
]

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()

  mockApi.get.mockImplementation((url: string) => {
    if (url === '/payments') return Promise.resolve({ data: mockPaymentsData })
    if (url === '/payments/summary') return Promise.resolve({ data: mockSummaryData })
    if (url === '/appointments') return Promise.resolve({ data: mockAppointments })
    if (url === '/clients') return Promise.resolve({ data: mockClients })
    if (url === '/barbers') return Promise.resolve({ data: mockBarbers })
    if (url === '/services') return Promise.resolve({ data: mockServices })
    return Promise.resolve({ data: [] })
  })
})

describe('Admin Payments Page', () => {
  it('renders heading, summary cards and payments list', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Gestión de Pagos')).toBeInTheDocument()
    })

    // Summary cards
    expect(screen.getByText('Ingresos Totales')).toBeInTheDocument()
    expect(screen.getByText('$400')).toBeInTheDocument()
    expect(screen.getByText('Pagos Realizados')).toBeInTheDocument()
    expect(screen.getByText('Ticket Promedio')).toBeInTheDocument()

    // Table items
    expect(screen.getByText('Ana Cliente')).toBeInTheDocument()
    expect(screen.getByText('Luis Cliente')).toBeInTheDocument()
    expect(screen.getByText('$150')).toBeInTheDocument()
    expect(screen.getByText('$250')).toBeInTheDocument()
  })

  it('filters payments by method', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Ana Cliente')).toBeInTheDocument()
    })

    const methodSelect = screen.getByLabelText(/método/i)
    fireEvent.change(methodSelect, { target: { value: 'CARD' } })

    expect(screen.getByText('Luis Cliente')).toBeInTheDocument()
    expect(screen.queryByText('Ana Cliente')).not.toBeInTheDocument()
  })

  it('opens registration modal and registers a payment successfully', async () => {
    mockApi.post.mockResolvedValueOnce({
      data: {
        id: 'p3',
        appointmentId: 'a3',
        clientId: 'u5',
        barberId: 'u3',
        serviceId: 's1',
        amount: 150,
        method: 'TRANSFER',
        status: 'COMPLETED',
        date: '2026-09-04',
      },
    })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Gestión de Pagos')).toBeInTheDocument()
    })

    const newBtn = screen.getByRole('button', { name: /\+ registrar pago/i })
    fireEvent.click(newBtn)

    expect(screen.getByText('Registrar Pago')).toBeInTheDocument()

    // Fill the form
    const apptSelect = screen.getByLabelText(/cita/i)
    fireEvent.change(apptSelect, { target: { value: 'a3' } })

    const amountInput = screen.getByLabelText(/monto/i)
    fireEvent.change(amountInput, { target: { value: '150' } })

    const methodSelect = screen.getByLabelText(/método de pago/i)
    fireEvent.change(methodSelect, { target: { value: 'TRANSFER' } })

    const submitBtn = screen.getByRole('button', { name: /guardar pago/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith('/payments', expect.objectContaining({
        appointmentId: 'a3',
        amount: 150,
        method: 'TRANSFER',
      }))
    })
  })

  it('prevents duplicate payment registration for appointment with existing payment', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Gestión de Pagos')).toBeInTheDocument()
    })

    const newBtn = screen.getByRole('button', { name: /\+ registrar pago/i })
    fireEvent.click(newBtn)

    // Select appointment a1 which already has payment p1
    const apptSelect = screen.getByLabelText(/cita/i)
    fireEvent.change(apptSelect, { target: { value: 'a1' } })

    const amountInput = screen.getByLabelText(/monto/i)
    fireEvent.change(amountInput, { target: { value: '150' } })

    const submitBtn = screen.getByRole('button', { name: /guardar pago/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(screen.getByText('Esta cita ya tiene un pago registrado')).toBeInTheDocument()
    })

    expect(mockApi.post).not.toHaveBeenCalled()
  })
})
