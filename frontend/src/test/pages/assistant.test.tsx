import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../../api/client', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: [] }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    put: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
  },
}))

import api from '../../api/client'
const mock = vi.mocked(api) as any

function assistantWrapper({ children }: { children: React.ReactNode }) {
  localStorage.setItem('user', JSON.stringify({ id: '1', name: 'Assistant', role: 'ASSISTANT', email: 'a@a.com' }))
  return <MemoryRouter initialEntries={['/asistente']}>{children}</MemoryRouter>
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
})

// --- TodayAppointments ---
import AssistantTodayAppointments from '../../pages/assistant/TodayAppointments'
describe('Assistant TodayAppointments', () => {
  it('renders empty state', async () => {
    mock.get.mockResolvedValue({ data: [] })
    render(<AssistantTodayAppointments />, { wrapper: assistantWrapper })
    await waitFor(() => expect(screen.getByText('Citas de Hoy')).toBeInTheDocument())
    expect(screen.getByText('No hay citas programadas para hoy')).toBeInTheDocument()
  })

  it('shows confirm button for PENDING appointments', async () => {
    const today = new Date().toISOString().split('T')[0]
    mock.get.mockImplementation((url) => {
      if (url === '/appointments') return Promise.resolve({ data: [{ id: '1', clientName: 'Maria', barberName: 'Juan', serviceName: 'Corte', date: today, time: '10:00', status: 'PENDING' }] })
      return Promise.resolve({ data: [] })
    })
    render(<AssistantTodayAppointments />, { wrapper: assistantWrapper })
    await waitFor(() => expect(screen.getByText('Confirmar')).toBeInTheDocument())
    expect(screen.getByText('Cancelar')).toBeInTheDocument()
  })

  it('shows start button for CONFIRMED appointments', async () => {
    const today = new Date().toISOString().split('T')[0]
    mock.get.mockImplementation((url) => {
      if (url === '/appointments') return Promise.resolve({ data: [{ id: '1', clientName: 'Maria', barberName: 'Juan', serviceName: 'Corte', date: today, time: '10:00', status: 'CONFIRMED' }] })
      return Promise.resolve({ data: [] })
    })
    render(<AssistantTodayAppointments />, { wrapper: assistantWrapper })
    await waitFor(() => expect(screen.getByText('Iniciar')).toBeInTheDocument())
  })

  it('shows complete button for IN_PROGRESS appointments', async () => {
    const today = new Date().toISOString().split('T')[0]
    mock.get.mockImplementation((url) => {
      if (url === '/appointments') return Promise.resolve({ data: [{ id: '1', clientName: 'Maria', barberName: 'Juan', serviceName: 'Corte', date: today, time: '10:00', status: 'IN_PROGRESS' }] })
      return Promise.resolve({ data: [] })
    })
    render(<AssistantTodayAppointments />, { wrapper: assistantWrapper })
    await waitFor(() => expect(screen.getByText('Completar')).toBeInTheDocument())
  })

  it('calls updateStatus on Confirmar click', async () => {
    const today = new Date().toISOString().split('T')[0]
    mock.get.mockImplementation((url) => {
      if (url === '/appointments') return Promise.resolve({ data: [{ id: '1', clientName: 'Maria', barberName: 'Juan', serviceName: 'Corte', date: today, time: '10:00', status: 'PENDING' }] })
      return Promise.resolve({ data: [] })
    })
    mock.put.mockResolvedValue({ data: {} })
    render(<AssistantTodayAppointments />, { wrapper: assistantWrapper })
    await waitFor(() => expect(screen.getByText('Confirmar')).toBeInTheDocument())
    await act(async () => { screen.getByText('Confirmar').click() })
    expect(mock.put).toHaveBeenCalledWith('/appointments/1/status', { status: 'CONFIRMADA' })
  })
})

// --- NewAppointment ---
import AssistantNewAppointment from '../../pages/assistant/NewAppointment'
describe('Assistant NewAppointment', () => {
  it('renders form with all fields', async () => {
    mock.get.mockResolvedValue({ data: { barbers: [], clients: [], services: [] } })
    render(<AssistantNewAppointment />, { wrapper: assistantWrapper })
    await waitFor(() => expect(screen.getByText('Nueva Cita')).toBeInTheDocument())
    expect(screen.getByLabelText('Buscar cliente')).toBeInTheDocument()
    expect(screen.getByLabelText('Seleccionar barbero')).toBeInTheDocument()
    expect(screen.getByLabelText('Fecha de la cita')).toBeInTheDocument()
    expect(screen.getByLabelText('Seleccionar servicio')).toBeInTheDocument()
  })

  it('filters clients by name', async () => {
    mock.get.mockImplementation((url) => {
      if (url === '/barbers') return Promise.resolve({ data: { barbers: [] } })
      if (url === '/clients') return Promise.resolve({ data: { clients: [{ id: '1', name: 'Maria', phone: '555' }, { id: '2', name: 'Pedro', phone: '666' }] } })
      if (url === '/services') return Promise.resolve({ data: { services: [] } })
      return Promise.resolve({ data: [] })
    })
    render(<AssistantNewAppointment />, { wrapper: assistantWrapper })
    await waitFor(() => expect(screen.getByText('Nueva Cita')).toBeInTheDocument())

    const searchInput = screen.getByLabelText('Buscar cliente')
    await act(async () => { fireEvent.change(searchInput, { target: { value: 'Maria' } }) })
    expect(screen.getByText('Maria · 555')).toBeInTheDocument()
    expect(screen.queryByText('Pedro · 666')).not.toBeInTheDocument()
  })

  it('selects client from search results', async () => {
    mock.get.mockImplementation((url) => {
      if (url === '/barbers') return Promise.resolve({ data: { barbers: [] } })
      if (url === '/clients') return Promise.resolve({ data: { clients: [{ id: '1', name: 'Maria', phone: '555' }] } })
      if (url === '/services') return Promise.resolve({ data: { services: [] } })
      return Promise.resolve({ data: [] })
    })
    render(<AssistantNewAppointment />, { wrapper: assistantWrapper })
    await waitFor(() => expect(screen.getByText('Nueva Cita')).toBeInTheDocument())

    const searchInput = screen.getByLabelText('Buscar cliente')
    await act(async () => { fireEvent.change(searchInput, { target: { value: 'Maria' } }) })
    await act(async () => { screen.getByText('Maria · 555').click() })
    // After selecting, the search input shows the name
    expect(searchInput).toHaveValue('Maria')
  })

  it('shows time slots when barber and date selected', async () => {
    mock.get.mockImplementation((url) => {
      if (url === '/barbers') return Promise.resolve({ data: { barbers: [{ id: '1', name: 'Juan' }] } })
      if (url === '/clients') return Promise.resolve({ data: { clients: [] } })
      if (url === '/services') return Promise.resolve({ data: { services: [] } })
      return Promise.resolve({ data: { slots: [{ time: '10:00', available: true }, { time: '11:00', available: true }] } })
    })
    render(<AssistantNewAppointment />, { wrapper: assistantWrapper })
    await waitFor(() => expect(screen.getByText('Nueva Cita')).toBeInTheDocument())

    // Select barber
    fireEvent.change(screen.getByLabelText('Seleccionar barbero'), { target: { value: '1' } })
    // Set date
    await act(async () => { fireEvent.change(screen.getByLabelText('Fecha de la cita'), { target: { value: '2026-09-05' } }) })
    await waitFor(() => expect(screen.getByText('10:00')).toBeInTheDocument())
    expect(screen.getByText('11:00')).toBeInTheDocument()
  })

  it('shows error on submit failure', async () => {
    mock.get.mockImplementation((url) => {
      if (url === '/barbers') return Promise.resolve({ data: { barbers: [{ id: '1', name: 'Juan' }] } })
      if (url === '/clients') return Promise.resolve({ data: { clients: [{ id: '1', name: 'Maria', phone: '555' }] } })
      if (url === '/services') return Promise.resolve({ data: { services: [] } })
      return Promise.resolve({ data: { slots: [{ time: '10:00', available: true }] } })
    })
    mock.post.mockRejectedValue(new Error('fail'))
    render(<AssistantNewAppointment />, { wrapper: assistantWrapper })
    await waitFor(() => expect(screen.getByText('Nueva Cita')).toBeInTheDocument())

    // Select client
    fireEvent.change(screen.getByLabelText('Buscar cliente'), { target: { value: 'Maria' } })
    await act(async () => { screen.getByText('Maria · 555').click() })
    // Select barber
    fireEvent.change(screen.getByLabelText('Seleccionar barbero'), { target: { value: '1' } })
    // Set date
    await act(async () => { fireEvent.change(screen.getByLabelText('Fecha de la cita'), { target: { value: '2026-09-05' } }) })
    await waitFor(() => expect(screen.getByText('10:00')).toBeInTheDocument())
    // Select time
    await act(async () => { screen.getByText('10:00').click() })
    // Submit
    await act(async () => { screen.getByText('Agendar cita').click() })
    await waitFor(() => expect(screen.getByText('Error al agendar la cita')).toBeInTheDocument())
  })

  it('submits successfully and navigates', async () => {
    mock.get.mockImplementation((url) => {
      if (url === '/barbers') return Promise.resolve({ data: { barbers: [{ id: '1', name: 'Juan' }] } })
      if (url === '/clients') return Promise.resolve({ data: { clients: [{ id: '1', name: 'Maria', phone: '555' }] } })
      if (url === '/services') return Promise.resolve({ data: { services: [] } })
      return Promise.resolve({ data: { slots: [{ time: '10:00', available: true }] } })
    })
    mock.post.mockResolvedValue({ data: {} })
    render(<AssistantNewAppointment />, { wrapper: assistantWrapper })
    await waitFor(() => expect(screen.getByText('Nueva Cita')).toBeInTheDocument())

    fireEvent.change(screen.getByLabelText('Buscar cliente'), { target: { value: 'Maria' } })
    await act(async () => { screen.getByText('Maria · 555').click() })
    fireEvent.change(screen.getByLabelText('Seleccionar barbero'), { target: { value: '1' } })
    await act(async () => { fireEvent.change(screen.getByLabelText('Fecha de la cita'), { target: { value: '2026-09-05' } }) })
    await waitFor(() => expect(screen.getByText('10:00')).toBeInTheDocument())
    await act(async () => { screen.getByText('10:00').click() })
    await act(async () => { screen.getByText('Agendar cita').click() })
    expect(mock.post).toHaveBeenCalledWith('/appointments', expect.objectContaining({ clientId: '1', barberId: '1' }))
  })
})

// --- Clients ---
import AssistantClients from '../../pages/assistant/Clients'
describe('Assistant Clients', () => {
  it('renders with search and add button', async () => {
    mock.get.mockResolvedValue({ data: { clients: [] } })
    render(<AssistantClients />, { wrapper: assistantWrapper })
    await waitFor(() => expect(screen.getByText('Clientes')).toBeInTheDocument())
    expect(screen.getByLabelText('Buscar clientes')).toBeInTheDocument()
    expect(screen.getByText('+ Nuevo')).toBeInTheDocument()
  })

  it('toggles form and shows fields', async () => {
    mock.get.mockResolvedValue({ data: { clients: [] } })
    render(<AssistantClients />, { wrapper: assistantWrapper })
    await waitFor(() => expect(screen.getByText('Clientes')).toBeInTheDocument())

    await act(async () => { screen.getByText('+ Nuevo').click() })
    expect(screen.getByLabelText('Nombre del cliente')).toBeInTheDocument()
    expect(screen.getByLabelText('Correo electrónico')).toBeInTheDocument()
    expect(screen.getByLabelText('Teléfono')).toBeInTheDocument()
    expect(screen.getByLabelText('Contraseña')).toBeInTheDocument()
  })

  it('creates client via form', async () => {
    mock.get.mockResolvedValue({ data: { clients: [] } })
    mock.post.mockResolvedValue({ data: {} })
    render(<AssistantClients />, { wrapper: assistantWrapper })
    await waitFor(() => expect(screen.getByText('Clientes')).toBeInTheDocument())

    await act(async () => { screen.getByText('+ Nuevo').click() })
    await act(async () => {
      fireEvent.change(screen.getByLabelText('Nombre del cliente'), { target: { value: 'New Client' } })
      fireEvent.change(screen.getByLabelText('Correo electrónico'), { target: { value: 'nc@nc.com' } })
      fireEvent.change(screen.getByLabelText('Teléfono'), { target: { value: '123' } })
      fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'pass123' } })
      screen.getByText('Registrar cliente').click()
    })
    expect(mock.post).toHaveBeenCalledWith('/clients', expect.objectContaining({ name: 'New Client' }))
  })
})
