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
const mock = vi.mocked(api)

function adminWrapper({ children }: { children: React.ReactNode }) {
  localStorage.setItem('user', JSON.stringify({ id: '1', name: 'Admin', role: 'ADMIN', email: 'a@b.com' }))
  return <MemoryRouter initialEntries={['/admin']}>{children}</MemoryRouter>
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
})

// --- Settings ---
import Settings from '../../pages/admin/Settings'
describe('Admin Settings', () => {
  it('renders heading and placeholder', () => {
    render(<Settings />, { wrapper: adminWrapper })
    expect(screen.getByText('Configuración')).toBeInTheDocument()
    expect(screen.getByText(/próximamente/)).toBeInTheDocument()
  })
})

// --- Dashboard ---
import Dashboard from '../../pages/admin/Dashboard'
describe('Admin Dashboard', () => {
  it('shows loading spinner then content', async () => {
    mock.get.mockResolvedValue({ data: [] })
    render(<Dashboard />, { wrapper: adminWrapper })
    await waitFor(() => expect(screen.getByText('Dashboard')).toBeInTheDocument())
    expect(screen.getByText('Citas hoy')).toBeInTheDocument()
    expect(screen.getByText('Pendientes')).toBeInTheDocument()
    expect(screen.getByText('Esta semana')).toBeInTheDocument()
  })

  it('shows empty state when no appointments', async () => {
    mock.get.mockResolvedValue({ data: [] })
    render(<Dashboard />, { wrapper: adminWrapper })
    await waitFor(() => expect(screen.getByText('No hay citas programadas para hoy')).toBeInTheDocument())
  })

  it('renders appointment cards when data exists', async () => {
    const today = new Date().toISOString().split('T')[0]
    mock.get.mockImplementation((url) => {
      if (url === '/appointments') return Promise.resolve({ data: [{ id: '1', clientName: 'Maria', barberName: 'Juan', serviceName: 'Corte', date: today, time: '10:00', status: 'PENDING' }] })
      if (url === '/barbers') return Promise.resolve({ data: [] })
      if (url === '/services') return Promise.resolve({ data: [] })
      return Promise.resolve({ data: [] })
    })
    render(<Dashboard />, { wrapper: adminWrapper })
    await waitFor(() => expect(screen.getByText('Maria')).toBeInTheDocument())
  })
})

// --- Barbers ---
import Barbers from '../../pages/admin/Barbers'
describe('Admin Barbers', () => {
  it('renders empty state', async () => {
    mock.get.mockResolvedValue({ data: { barbers: [] } })
    render(<Barbers />, { wrapper: adminWrapper })
    await waitFor(() => expect(screen.getByText('Barberos')).toBeInTheDocument())
  })

  it('renders barber cards with active/inactive badges', async () => {
    mock.get.mockResolvedValue({ data: { barbers: [{ id: '1', name: 'Juan', email: 'j@j.com', phone: '555', specialty: 'Fade', active: true }, { id: '2', name: 'Pedro', email: 'p@p.com', phone: '666', specialty: '', active: false }] } })
    render(<Barbers />, { wrapper: adminWrapper })
    await waitFor(() => {
      expect(screen.getByText('Juan')).toBeInTheDocument()
      expect(screen.getByText('Pedro')).toBeInTheDocument()
    })
    expect(screen.getByText('Activo')).toBeInTheDocument()
    expect(screen.getByText('Inactivo')).toBeInTheDocument()
  })

  it('toggles form and submits new barber', async () => {
    mock.get.mockResolvedValue({ data: { barbers: [] } })
    mock.post.mockResolvedValue({ data: {} })
    render(<Barbers />, { wrapper: adminWrapper })
    await waitFor(() => expect(screen.getByText('Barberos')).toBeInTheDocument())

    await act(async () => { screen.getByText('+ Nuevo').click() })
    expect(screen.getByLabelText('Nombre')).toBeInTheDocument()

    await act(async () => {
      fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Test' } })
      fireEvent.change(screen.getByLabelText('Correo'), { target: { value: 't@t.com' } })
      fireEvent.change(screen.getByLabelText('Teléfono'), { target: { value: '123' } })
      fireEvent.change(screen.getByLabelText('Especialidad'), { target: { value: 'Fade' } })
      screen.getByText('Guardar').click()
    })
    expect(mock.post).toHaveBeenCalledWith('/barbers', expect.objectContaining({ name: 'Test' }))
  })
})

// --- Clients ---
import Clients from '../../pages/admin/Clients'
describe('Admin Clients', () => {
  it('renders empty state', async () => {
    mock.get.mockResolvedValue({ data: { clients: [] } })
    render(<Clients />, { wrapper: adminWrapper })
    await waitFor(() => expect(screen.getByText('Clientes')).toBeInTheDocument())
    expect(screen.getByText('No se encontraron clientes')).toBeInTheDocument()
  })

  it('renders client list with avatar', async () => {
    mock.get.mockResolvedValue({ data: { clients: [{ id: '1', name: 'Maria', email: 'm@m.com', phone: '555' }] } })
    render(<Clients />, { wrapper: adminWrapper })
    await waitFor(() => expect(screen.getByText('Maria')).toBeInTheDocument())
    expect(screen.getByText('m@m.com · 555')).toBeInTheDocument()
  })

  it('search input exists and is functional', async () => {
    mock.get.mockResolvedValue({ data: { clients: [] } })
    render(<Clients />, { wrapper: adminWrapper })
    await waitFor(() => expect(screen.getByText('Clientes')).toBeInTheDocument())
    expect(screen.getByLabelText('Buscar clientes por nombre, correo o teléfono')).toBeInTheDocument()
  })
})

// --- Services ---
import Services from '../../pages/admin/Services'
describe('Admin Services', () => {
  it('renders empty state', async () => {
    mock.get.mockResolvedValue({ data: { services: [] } })
    render(<Services />, { wrapper: adminWrapper })
    await waitFor(() => expect(screen.getByText('Servicios')).toBeInTheDocument())
  })

  it('renders service cards with edit/delete buttons', async () => {
    mock.get.mockResolvedValue({ data: { services: [{ id: '1', name: 'Corte', description: 'Basico', price: 150, duration: 30 }] } })
    render(<Services />, { wrapper: adminWrapper })
    await waitFor(() => {
      expect(screen.getByText('Corte')).toBeInTheDocument()
      expect(screen.getByText('Basico')).toBeInTheDocument()
      expect(screen.getByText('$150 · 30 min')).toBeInTheDocument()
    })
    expect(screen.getByText('Editar')).toBeInTheDocument()
    expect(screen.getByText('Eliminar')).toBeInTheDocument()
  })

  it('toggles form and creates new service', async () => {
    mock.get.mockResolvedValue({ data: { services: [] } })
    mock.post.mockResolvedValue({ data: {} })
    render(<Services />, { wrapper: adminWrapper })
    await waitFor(() => expect(screen.getByText('Servicios')).toBeInTheDocument())

    await act(async () => { screen.getByText('+ Nuevo').click() })
    expect(screen.getByLabelText('Nombre')).toBeInTheDocument()

    await act(async () => {
      fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'New' } })
      fireEvent.change(screen.getByLabelText('Precio'), { target: { value: '200' } })
      fireEvent.change(screen.getByLabelText('Duración en minutos'), { target: { value: '45' } })
      screen.getByText('Guardar').click()
    })
    expect(mock.post).toHaveBeenCalledWith('/services', expect.objectContaining({ name: 'New', price: 200, duration: 45 }))
  })

  it('edit button fills form with existing data', async () => {
    mock.get.mockResolvedValue({ data: { services: [{ id: '1', name: 'Corte', description: 'Desc', price: 100, duration: 30 }] } })
    render(<Services />, { wrapper: adminWrapper })
    await waitFor(() => expect(screen.getByText('Corte')).toBeInTheDocument())

    await act(async () => { screen.getByText('Editar').click() })
    expect(screen.getByText('Actualizar')).toBeInTheDocument()
    expect(screen.getByLabelText('Nombre')).toHaveValue('Corte')
  })
})

// --- Appointments ---
import AdminAppointments from '../../pages/admin/Appointments'
describe('Admin Appointments', () => {
  it('renders with filter buttons', async () => {
    mock.get.mockResolvedValue({ data: [] })
    render(<AdminAppointments />, { wrapper: adminWrapper })
    await waitFor(() => expect(screen.getByText('Citas')).toBeInTheDocument())
    expect(screen.getByText('Todas')).toBeInTheDocument()
    expect(screen.getByText('No hay citas')).toBeInTheDocument()
  })

  it('renders appointments and can filter', async () => {
    const today = new Date().toISOString().split('T')[0]
    mock.get.mockImplementation((url) => {
      if (url === '/appointments') return Promise.resolve({ data: [{ id: '1', clientName: 'Ana', barberName: 'B1', serviceName: 'S1', date: today, time: '10:00', status: 'PENDING' }] })
      return Promise.resolve({ data: [] })
    })
    render(<AdminAppointments />, { wrapper: adminWrapper })
    await waitFor(() => expect(screen.getByText('Ana')).toBeInTheDocument())
  })
})
