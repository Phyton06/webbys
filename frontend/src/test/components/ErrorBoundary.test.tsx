import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import ErrorBoundary from '../../components/ErrorBoundary'

function ThrowingComponent(): JSX.Element {
  throw new Error('Test error')
}

function NoThrowComponent() {
  return <div>No error here</div>
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders children normally when no error', () => {
    render(
      <ErrorBoundary>
        <NoThrowComponent />
      </ErrorBoundary>,
    )
    expect(screen.getByText('No error here')).toBeInTheDocument()
  })

  it('shows fallback UI when child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>,
    )
    expect(screen.getByText('Algo salió mal')).toBeInTheDocument()
  })

  it('shows error message and reload button', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>,
    )
    expect(screen.getByText(/Ha ocurrido un error inesperado/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /recargar página/i })).toBeInTheDocument()
  })
})
