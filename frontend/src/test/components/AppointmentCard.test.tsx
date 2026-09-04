import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import AppointmentCard from '../../components/AppointmentCard'

const baseProps = {
  clientName: 'Ana Cliente',
  barberName: 'Juan Barbero',
  service: 'Corte de cabello',
  date: '2025-01-15',
  time: '10:00',
}

describe('AppointmentCard', () => {
  it('renders pending status with correct badge', () => {
    render(<AppointmentCard {...baseProps} status="PENDIENTE" />)
    expect(screen.getByText('Pendiente')).toBeInTheDocument()
    expect(screen.getByText('Pendiente').className).toContain('badge-warning')
  })

  it('renders confirmed status with correct badge', () => {
    render(<AppointmentCard {...baseProps} status="CONFIRMADA" />)
    expect(screen.getByText('Confirmada')).toBeInTheDocument()
    expect(screen.getByText('Confirmada').className).toContain('badge-info')
  })

  it('renders completed status with correct badge', () => {
    render(<AppointmentCard {...baseProps} status="COMPLETADA" />)
    expect(screen.getByText('Completada')).toBeInTheDocument()
    expect(screen.getByText('Completada').className).toContain('badge-success')
  })

  it('renders cancelled status with correct badge', () => {
    render(<AppointmentCard {...baseProps} status="CANCELADA" />)
    expect(screen.getByText('Cancelada')).toBeInTheDocument()
    expect(screen.getByText('Cancelada').className).toContain('badge-danger')
  })

  it('shows client name and service info', () => {
    render(<AppointmentCard {...baseProps} status="PENDIENTE" />)
    expect(screen.getByText('Ana Cliente')).toBeInTheDocument()
    expect(screen.getByText(/Corte de cabello/)).toBeInTheDocument()
  })

  it('shows barber name', () => {
    render(<AppointmentCard {...baseProps} status="PENDIENTE" />)
    expect(screen.getByText(/Juan Barbero/)).toBeInTheDocument()
  })
})
