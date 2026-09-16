import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Campaigns from '../../../pages/admin/Campaigns'

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
    <MemoryRouter initialEntries={['/admin/campanas']}>
      <Campaigns />
    </MemoryRouter>
  )
}

const mockCampaignsData = [
  {
    id: 'c1',
    name: 'Bienvenida Nuevos Clientes',
    description: 'Cupón de bienvenida',
    type: 'REFERRAL',
    status: 'ACTIVE',
    channel: 'WHATSAPP',
    discountPercent: 10,
    startDate: '2026-09-01',
    endDate: '2026-12-31',
    stats: { sent: 25, opened: 20, converted: 8, revenue: 1600 },
  },
  {
    id: 'c2',
    name: 'Happy Hour Viernes',
    description: '20% descuento los viernes',
    type: 'PROMOTION',
    status: 'PAUSED',
    channel: 'SMS',
    discountPercent: 20,
    startDate: '2026-09-01',
    endDate: '2026-09-30',
    stats: { sent: 100, opened: 60, converted: 15, revenue: 3000 },
  },
]

describe('Admin Campaigns Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockApi.get.mockImplementation((url: string) => {
      if (url === '/campaigns') return Promise.resolve({ data: mockCampaignsData })
      return Promise.resolve({ data: [] })
    })
  })

  it('renders heading, stat cards, and campaign cards', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Campañas y Promociones/i })).toBeInTheDocument()
    })

    // Stat cards
    expect(screen.getByText('Total')).toBeInTheDocument()
    expect(screen.getByText('Activas')).toBeInTheDocument()

    // Campaign names
    expect(screen.getByText('Bienvenida Nuevos Clientes')).toBeInTheDocument()
    expect(screen.getByText('Happy Hour Viernes')).toBeInTheDocument()

    // Status badges
    expect(screen.getByText('Activa')).toBeInTheDocument()
    expect(screen.getByText('Pausada')).toBeInTheDocument()
  })

  it('searches campaigns by name', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Bienvenida Nuevos Clientes')).toBeInTheDocument()
    })

    const searchInput = screen.getByLabelText('Buscar campañas')
    fireEvent.change(searchInput, { target: { value: 'Happy' } })

    expect(screen.queryByText('Bienvenida Nuevos Clientes')).not.toBeInTheDocument()
    expect(screen.getByText('Happy Hour Viernes')).toBeInTheDocument()
  })

  it('shows empty state when no campaigns match', async () => {
    mockApi.get.mockImplementation((url: string) => {
      if (url === '/campaigns') return Promise.resolve({ data: [] })
      return Promise.resolve({ data: [] })
    })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('No hay campañas')).toBeInTheDocument()
    })
  })

  it('shows empty state when search has no matches', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Bienvenida Nuevos Clientes')).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText('Buscar campañas'), { target: { value: 'zzz no existe' } })

    expect(screen.getByText('No hay campañas')).toBeInTheDocument()
  })

  it('allows toggling campaign status', async () => {
    mockApi.put.mockResolvedValue({ data: { ...mockCampaignsData[1], status: 'ACTIVE' } })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Happy Hour Viernes')).toBeInTheDocument()
    })

    const resumeBtn = screen.getByRole('button', { name: /Reanudar/i })
    fireEvent.click(resumeBtn)

    await waitFor(() => {
      expect(mockApi.put).toHaveBeenCalledWith(
        '/campaigns/c2/status',
        expect.objectContaining({ status: 'ACTIVE' })
      )
    })
  })
})

import CampaignDetail from '../../../pages/admin/CampaignDetail'
import { Routes, Route } from 'react-router-dom'

describe('Admin CampaignDetail Page', () => {
  const mockDetailData = {
    ...mockCampaignsData[0],
    referralCode: 'WELCOME10',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockApi.get.mockImplementation((url: string) => {
      if (url === '/campaigns/c1') return Promise.resolve({ data: mockDetailData })
      if (url === '/campaigns/c1/stats') return Promise.resolve({ data: mockDetailData.stats })
      return Promise.resolve({ data: null })
    })
    mockApi.put.mockResolvedValue({ data: { ...mockDetailData, status: 'PAUSED' } })
  })

  function renderDetail() {
    localStorage.setItem('user', JSON.stringify({ id: '1', name: 'Admin', role: 'ADMIN' }))
    return render(
      <MemoryRouter initialEntries={['/admin/campanas/c1']}>
        <Routes>
          <Route path="/admin/campanas/:id" element={<CampaignDetail />} />
        </Routes>
      </MemoryRouter>
    )
  }

  it('renders campaign detail with KPIs, funnel, and referral code', async () => {
    renderDetail()

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Bienvenida Nuevos Clientes' })).toBeInTheDocument()
    })

    expect(screen.getByText(/Embudo de Conversión/i)).toBeInTheDocument()
    expect(screen.getByText('WELCOME10')).toBeInTheDocument()
  })

  it('allows pausing active campaign from detail view', async () => {
    renderDetail()

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Bienvenida Nuevos Clientes' })).toBeInTheDocument()
    })

    const pauseBtn = screen.getByRole('button', { name: /Pausar Campaña/i })
    fireEvent.click(pauseBtn)

    await waitFor(() => {
      expect(mockApi.put).toHaveBeenCalledWith(
        '/campaigns/c1/status',
        expect.objectContaining({ status: 'PAUSED' })
      )
    })
  })
})
