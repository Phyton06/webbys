import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'

beforeEach(() => {
  sessionStorage.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('InstallPrompt', () => {
  it('returns null when install-dismissed in sessionStorage', async () => {
    sessionStorage.setItem('install-dismissed', 'true')
    const { default: InstallPrompt } = await import('../../components/InstallPrompt')
    const { container } = render(<InstallPrompt />)
    expect(container.innerHTML).toBe('')
  })

  it('returns null when in standalone mode', async () => {
    Object.defineProperty(window, 'matchMedia', {
      value: vi.fn().mockReturnValue({ matches: true }),
      writable: true,
    })
    const { default: InstallPrompt } = await import('../../components/InstallPrompt')
    const { container } = render(<InstallPrompt />)
    expect(container.innerHTML).toBe('')
  })

  it('shows manual instructions when no beforeinstallprompt event', async () => {
    vi.useFakeTimers()
    Object.defineProperty(window, 'matchMedia', {
      value: vi.fn().mockReturnValue({ matches: false }),
      writable: true,
    })
    const { default: InstallPrompt } = await import('../../components/InstallPrompt')
    render(<InstallPrompt />)
    await act(async () => {
      vi.advanceTimersByTime(5000)
    })
    expect(screen.getByText('Instalar Webby\'s')).toBeInTheDocument()
    expect(screen.getByText(/Tu navegador no ofrece instalación automática/)).toBeInTheDocument()
    vi.useRealTimers()
  })

  it('dismisses when clicking "Ahora no"', async () => {
    vi.useFakeTimers()
    Object.defineProperty(window, 'matchMedia', {
      value: vi.fn().mockReturnValue({ matches: false }),
      writable: true,
    })
    const { default: InstallPrompt } = await import('../../components/InstallPrompt')
    render(<InstallPrompt />)
    await act(async () => {
      vi.advanceTimersByTime(5000)
    })
    expect(screen.getByText('Instalar Webby\'s')).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText('Cerrar sin instalar'))
    expect(sessionStorage.getItem('install-dismissed')).toBe('true')
    vi.useRealTimers()
  })

  it('shows native install button when beforeinstallprompt fires', async () => {
    vi.useFakeTimers()
    Object.defineProperty(window, 'matchMedia', {
      value: vi.fn().mockReturnValue({ matches: false }),
      writable: true,
    })
    const { default: InstallPrompt } = await import('../../components/InstallPrompt')
    render(<InstallPrompt />)
    await act(async () => {
      const event = new Event('beforeinstallprompt') as any
      event.preventDefault = vi.fn()
      event.prompt = vi.fn()
      event.userChoice = Promise.resolve({ outcome: 'dismissed' })
      window.dispatchEvent(event)
      vi.advanceTimersByTime(500)
    })
    expect(screen.getByText('Instalar App')).toBeInTheDocument()
    vi.useRealTimers()
  })
})
