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

  it('shows iPhone installation instructions when native install is unavailable', async () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('iPhone');
    render(<InstallPrompt />);

    fireEvent.click(screen.getByRole('button', { name: 'Cómo instalar' }));

    expect(screen.getByRole('status').textContent).toContain('Compartir');
    expect(screen.getByRole('img', { hidden: true })).toBeTruthy();
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

    fireEvent.click(await screen.findByRole('button', { name: 'Instalar' }));

    expect(prompt).toHaveBeenCalledOnce();
    await waitFor(() => expect(screen.queryByLabelText('Instala Webbys')).toBeNull());
  });
});
