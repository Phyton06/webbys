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

function barberWrapper({ children }: { children: React.ReactNode }) {
  localStorage.setItem('user', JSON.stringify({ id: '1', name: 'Barber', role: 'BARBER', email: 'b@b.com' }))
  return <MemoryRouter initialEntries={['/barbero']}>{children}</MemoryRouter>
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
})

// --- MyAppointments ---
import BarberMyAppointments from '../../pages/barber/MyAppointments'
describe('Barber MyAppointments', () => {
  it('renders empty state', async () => {
    mock.get.mockResolvedValue({ data: [] })
    render(<BarberMyAppointments />, { wrapper: barberWrapper })
    await waitFor(() => expect(screen.getByText('Mis Citas')).toBeInTheDocument())
    expect(screen.getByLabelText('Filtrar por fecha')).toBeInTheDocument()
  })

  it('shows confirm/cancel buttons for CONFIRMADA appointments', async () => {
    const today = new Date().toISOString().split('T')[0]
    mock.get.mockImplementation((url) => {
      if (url === '/appointments') return Promise.resolve({ data: [{ id: '1', clientName: 'Maria', serviceName: 'Corte', date: today, time: '10:00', status: 'CONFIRMED' }] })
      return Promise.resolve({ data: [] })
    })
    render(<BarberMyAppointments />, { wrapper: barberWrapper })
    await waitFor(() => expect(screen.getByText('Iniciar')).toBeInTheDocument())
    expect(screen.getByText('Cancelar')).toBeInTheDocument()
  })

  it('shows complete button for EN_CURSO appointments', async () => {
    const today = new Date().toISOString().split('T')[0]
    mock.get.mockImplementation((url) => {
      if (url === '/appointments') return Promise.resolve({ data: [{ id: '1', clientName: 'Maria', serviceName: 'Corte', date: today, time: '10:00', status: 'IN_PROGRESS' }] })
      return Promise.resolve({ data: [] })
    })
    render(<BarberMyAppointments />, { wrapper: barberWrapper })
    await waitFor(() => expect(screen.getByText('Completar')).toBeInTheDocument())
  })

  it('calls updateStatus on Iniciar click', async () => {
    const today = new Date().toISOString().split('T')[0]
    mock.get.mockImplementation((url) => {
      if (url === '/appointments') return Promise.resolve({ data: [{ id: '1', clientName: 'Maria', serviceName: 'Corte', date: today, time: '10:00', status: 'CONFIRMED' }] })
      return Promise.resolve({ data: [] })
    })
    mock.put.mockResolvedValue({ data: {} })
    render(<BarberMyAppointments />, { wrapper: barberWrapper })
    await waitFor(() => expect(screen.getByText('Iniciar')).toBeInTheDocument())
    await act(async () => { screen.getByText('Iniciar').click() })
    expect(mock.put).toHaveBeenCalledWith('/appointments/1/status', { status: 'EN_CURSO' })
  })
})

// --- MyProfile ---
import BarberMyProfile from '../../pages/barber/MyProfile'
describe('Barber MyProfile', () => {
  it('renders profile form with user data', async () => {
    mock.get.mockResolvedValue({ data: { user: { name: 'Test', phone: '555', specialty: 'Fade' } } })
    render(<BarberMyProfile />, { wrapper: barberWrapper })
    await waitFor(() => {
      expect(screen.getByText('Mi Perfil')).toBeInTheDocument()
      expect(screen.getByLabelText('Nombre')).toHaveValue('Test')
      expect(screen.getByLabelText('Teléfono')).toHaveValue('555')
      expect(screen.getByLabelText('Especialidad')).toHaveValue('Fade')
    })
  })

  it('saves profile and shows success message', async () => {
    mock.get.mockResolvedValue({ data: { user: { id: '1', name: 'Test', phone: '555', specialty: 'Fade' } } })
    mock.put.mockResolvedValue({ data: {} })
    render(<BarberMyProfile />, { wrapper: barberWrapper })
    await waitFor(() => expect(screen.getByText('Mi Perfil')).toBeInTheDocument())

    await act(async () => {
      fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Updated' } })
      screen.getByText('Guardar cambios').click()
    })
    expect(mock.put).toHaveBeenCalledWith('/barbers/1', expect.objectContaining({ name: 'Updated' }))
    await waitFor(() => expect(screen.getByText('Perfil actualizado')).toBeInTheDocument())
  })

  it('shows error message on save failure', async () => {
    mock.get.mockResolvedValue({ data: { user: { id: '1', name: 'Test', phone: '555', specialty: 'Fade' } } })
    mock.put.mockRejectedValue(new Error('fail'))
    render(<BarberMyProfile />, { wrapper: barberWrapper })
    await waitFor(() => expect(screen.getByText('Mi Perfil')).toBeInTheDocument())

    await act(async () => { screen.getByText('Guardar cambios').click() })
    await waitFor(() => expect(screen.getByText('Error al guardar')).toBeInTheDocument())
  })
})

// --- MySchedule ---
import BarberMySchedule from '../../pages/barber/MySchedule'
describe('Barber MySchedule', () => {
  it('renders all 7 days', async () => {
    mock.get.mockResolvedValue({ data: { user: { id: '1' } } })
    render(<BarberMySchedule />, { wrapper: barberWrapper })
    await waitFor(() => expect(screen.getByText('Mi Horario')).toBeInTheDocument())
    expect(screen.getByText('Lunes')).toBeInTheDocument()
    expect(screen.getByText('Martes')).toBeInTheDocument()
    expect(screen.getByText('Miércoles')).toBeInTheDocument()
    expect(screen.getByText('Jueves')).toBeInTheDocument()
    expect(screen.getByText('Viernes')).toBeInTheDocument()
    expect(screen.getByText('Sábado')).toBeInTheDocument()
    expect(screen.getByText('Domingo')).toBeInTheDocument()
  })

  it('toggles day active and shows time inputs', async () => {
    mock.get.mockResolvedValue({ data: { user: { id: '1' } } })
    render(<BarberMySchedule />, { wrapper: barberWrapper })
    await waitFor(() => expect(screen.getByText('Lunes')).toBeInTheDocument())

    // Click the first toggle button (Lunes)
    const toggleButtons = document.querySelectorAll('button.w-12')
    await act(async () => { toggleButtons[0].click() })

    expect(screen.getByLabelText('Hora de inicio Lunes')).toBeInTheDocument()
    expect(screen.getByLabelText('Hora de fin Lunes')).toBeInTheDocument()
  })

  it('saves schedule', async () => {
    mock.get.mockResolvedValue({ data: { user: { id: '1' } } })
    mock.put.mockResolvedValue({ data: {} })
    render(<BarberMySchedule />, { wrapper: barberWrapper })
    await waitFor(() => expect(screen.getByText('Guardar horario')).toBeInTheDocument())

    await act(async () => { screen.getByText('Guardar horario').click() })
    expect(mock.put).toHaveBeenCalledWith('/barbers/1/schedule', expect.objectContaining({ schedule: expect.any(Array) }))
  })
})
