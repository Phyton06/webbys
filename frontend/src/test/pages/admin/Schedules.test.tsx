import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Schedules from '../../../pages/admin/Schedules'

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
    <MemoryRouter initialEntries={['/admin/horarios']}>
      <Schedules />
    </MemoryRouter>
  )
}

const mockBarbers = [
  { id: 'u3', name: 'Juan Barbero' },
  { id: 'u4', name: 'Pedro Barbero' },
]

const mockScheduleJuan = {
  barberId: 'u3',
  entries: [
    { day: 'monday', slots: [{ start: '09:00', end: '18:00' }] },
    { day: 'tuesday', slots: [{ start: '09:00', end: '18:00' }] },
    { day: 'wednesday', slots: [{ start: '09:00', end: '18:00' }] },
    { day: 'thursday', slots: [{ start: '09:00', end: '18:00' }] },
    { day: 'friday', slots: [{ start: '09:00', end: '20:00' }] },
    { day: 'saturday', slots: [{ start: '10:00', end: '16:00' }] },
    { day: 'sunday', slots: [] },
  ],
  exceptions: [],
}

const mockSchedulePedro = {
  barberId: 'u4',
  entries: [
    { day: 'monday', slots: [{ start: '10:00', end: '19:00' }] },
    { day: 'tuesday', slots: [{ start: '10:00', end: '19:00' }] },
    { day: 'wednesday', slots: [{ start: '10:00', end: '19:00' }] },
    { day: 'thursday', slots: [{ start: '10:00', end: '19:00' }] },
    { day: 'friday', slots: [{ start: '10:00', end: '20:00' }] },
    { day: 'saturday', slots: [{ start: '11:00', end: '17:00' }] },
    { day: 'sunday', slots: [] },
  ],
  exceptions: [],
}

const mockExceptions = [
  {
    id: 'ex1',
    barberId: 'u3',
    date: '2026-09-15',
    type: 'DAY_OFF',
    reason: 'Vacaciones',
  },
]

describe('Admin Schedules Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()

    mockApi.get.mockImplementation((url: string) => {
      if (url === '/barbers') {
        return Promise.resolve({ data: mockBarbers })
      }
      if (url.startsWith('/schedules/exceptions')) {
        return Promise.resolve({ data: mockExceptions })
      }
      if (url.includes('/schedules/u4')) {
        return Promise.resolve({ data: mockSchedulePedro })
      }
      if (url.includes('/schedules/u3') || url.startsWith('/schedules/')) {
        return Promise.resolve({ data: mockScheduleJuan })
      }
      return Promise.resolve({ data: [] })
    })

    mockApi.put.mockResolvedValue({ data: { success: true } })
    mockApi.post.mockResolvedValue({
      data: {
        id: 'ex2',
        barberId: 'u3',
        date: '2026-09-20',
        type: 'DAY_OFF',
        reason: 'Capacitación',
      },
    })
    mockApi.delete.mockResolvedValue({ data: { success: true } })
  })

  it('renders heading and weekly schedule grid for default barber', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText(/Horarios y Disponibilidad/i)).toBeInTheDocument()
    })

    expect(screen.getByText('Juan Barbero')).toBeInTheDocument()
    // Days should be visible
    expect(screen.getByText(/Lunes/i)).toBeInTheDocument()
    expect(screen.getByText(/Viernes/i)).toBeInTheDocument()
    expect(screen.getAllByText(/09:00 - 18:00/i).length).toBeGreaterThan(0)
  })

  it('switches barber and loads their specific schedule', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Juan Barbero')).toBeInTheDocument()
    })

    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'u4' } })

    await waitFor(() => {
      expect(mockApi.get).toHaveBeenCalledWith(expect.stringContaining('u4'))
      expect(screen.getAllByText(/10:00 - 19:00/i).length).toBeGreaterThan(0)
    })
  })

  it('opens edit modal for day hours, edits hours and saves', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText(/Lunes/i)).toBeInTheDocument()
    })

    // Click edit for Monday
    const editBtns = screen.getAllByRole('button', { name: /Editar/i })
    fireEvent.click(editBtns[0])

    await waitFor(() => {
      expect(screen.getByText(/Editar Horario/i)).toBeInTheDocument()
    })

    // Change start and end times
    const startInput = screen.getByLabelText(/Hora Inicio/i)
    const endInput = screen.getByLabelText(/Hora Fin/i)

    fireEvent.change(startInput, { target: { value: '08:30' } })
    fireEvent.change(endInput, { target: { value: '17:30' } })

    const saveBtn = screen.getByRole('button', { name: /Guardar Horario/i })
    fireEvent.click(saveBtn)

    await waitFor(() => {
      expect(mockApi.put).toHaveBeenCalledWith(
        expect.stringContaining('/schedules/u3'),
        expect.objectContaining({
          entries: expect.any(Array),
        })
      )
    })
  })

  it('manages exceptions: displays existing and adds a new exception', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText(/Excepciones y Días Libres/i)).toBeInTheDocument()
    })

    // Existing exception is shown
    expect(screen.getByText(/Vacaciones/i)).toBeInTheDocument()
    expect(screen.getByText(/2026-09-15/i)).toBeInTheDocument()

    // Open add exception modal
    const addExBtn = screen.getByRole('button', { name: /Agregar Excepción/i })
    fireEvent.click(addExBtn)

    await waitFor(() => {
      expect(screen.getByText(/Nueva Excepción/i)).toBeInTheDocument()
    })

    const dateInput = screen.getByLabelText(/Fecha/i)
    const reasonInput = screen.getByLabelText(/Motivo/i)

    fireEvent.change(dateInput, { target: { value: '2026-09-20' } })
    fireEvent.change(reasonInput, { target: { value: 'Capacitación' } })

    const submitBtn = screen.getByRole('button', { name: /Guardar Excepción/i })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith(
        '/schedules/exceptions',
        expect.objectContaining({
          barberId: 'u3',
          date: '2026-09-20',
          reason: 'Capacitación',
        })
      )
    })
  })

  it('removes an exception when delete button is clicked', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText(/Vacaciones/i)).toBeInTheDocument()
    })

    const deleteBtn = screen.getByRole('button', { name: /Eliminar excepción/i })
    fireEvent.click(deleteBtn)

    await waitFor(() => {
      expect(mockApi.delete).toHaveBeenCalledWith('/schedules/exceptions/ex1')
    })
  })
})
