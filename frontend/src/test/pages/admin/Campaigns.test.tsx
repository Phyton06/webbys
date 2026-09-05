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
    referralCode: 'WELCOME10',
    discountPercent: 10,
    startDate: '2026-09-01',
    endDate: '2026-12-31',
    targetAudience: 'NEW',
    stats: { sent: 25, opened: 20, clicked: 12, converted: 8, revenue: 1600 },
    createdAt: '2026-09-01',
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
    targetAudience: 'CLIENTS',
    stats: { sent: 100, opened: 60, clicked: 30, converted: 15, revenue: 3000 },
    createdAt: '2026-09-01',
  },
]

describe('Admin Campaigns Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()

    mockApi.get.mockImplementation((url: string) => {
      if (url === '/campaigns') {
        return Promise.resolve({ data: mockCampaignsData })
      }
      return Promise.resolve({ data: [] })
    })

    mockApi.post.mockResolvedValue({
      data: {
        id: 'c3',
        name: 'Black Friday 2026',
        description: 'Descuento especial',
        type: 'DISCOUNT',
        status: 'DRAFT',
        channel: 'EMAIL',
        discountPercent: 25,
        startDate: '2026-11-25',
        endDate: '2026-11-30',
        targetAudience: 'ALL',
        stats: { sent: 0, opened: 0, clicked: 0, converted: 0, revenue: 0 },
        createdAt: '2026-09-04',
      },
    })

    mockApi.put.mockResolvedValue({ data: { ...mockCampaignsData[1], status: 'ACTIVE' } })
  })

  it('renders heading, summary stats, and campaign cards/list', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText(/Campañas y Promociones/i)).toBeInTheDocument()
    })

    expect(screen.getByText('Bienvenida Nuevos Clientes')).toBeInTheDocument()
    expect(screen.getByText('Happy Hour Viernes')).toBeInTheDocument()
    expect(screen.getByText('WELCOME10')).toBeInTheDocument()
    expect(screen.getByText(/25 enviados/i)).toBeInTheDocument()
  })

  it('filters campaigns by status', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Bienvenida Nuevos Clientes')).toBeInTheDocument()
    })

    // Filter by PAUSED
    const statusSelect = screen.getByLabelText(/Filtrar por Estado/i)
    fireEvent.change(statusSelect, { target: { value: 'PAUSED' } })

    expect(screen.queryByText('Bienvenida Nuevos Clientes')).not.toBeInTheDocument()
    expect(screen.getByText('Happy Hour Viernes')).toBeInTheDocument()
  })

  it('opens create campaign modal, enters details and submits', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Bienvenida Nuevos Clientes')).toBeInTheDocument()
    })

    const newBtn = screen.getByRole('button', { name: /\+ Nueva Campaña/i })
    fireEvent.click(newBtn)

    await waitFor(() => {
      expect(screen.getByText(/Crear Nueva Campaña/i)).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText(/Nombre de la Campaña/i), {
      target: { value: 'Black Friday 2026' },
    })
    fireEvent.change(screen.getByLabelText(/Descripción/i), {
      target: { value: 'Descuento especial' },
    })
    fireEvent.change(screen.getByLabelText(/Descuento \(%\)/i), {
      target: { value: '25' },
    })

    const submitBtn = screen.getByRole('button', { name: /Guardar Campaña/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith(
        '/campaigns',
        expect.objectContaining({
          name: 'Black Friday 2026',
          discountPercent: 25,
        })
      )
    })
  })

  it('allows toggling campaign status between active and paused', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Happy Hour Viernes')).toBeInTheDocument()
    })

    const activateBtn = screen.getByRole('button', { name: /Reanudar/i })
    fireEvent.click(activateBtn)

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
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()

    mockApi.get.mockImplementation((url: string) => {
      if (url === '/campaigns/c1') {
        return Promise.resolve({ data: mockCampaignsData[0] })
      }
      if (url === '/campaigns/c1/stats') {
        return Promise.resolve({ data: mockCampaignsData[0].stats })
      }
      return Promise.resolve({ data: null })
    })

    mockApi.put.mockResolvedValue({ data: { ...mockCampaignsData[0], status: 'PAUSED' } })
    mockApi.post.mockResolvedValue({ data: { code: 'REF-NEW-2026' } })
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
    expect(screen.getByText('$1,600')).toBeInTheDocument() // Revenue
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

