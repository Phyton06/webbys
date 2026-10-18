import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { InstallPrompt } from './InstallPrompt';

describe('InstallPrompt', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn(() => ({ matches: false })),
    });
  });

  it('opens a centered dialog with illustrated iPhone installation steps', () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('iPhone');
    render(<InstallPrompt />);

    const dialog = screen.getByRole('dialog', { name: 'Instala Webbys' });
    expect(dialog.classList.contains('install-modal')).toBe(true);
    expect(screen.getByRole('img', { name: 'Logotipo de Webbys' })).toBeTruthy();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(screen.getByText(/Compartir/)).toBeTruthy();
    expect(screen.getByText('Añadir a pantalla de inicio', { exact: true })).toBeTruthy();
  });

  it('shows simple browser-menu steps when automatic install is unavailable on Android', () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Android');
    render(<InstallPrompt />);

    expect(screen.getByRole('dialog', { name: 'Instala Webbys' })).toBeTruthy();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(screen.getByText(/menú/)).toBeTruthy();
    expect(screen.getByText(/Instalar aplicación/)).toBeTruthy();
  });

  it('uses the native install prompt after the user taps install', async () => {
    const prompt = vi.fn().mockResolvedValue(undefined);
    const event = new Event('beforeinstallprompt', { cancelable: true }) as Event & {
      prompt: typeof prompt;
      userChoice: Promise<{ outcome: 'accepted'; platform: string }>;
    };
    event.prompt = prompt;
    event.userChoice = Promise.resolve({ outcome: 'accepted', platform: 'web' });
    render(<InstallPrompt />);
    window.dispatchEvent(event);

    fireEvent.click(await screen.findByRole('button', { name: 'Instalar Webbys' }));

    expect(prompt).toHaveBeenCalledOnce();
    await waitFor(() => expect(screen.queryByLabelText('Instala Webbys')).toBeNull());
  });

  it('closes the installation dialog from its close button', () => {
    render(<InstallPrompt />);
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar invitación de instalación' }));
    expect(screen.queryByRole('dialog', { name: 'Instala Webbys' })).toBeNull();
  });
});
