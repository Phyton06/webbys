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
  it('renders heading and settings tabs after loading', async () => {
    mock.get.mockImplementation((url: string) => {
      if (url === '/settings') {
        return Promise.resolve({
          data: {
            business: {
              name: "Webby's Barbershop",
              address: 'Av. Principal 123',
              phone: '5551234567',
              email: 'contacto@webbys.com',
              openingHours: {},
              timezone: 'America/Mexico_City',
              currency: 'MXN',
            },
            roles: [],
            branding: {
              primaryColor: '#00BCD4',
              secondaryColor: '#1a1a2e',
              welcomeMessage: "Bienvenido",
            },
          }
        })
      }
      return Promise.resolve({ data: [] })
    })

    render(<Settings />, { wrapper: adminWrapper })
    expect(screen.getByText('Configuración')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText('Datos de Negocio')).toBeInTheDocument()
    })
  })
})

// --- Dashboard ---
import Dashboard from '../../pages/admin/Dashboard'
describe('Admin Dashboard', () => {
  it('shows single Ingresos Semanales hero card and no redundant stat cards', async () => {
    mock.get.mockResolvedValue({ data: [] })
    render(<Dashboard />, { wrapper: adminWrapper })
    await waitFor(() => expect(screen.getByText('Dashboard')).toBeInTheDocument())
    expect(screen.getByText('Ingresos Semanales')).toBeInTheDocument()
    expect(screen.queryByText('Citas hoy')).not.toBeInTheDocument()
    expect(screen.queryByText('Pendientes')).not.toBeInTheDocument()
    expect(screen.queryByText('Esta semana')).not.toBeInTheDocument()
    expect(screen.queryByText('Barberos activos')).not.toBeInTheDocument()
  })

  it('renders native SVG revenue trend chart with 7 day labels (Lun to Dom)', async () => {
    mock.get.mockResolvedValue({ data: [] })
    render(<Dashboard />, { wrapper: adminWrapper })
    await waitFor(() => expect(screen.getByTestId('revenue-svg')).toBeInTheDocument())
    expect(screen.getByText('Lun')).toBeInTheDocument()
    expect(screen.getByText('Mar')).toBeInTheDocument()
    expect(screen.getByText('Mié')).toBeInTheDocument()
    expect(screen.getByText('Jue')).toBeInTheDocument()
    expect(screen.getByText('Vie')).toBeInTheDocument()
    expect(screen.getByText('Sáb')).toBeInTheDocument()
    expect(screen.getByText('Dom')).toBeInTheDocument()
  })

  it('displays computed weekly revenue and positive trend badge when revenue exists', async () => {
    mock.get.mockImplementation((url: string) => {
      if (url === '/appointments') {
        return Promise.resolve({
          data: [
            { id: '1', date: '2026-09-01', status: 'COMPLETADA', amount: 12500 },
          ],
        })
      }
      return Promise.resolve({ data: [] })
    })
    render(<Dashboard />, { wrapper: adminWrapper })
    await waitFor(() => expect(screen.getByText('$12,500')).toBeInTheDocument())
    expect(screen.getByTestId('revenue-trend-badge')).toHaveTextContent('+15%')
  })

  it('shows graceful fallback on zero revenue ($0 and 0% badge)', async () => {
    mock.get.mockResolvedValue({ data: [] })
    render(<Dashboard />, { wrapper: adminWrapper })
    await waitFor(() => expect(screen.getByText('$0')).toBeInTheDocument())
    expect(screen.getByTestId('revenue-trend-badge')).toHaveTextContent('0%')
  })

  it('shows empty state when no appointments today', async () => {
    mock.get.mockResolvedValue({ data: [] })
    render(<Dashboard />, { wrapper: adminWrapper })
    await waitFor(() => expect(screen.getByText('No hay citas programadas para hoy')).toBeInTheDocument())
  })

  it('renders appointment cards when data exists for today', async () => {
    const today = new Date().toISOString().split('T')[0]
    mock.get.mockImplementation((url: string) => {
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

  it('renders barber cards with active/inactive badges and action buttons', async () => {
    mock.get.mockResolvedValue({ data: { barbers: [{ id: '1', name: 'Juan', email: 'j@j.com', phone: '555', active: true }, { id: '2', name: 'Pedro', email: 'p@p.com', phone: '666', active: false }] } })
    render(<Barbers />, { wrapper: adminWrapper })
    await waitFor(() => {
      expect(screen.getByText('Juan')).toBeInTheDocument()
      expect(screen.getByText('Pedro')).toBeInTheDocument()
    })
    expect(screen.getByText('Activo')).toBeInTheDocument()
    expect(screen.getByText('Inactivo')).toBeInTheDocument()
    expect(screen.getByText('Desactivar')).toBeInTheDocument()
    expect(screen.getByText('Reactivar')).toBeInTheDocument()
  })

  it('toggles form and submits new barber without specialty field', async () => {
    mock.get.mockResolvedValue({ data: { barbers: [] } })
    mock.post.mockResolvedValue({ data: {} })
    render(<Barbers />, { wrapper: adminWrapper })
    await waitFor(() => expect(screen.getByText('Barberos')).toBeInTheDocument())

    await act(async () => { screen.getByText('+ Nuevo').click() })
    expect(screen.getByLabelText('Nombre')).toBeInTheDocument()
    expect(screen.getByLabelText('Correo')).toBeInTheDocument()
    expect(screen.getByLabelText('Teléfono')).toBeInTheDocument()
    expect(screen.queryByLabelText('Especialidad')).not.toBeInTheDocument()

    await act(async () => {
      fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Test' } })
      fireEvent.change(screen.getByLabelText('Correo'), { target: { value: 't@t.com' } })
      fireEvent.change(screen.getByLabelText('Teléfono'), { target: { value: '123' } })
      screen.getByText('Guardar').click()
    })
    expect(mock.post).toHaveBeenCalledWith('/barbers', expect.objectContaining({ name: 'Test', email: 't@t.com', phone: '123' }))
  })

  it('toggles barber active status when clicking action button', async () => {
    mock.get.mockResolvedValue({ data: { barbers: [{ id: '1', name: 'Juan', email: 'j@j.com', phone: '555', active: true }] } })
    mock.put.mockResolvedValue({ data: {} })
    render(<Barbers />, { wrapper: adminWrapper })
    await waitFor(() => expect(screen.getByText('Desactivar')).toBeInTheDocument())

    await act(async () => {
      screen.getByText('Desactivar').click()
    })
    expect(mock.put).toHaveBeenCalledWith('/barbers/1', expect.objectContaining({ active: false }))
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
  it('renders with filter buttons and native date picker', async () => {
    mock.get.mockResolvedValue({ data: [] })
    render(<AdminAppointments />, { wrapper: adminWrapper })
    await waitFor(() => expect(screen.getByText('Citas')).toBeInTheDocument())
    expect(screen.getByText('Todas')).toBeInTheDocument()
    expect(screen.getByLabelText('Filtrar por fecha')).toBeInTheDocument()
    expect(screen.getByText('No hay citas')).toBeInTheDocument()
  })

  it('renders appointments and filters by status and date', async () => {
    const sampleAppts = [
      { id: '1', clientName: 'Ana', barberName: 'B1', serviceName: 'S1', date: '2026-09-05', time: '10:00', status: 'CONFIRMED' },
      { id: '2', clientName: 'Carlos', barberName: 'B1', serviceName: 'S1', date: '2026-09-06', time: '11:00', status: 'PENDING' },
    ]
    mock.get.mockImplementation((url: string) => {
      if (url === '/appointments') return Promise.resolve({ data: sampleAppts })
      return Promise.resolve({ data: [] })
    })
    render(<AdminAppointments />, { wrapper: adminWrapper })
    await waitFor(() => {
      expect(screen.getByText('Ana')).toBeInTheDocument()
      expect(screen.getByText('Carlos')).toBeInTheDocument()
    })

    // Filter by specific date
    await act(async () => {
      fireEvent.change(screen.getByLabelText('Filtrar por fecha'), { target: { value: '2026-09-05' } })
    })
    expect(screen.getByText('Ana')).toBeInTheDocument()
    expect(screen.queryByText('Carlos')).not.toBeInTheDocument()

    // Clear date filter
    await act(async () => {
      screen.getByLabelText('Limpiar fecha').click()
    })
    expect(screen.getByText('Ana')).toBeInTheDocument()
    expect(screen.getByText('Carlos')).toBeInTheDocument()
  })

  it('shows empty state when no appointments match selected date', async () => {
    const sampleAppts = [
      { id: '1', clientName: 'Ana', barberName: 'B1', serviceName: 'S1', date: '2026-09-05', time: '10:00', status: 'CONFIRMED' },
    ]
    mock.get.mockImplementation((url: string) => {
      if (url === '/appointments') return Promise.resolve({ data: sampleAppts })
      return Promise.resolve({ data: [] })
    })
    render(<AdminAppointments />, { wrapper: adminWrapper })
    await waitFor(() => expect(screen.getByText('Ana')).toBeInTheDocument())

    await act(async () => {
      fireEvent.change(screen.getByLabelText('Filtrar por fecha'), { target: { value: '2026-09-20' } })
    })
    expect(screen.getByText('No hay citas para esta fecha')).toBeInTheDocument()
  })

  it('combines status and date filtering', async () => {
    const sampleAppts = [
      { id: '1', clientName: 'Ana', barberName: 'B1', serviceName: 'S1', date: '2026-09-05', time: '10:00', status: 'CONFIRMED' },
      { id: '2', clientName: 'Pedro', barberName: 'B1', serviceName: 'S1', date: '2026-09-05', time: '11:00', status: 'PENDING' },
    ]
    mock.get.mockImplementation((url: string) => {
      if (url === '/appointments') return Promise.resolve({ data: sampleAppts })
      return Promise.resolve({ data: [] })
    })
    render(<AdminAppointments />, { wrapper: adminWrapper })
    await waitFor(() => expect(screen.getByText('Ana')).toBeInTheDocument())

    // Filter by date AND status 'Confirmada'
    await act(async () => {
      fireEvent.change(screen.getByLabelText('Filtrar por fecha'), { target: { value: '2026-09-05' } })
      screen.getByRole('button', { name: 'Confirmada' }).click()
    })
    expect(screen.getByText('Ana')).toBeInTheDocument()
    expect(screen.queryByText('Pedro')).not.toBeInTheDocument()
  })
})
