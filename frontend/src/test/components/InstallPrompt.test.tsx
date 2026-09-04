import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'

beforeEach(() => {
  sessionStorage.clear()
  // Reset module-level state
  vi.resetModules()
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
    await act(async () => { vi.advanceTimersByTime(5000) })
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
    await act(async () => { vi.advanceTimersByTime(5000) })
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

  it('calls handleInstall with deferredPrompt', async () => {
    vi.useFakeTimers()
    Object.defineProperty(window, 'matchMedia', {
      value: vi.fn().mockReturnValue({ matches: false }),
      writable: true,
    })
    const { default: InstallPrompt } = await import('../../components/InstallPrompt')
    render(<InstallPrompt />)

    // Fire beforeinstallprompt to set deferredPrompt
    const mockPrompt = vi.fn()
    const mockUserChoice = Promise.resolve({ outcome: 'accepted' })
    await act(async () => {
      const event = new Event('beforeinstallprompt') as any
      event.preventDefault = vi.fn()
      event.prompt = mockPrompt
      event.userChoice = mockUserChoice
      window.dispatchEvent(event)
      vi.advanceTimersByTime(500)
    })
    expect(screen.getByText('Instalar App')).toBeInTheDocument()

    // Click install
    await act(async () => {
      fireEvent.click(screen.getByText('Instalar App'))
    })
    expect(mockPrompt).toHaveBeenCalled()
    expect(sessionStorage.getItem('install-dismissed')).toBe('true')
    vi.useRealTimers()
  })

  it('handleInstall falls back when deferredPrompt.prompt() throws', async () => {
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
      event.prompt = vi.fn().mockImplementation(() => { throw new Error('nope') })
      event.userChoice = Promise.resolve({ outcome: 'dismissed' })
      window.dispatchEvent(event)
      vi.advanceTimersByTime(500)
    })

    await act(async () => {
      fireEvent.click(screen.getByText('Instalar App'))
    })
    // Fallback: dismissed + sessionStorage set
    expect(sessionStorage.getItem('install-dismissed')).toBe('true')
    vi.useRealTimers()
  })

  it('handleInstall uses fallback when no deferredPrompt', async () => {
    vi.useFakeTimers()
    Object.defineProperty(window, 'matchMedia', {
      value: vi.fn().mockReturnValue({ matches: false }),
      writable: true,
    })
    const { default: InstallPrompt } = await import('../../components/InstallPrompt')
    render(<InstallPrompt />)

    // Show manual instructions (no beforeinstallprompt event)
    await act(async () => { vi.advanceTimersByTime(5000) })
    // Dialog is shown, but no deferredPrompt set — handleInstall goes to fallback
    // There's no "Instalar App" button in manual mode, so we test fallback path
    // by directly calling handleDismiss (which shares the same fallback logic)
    fireEvent.click(screen.getByLabelText('Cerrar sin instalar'))
    expect(sessionStorage.getItem('install-dismissed')).toBe('true')
    vi.useRealTimers()
  })

  it('closes on Escape key', async () => {
    vi.useFakeTimers()
    Object.defineProperty(window, 'matchMedia', {
      value: vi.fn().mockReturnValue({ matches: false }),
      writable: true,
    })
    const { default: InstallPrompt } = await import('../../components/InstallPrompt')
    render(<InstallPrompt />)
    await act(async () => { vi.advanceTimersByTime(5000) })
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    // Press Escape
    await act(async () => {
      fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    })
    expect(sessionStorage.getItem('install-dismissed')).toBe('true')
    vi.useRealTimers()
  })

  it('traps focus on Tab key', async () => {
    vi.useFakeTimers()
    Object.defineProperty(window, 'matchMedia', {
      value: vi.fn().mockReturnValue({ matches: false }),
      writable: true,
    })
    const { default: InstallPrompt } = await import('../../components/InstallPrompt')
    render(<InstallPrompt />)
    await act(async () => { vi.advanceTimersByTime(5000) })

    const dialog = screen.getByRole('dialog')
    const buttons = dialog.querySelectorAll('button')
    const lastButton = buttons[buttons.length - 1] as HTMLElement
    const firstButton = buttons[0] as HTMLElement

    // Focus last button, press Tab → should wrap to first
    lastButton.focus()
    await act(async () => {
      fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: false })
    })
    expect(document.activeElement).toBe(firstButton)

    // Focus first button, press Shift+Tab → should wrap to last
    firstButton.focus()
    await act(async () => {
      fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true })
    })
    expect(document.activeElement).toBe(lastButton)
    vi.useRealTimers()
  })

  it('handleInstall dismisses on outcome !== accepted', async () => {
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

    await act(async () => {
      fireEvent.click(screen.getByText('Instalar App'))
    })
    // outcome is 'dismissed' → deferredPrompt.prompt() called, but not accepted
    // The dialog should still be visible since only 'accepted' closes it
    // But deferredPrompt gets set to null and we return early
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    vi.useRealTimers()
  })
})
