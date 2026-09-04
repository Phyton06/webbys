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

function clientWrapper({ children }: { children: React.ReactNode }) {
  localStorage.setItem('user', JSON.stringify({ id: '1', name: 'Client', role: 'CLIENT', email: 'c@c.com' }))
  return <MemoryRouter initialEntries={['/cliente']}>{children}</MemoryRouter>
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
})

// --- Client Barbers ---
import ClientBarbers from '../../pages/client/Barbers'
describe('Client Barbers', () => {
  it('renders empty state', async () => {
    mock.get.mockResolvedValue({ data: { barbers: [] } })
    render(<ClientBarbers />, { wrapper: clientWrapper })
    await waitFor(() => {
      expect(screen.getByText('Nuestros Barberos')).toBeInTheDocument()
      expect(screen.getByText('No hay barberos disponibles')).toBeInTheDocument()
    })
  })

  it('renders barber list with specialty fallback', async () => {
    mock.get.mockResolvedValue({ data: { barbers: [{ id: '1', name: 'Juan', specialty: '', phone: '555' }] } })
    render(<ClientBarbers />, { wrapper: clientWrapper })
    await waitFor(() => expect(screen.getByText('Juan')).toBeInTheDocument())
    expect(screen.getByText('Barbero general')).toBeInTheDocument()
  })
})

// --- Client MyAppointments ---
import ClientMyAppointments from '../../pages/client/MyAppointments'
describe('Client MyAppointments', () => {
  it('renders tabs and empty state', async () => {
    mock.get.mockResolvedValue({ data: [] })
    render(<ClientMyAppointments />, { wrapper: clientWrapper })
    await waitFor(() => expect(screen.getByText('Mis Citas')).toBeInTheDocument())
    expect(screen.getByText(/Próximas/)).toBeInTheDocument()
    expect(screen.getByText(/Anteriores/)).toBeInTheDocument()
  })

  it('shows cancel button for PENDING/CONFIRMED appointments', async () => {
    const today = new Date().toISOString().split('T')[0]
    mock.get.mockImplementation((url: string) => {
      if (url === '/appointments') return Promise.resolve({ data: [{ id: '1', barberName: 'Juan', serviceName: 'Corte', date: today, time: '10:00', status: 'PENDING' }] })
      return Promise.resolve({ data: [] })
    })
    render(<ClientMyAppointments />, { wrapper: clientWrapper })
    await waitFor(() => expect(screen.getByText('Cancelar cita')).toBeInTheDocument())
  })

  it('calls cancel endpoint', async () => {
    const today = new Date().toISOString().split('T')[0]
    mock.get.mockImplementation((url: string) => {
      if (url === '/appointments') return Promise.resolve({ data: [{ id: '1', barberName: 'Juan', serviceName: 'Corte', date: today, time: '10:00', status: 'CONFIRMED' }] })
      return Promise.resolve({ data: [] })
    })
    mock.put.mockResolvedValue({ data: {} })
    render(<ClientMyAppointments />, { wrapper: clientWrapper })
    await waitFor(() => expect(screen.getByText('Cancelar cita')).toBeInTheDocument())

    vi.spyOn(window, 'confirm').mockReturnValue(true)
    await act(async () => { screen.getByText('Cancelar cita').click() })
    expect(mock.put).toHaveBeenCalledWith('/appointments/1/status', { status: 'CANCELADA' })
  })
})

// --- BookAppointment ---
import BookAppointment from '../../pages/client/BookAppointment'
describe('Client BookAppointment', () => {
  it('renders first step with progress bar', async () => {
    mock.get.mockResolvedValue({ data: { barbers: [], services: [] } })
    render(<BookAppointment />, { wrapper: clientWrapper })
    await waitFor(() => expect(screen.getByText('Agendar Cita')).toBeInTheDocument())
    expect(screen.getByText('Selecciona un barbero')).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('progresses through steps when selecting barber', async () => {
    mock.get.mockResolvedValue({
      data: {
        barbers: [{ id: '1', name: 'Juan', specialty: 'Fade' }],
        services: [{ id: '1', name: 'Corte', price: 150, duration: 30 }],
      },
    })
    render(<BookAppointment />, { wrapper: clientWrapper })
    await waitFor(() => expect(screen.getByText('Juan')).toBeInTheDocument())

    await act(async () => { screen.getByText('Juan').click() })
    expect(screen.getByText('Selecciona una fecha')).toBeInTheDocument()
  })

  it('shows time slots after selecting barber and date', async () => {
    mock.get.mockImplementation((url: string) => {
      if (url.includes('/barbers')) return Promise.resolve({ data: { barbers: [{ id: '1', name: 'Juan', specialty: 'Fade' }] } })
      if (url.includes('/services')) return Promise.resolve({ data: { services: [] } })
      if (url.includes('/availability')) return Promise.resolve({ data: { slots: [{ time: '10:00', available: true }, { time: '11:00', available: false }] } })
      return Promise.resolve({ data: [] })
    })
    render(<BookAppointment />, { wrapper: clientWrapper })
    await waitFor(() => expect(screen.getByText('Juan')).toBeInTheDocument())

    await act(async () => { screen.getByText('Juan').click() })

    // Set date via input
    const dateInput = screen.getByLabelText('Fecha de la cita')
    await act(async () => {
      fireEvent.change(dateInput, { target: { value: '2026-09-05' } })
    })
    await act(async () => { screen.getByText('Siguiente').click() })

    await waitFor(() => expect(screen.getByText('10:00')).toBeInTheDocument())
  })

  it('navigates back through steps', async () => {
    mock.get.mockResolvedValue({
      data: {
        barbers: [{ id: '1', name: 'Juan', specialty: 'Fade' }],
        services: [],
      },
    })
    render(<BookAppointment />, { wrapper: clientWrapper })
    await waitFor(() => expect(screen.getByText('Juan')).toBeInTheDocument())

    // Step 1 → Step 2
    await act(async () => { screen.getByText('Juan').click() })
    expect(screen.getByText('Selecciona una fecha')).toBeInTheDocument()

    // Back button
    await act(async () => { screen.getByText('Atrás').click() })
    expect(screen.getByText('Selecciona un barbero')).toBeInTheDocument()
  })

  it('shows empty time slots message', async () => {
    mock.get.mockImplementation((url: string) => {
      if (url.includes('/barbers')) return Promise.resolve({ data: { barbers: [{ id: '1', name: 'Juan', specialty: 'Fade' }] } })
      if (url.includes('/services')) return Promise.resolve({ data: { services: [] } })
      if (url.includes('/availability')) return Promise.resolve({ data: { slots: [] } })
      return Promise.resolve({ data: [] })
    })
    render(<BookAppointment />, { wrapper: clientWrapper })
    await waitFor(() => expect(screen.getByText('Juan')).toBeInTheDocument())

    await act(async () => { screen.getByText('Juan').click() })
    const dateInput = screen.getByLabelText('Fecha de la cita')
    await act(async () => { fireEvent.change(dateInput, { target: { value: '2026-09-05' } }) })
    await act(async () => { screen.getByText('Siguiente').click() })

    await waitFor(() => expect(screen.getByText('No hay horarios disponibles')).toBeInTheDocument())
  })

  it('navigates to confirm with service selected', async () => {
    mock.get.mockImplementation((url: string) => {
      if (url.includes('/barbers')) return Promise.resolve({ data: { barbers: [{ id: '1', name: 'Juan', specialty: 'Fade' }] } })
      if (url.includes('/services')) return Promise.resolve({ data: { services: [{ id: '1', name: 'Corte', price: 150, duration: 30 }] } })
      if (url.includes('/availability')) return Promise.resolve({ data: { slots: [{ time: '10:00', available: true }] } })
      return Promise.resolve({ data: [] })
    })
    render(<BookAppointment />, { wrapper: clientWrapper })
    await waitFor(() => expect(screen.getByText('Juan')).toBeInTheDocument())

    // Step 1 → Step 2
    await act(async () => { screen.getByText('Juan').click() })
    // Step 2 → Step 3
    const dateInput = screen.getByLabelText('Fecha de la cita')
    await act(async () => { fireEvent.change(dateInput, { target: { value: '2026-09-05' } }) })
    await act(async () => { screen.getByText('Siguiente').click() })
    // Step 3: select time
    await waitFor(() => expect(screen.getByText('10:00')).toBeInTheDocument())
    await act(async () => { screen.getByText('10:00').click() })
    // Step 4: select service
    await act(async () => { screen.getByText('Corte').click() })
    // Step 5: confirm
    expect(screen.getByText('Resumen de tu cita')).toBeInTheDocument()
    expect(screen.getByText('Juan')).toBeInTheDocument()
    expect(screen.getByText('Corte ($150)')).toBeInTheDocument()
  })

  it('navigates back from confirm to service step', async () => {
    mock.get.mockImplementation((url: string) => {
      if (url.includes('/barbers')) return Promise.resolve({ data: { barbers: [{ id: '1', name: 'Juan', specialty: 'Fade' }] } })
      if (url.includes('/services')) return Promise.resolve({ data: { services: [] } })
      if (url.includes('/availability')) return Promise.resolve({ data: { slots: [{ time: '10:00', available: true }] } })
      return Promise.resolve({ data: [] })
    })
    render(<BookAppointment />, { wrapper: clientWrapper })
    await waitFor(() => expect(screen.getByText('Juan')).toBeInTheDocument())

    await act(async () => { screen.getByText('Juan').click() })
    const dateInput = screen.getByLabelText('Fecha de la cita')
    await act(async () => { fireEvent.change(dateInput, { target: { value: '2026-09-05' } }) })
    await act(async () => { screen.getByText('Siguiente').click() })
    await waitFor(() => expect(screen.getByText('10:00')).toBeInTheDocument())
    await act(async () => { screen.getByText('10:00').click() })
    // At service step, skip service
    await act(async () => { screen.getByText('Sin servicio, solo corte').click() })
    // At confirm step, back → service step
    await act(async () => { screen.getByText('Atrás').click() })
    expect(screen.getByText('Selecciona un servicio (opcional)')).toBeInTheDocument()
  })

  it('shows error on confirm failure', async () => {
    mock.get.mockImplementation((url: string) => {
      if (url.includes('/barbers')) return Promise.resolve({ data: { barbers: [{ id: '1', name: 'Juan', specialty: 'Fade' }] } })
      if (url.includes('/services')) return Promise.resolve({ data: { services: [] } })
      if (url.includes('/availability')) return Promise.resolve({ data: { slots: [{ time: '10:00', available: true }] } })
      return Promise.resolve({ data: [] })
    })
    mock.post.mockRejectedValue(new Error('fail'))
    render(<BookAppointment />, { wrapper: clientWrapper })
    await waitFor(() => expect(screen.getByText('Juan')).toBeInTheDocument())

    await act(async () => { screen.getByText('Juan').click() })
    const dateInput = screen.getByLabelText('Fecha de la cita')
    await act(async () => { fireEvent.change(dateInput, { target: { value: '2026-09-05' } }) })
    await act(async () => { screen.getByText('Siguiente').click() })
    await waitFor(() => expect(screen.getByText('10:00')).toBeInTheDocument())
    await act(async () => { screen.getByText('10:00').click() })
    await act(async () => { screen.getByText('Sin servicio, solo corte').click() })
    await act(async () => { screen.getByText('Confirmar').click() })
    await waitFor(() => expect(screen.getByText('Error al agendar la cita')).toBeInTheDocument())
  })
})
