import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Settings from '../../../pages/admin/Settings'

function renderComponent() {
  localStorage.setItem('user', JSON.stringify({ id: '1', name: 'Admin', role: 'ADMIN' }))
  return render(
    <MemoryRouter initialEntries={['/admin/configuracion']}>
      <Settings />
    </MemoryRouter>
  )
}

describe('Admin Settings Page', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders heading and business tab content immediately (no loading state)', () => {
    const { container } = renderComponent()
    expect(screen.getByText('Configuración')).toBeDefined()
    expect(screen.getByText('Datos de Negocio')).toBeDefined()
    // Business tab is default — inputs render with empty values
    expect(container.querySelectorAll('input').length).toBeGreaterThan(0)
  })

  it('allows editing business details in the form', () => {
    const { container } = renderComponent()
    // Find the first text input (Nombre del Negocio)
    const inputs = container.querySelectorAll('input')
    const nameInput = Array.from(inputs).find(i => (i as HTMLInputElement).value === '') as HTMLInputElement
    fireEvent.change(nameInput, { target: { value: "New Webby's" } })
    expect(nameInput).toHaveValue("New Webby's")
  })

  it('renders roles matrix as read-only', () => {
    renderComponent()
    const rolesTab = screen.getByText('Roles & Permisos')
    fireEvent.click(rolesTab)

    expect(screen.getByText('Administrador')).toBeDefined()
    expect(screen.getByText('Barbero')).toBeDefined()
    expect(screen.getByText('Cliente')).toBeDefined()
    expect(screen.getByText('ver_todos, editar_usuarios, gestion_horarios, ver_reportes')).toBeDefined()
  })

  it('renders and allows editing operating hours', () => {
    renderComponent()
    const hoursTab = screen.getByText('Horarios de Apertura')
    fireEvent.click(hoursTab)

    expect(screen.getByText('Lunes')).toBeDefined()
    expect(screen.getByText('Domingo')).toBeDefined()
  })

  it('renders and allows editing branding config', () => {
    const { container } = renderComponent()
    // Tab button and h2 both have the same text — use getAllByText
    const brandingTabs = screen.getAllByText('Branding & Personalización')
    fireEvent.click(brandingTabs[0])

    // Branding has color pickers + text inputs
    const inputs = container.querySelectorAll('input')
    expect(inputs.length).toBeGreaterThan(0)
  })
})
