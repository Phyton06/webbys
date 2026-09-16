import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
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
    // Dashboard renders 3 StatCards, each with a revenue-trend-badge — grab the first one
    const badges = screen.getAllByTestId('revenue-trend-badge')
    expect(badges[0]).toHaveTextContent('+15%')
  })

  it('shows graceful fallback on zero revenue ($0 and 0% badge)', async () => {
    mock.get.mockResolvedValue({ data: [] })
    render(<Dashboard />, { wrapper: adminWrapper })
    await waitFor(() => expect(screen.getByText('$0')).toBeInTheDocument())
    const badges = screen.getAllByTestId('revenue-trend-badge')
    expect(badges[0]).toHaveTextContent('0%')
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
    // Empty state renders in both mobile and desktop divs
    expect(screen.getAllByText('No hay barberos').length).toBeGreaterThanOrEqual(1)
  })

  it('renders barber list with active/inactive badges', async () => {
    mock.get.mockResolvedValue({ data: { barbers: [{ id: '1', name: 'Juan', email: 'j@j.com', phone: '555', active: true }, { id: '2', name: 'Pedro', email: 'p@p.com', phone: '666', active: false }] } })
    render(<Barbers />, { wrapper: adminWrapper })
    await waitFor(() => {
      expect(screen.getAllByText('Juan').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('Pedro').length).toBeGreaterThanOrEqual(1)
    })
    // Activo/Inactivo badges appear in mobile cards + desktop table
    expect(screen.getAllByText('Activo').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Inactivo').length).toBeGreaterThanOrEqual(1)
  })

  it('has a search input for barbers', async () => {
    mock.get.mockResolvedValue({ data: { barbers: [] } })
    render(<Barbers />, { wrapper: adminWrapper })
    await waitFor(() => expect(screen.getByText('Barberos')).toBeInTheDocument())
    expect(screen.getByRole('textbox', { name: /buscar barberos/i })).toBeInTheDocument()
  })
})

// --- BarberDetail ---
import BarberDetail from '../../pages/admin/BarberDetail'
import { Routes, Route } from 'react-router-dom'
describe('Admin BarberDetail', () => {
  it('loads barber profile details and registers toggle active status', async () => {
    mock.get.mockImplementation((url: string) => {
      if (url === '/barbers') {
        return Promise.resolve({ data: { barbers: [{ id: '1', name: 'Juan', email: 'j@j.com', phone: '555', active: true }] } })
      }
      if (url === '/appointments') {
        return Promise.resolve({ data: [] })
      }
      return Promise.resolve({ data: [] })
    })
    mock.put.mockResolvedValue({ data: {} })

    localStorage.setItem('user', JSON.stringify({ id: '1', name: 'Admin', role: 'ADMIN', email: 'a@b.com' }))
    render(
      <MemoryRouter initialEntries={['/admin/barbers/1']}>
        <Routes>
          <Route path="/admin/barbers/:id" element={<BarberDetail />} />
        </Routes>
      </MemoryRouter>
    )
    await waitFor(() => {
      expect(screen.getByText('Ficha de Barbero')).toBeInTheDocument()
      expect(screen.getByText('Juan')).toBeInTheDocument()
      expect(screen.getByText('j@j.com')).toBeInTheDocument()
      expect(screen.getByText('555')).toBeInTheDocument()
    })

    await fireEvent.click(screen.getByText('Desactivar Barbero'))
    expect(screen.getByText('¿Estás seguro de que deseas desactivar a este barbero? No podrá recibir nuevos turnos.')).toBeInTheDocument()
    
    await fireEvent.click(screen.getByText('Confirmar'))
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
    expect(screen.getAllByText('No hay clientes').length).toBeGreaterThanOrEqual(1)
  })

  it('renders client list', async () => {
    mock.get.mockResolvedValue({ data: { clients: [{ id: '1', name: 'Maria', email: 'm@m.com', phone: '555' }] } })
    render(<Clients />, { wrapper: adminWrapper })
    await waitFor(() => expect(screen.getAllByText('Maria').length).toBeGreaterThanOrEqual(1))
    expect(screen.getAllByText('m@m.com').length).toBeGreaterThanOrEqual(1)
  })

  it('has a search input for clients', async () => {
    mock.get.mockResolvedValue({ data: { clients: [{ id: '1', name: 'Maria', email: 'm@m.com', phone: '555' }] } })
    render(<Clients />, { wrapper: adminWrapper })
    await waitFor(() => expect(screen.getAllByText('Maria').length).toBeGreaterThanOrEqual(1))
    expect(screen.getByRole('textbox', { name: /buscar clientes/i })).toBeInTheDocument()
  })
})

// --- Services ---
import Services from '../../pages/admin/Services'
describe('Admin Services', () => {
  it('renders empty state', async () => {
    mock.get.mockResolvedValue({ data: { services: [] } })
    render(<Services />, { wrapper: adminWrapper })
    await waitFor(() => expect(screen.getByText('Servicios')).toBeInTheDocument())
    expect(screen.getAllByText('No hay servicios').length).toBeGreaterThanOrEqual(1)
  })

  it('renders service list with name, price, and duration', async () => {
    mock.get.mockResolvedValue({ data: { services: [{ id: '1', name: 'Corte', description: 'Basico', price: 150, duration: 30 }] } })
    render(<Services />, { wrapper: adminWrapper })
    await waitFor(() => {
      expect(screen.getAllByText('Corte').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('Basico').length).toBeGreaterThanOrEqual(1)
    })
    expect(screen.getAllByText('$150').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('30 min').length).toBeGreaterThanOrEqual(1)
  })

  it('has a search input for services', async () => {
    mock.get.mockResolvedValue({ data: { services: [] } })
    render(<Services />, { wrapper: adminWrapper })
    await waitFor(() => expect(screen.getByText('Servicios')).toBeInTheDocument())
    expect(screen.getByRole('textbox', { name: /buscar servicios/i })).toBeInTheDocument()
  })
})

// --- Appointments ---
import AdminAppointments from '../../pages/admin/Appointments'
describe('Admin Appointments', () => {
  it('renders heading and empty state', async () => {
    mock.get.mockImplementation((url: string) => {
      if (url === '/appointments') return Promise.resolve({ data: { appointments: [] } })
      return Promise.resolve({ data: [] })
    })
    render(<AdminAppointments />, { wrapper: adminWrapper })
    await waitFor(() => expect(screen.getByText('Citas')).toBeInTheDocument())
    expect(screen.getAllByText('No hay citas').length).toBeGreaterThanOrEqual(1)
  })

  it('renders appointment list with client and barber names', async () => {
    const sampleAppts = [
      { id: '1', clientName: 'Ana', barberName: 'B1', serviceName: 'S1', date: '2026-09-05', time: '10:00', status: 'CONFIRMED' },
      { id: '2', clientName: 'Carlos', barberName: 'B1', serviceName: 'S1', date: '2026-09-06', time: '11:00', status: 'PENDING' },
    ]
    mock.get.mockImplementation((url: string) => {
      if (url === '/appointments') return Promise.resolve({ data: { appointments: sampleAppts } })
      return Promise.resolve({ data: [] })
    })
    render(<AdminAppointments />, { wrapper: adminWrapper })
    await waitFor(() => {
      expect(screen.getAllByText('Ana').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('Carlos').length).toBeGreaterThanOrEqual(1)
    })
  })

  it('has a search input for appointments', async () => {
    mock.get.mockImplementation((url: string) => {
      if (url === '/appointments') return Promise.resolve({ data: { appointments: [] } })
      return Promise.resolve({ data: [] })
    })
    render(<AdminAppointments />, { wrapper: adminWrapper })
    await waitFor(() => expect(screen.getByText('Citas')).toBeInTheDocument())
    expect(screen.getByRole('textbox', { name: /buscar citas/i })).toBeInTheDocument()
  })

  it('search filters appointments by name', async () => {
    const sampleAppts = [
      { id: '1', clientName: 'Ana', barberName: 'B1', serviceName: 'S1', date: '2026-09-05', time: '10:00', status: 'CONFIRMED' },
      { id: '2', clientName: 'Carlos', barberName: 'B1', serviceName: 'S1', date: '2026-09-06', time: '11:00', status: 'PENDING' },
    ]
    mock.get.mockImplementation((url: string) => {
      if (url === '/appointments') return Promise.resolve({ data: { appointments: sampleAppts } })
      return Promise.resolve({ data: [] })
    })
    render(<AdminAppointments />, { wrapper: adminWrapper })
    await waitFor(() => {
      expect(screen.getAllByText('Ana').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('Carlos').length).toBeGreaterThanOrEqual(1)
    })

    const searchInput = screen.getByRole('textbox', { name: /buscar citas/i })
    fireEvent.change(searchInput, { target: { value: 'Ana' } })

    expect(screen.getAllByText('Ana').length).toBeGreaterThanOrEqual(1)
    expect(screen.queryAllByText('Carlos').length).toBe(0)
  })
})
