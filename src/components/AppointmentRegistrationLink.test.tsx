import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppointmentRegistrationLink } from './AppointmentRegistrationLink';

let previousClipboard: PropertyDescriptor | undefined;

afterEach(() => {
  cleanup();
  if (previousClipboard) Object.defineProperty(navigator, 'clipboard', previousClipboard);
  else Reflect.deleteProperty(navigator, 'clipboard');
  previousClipboard = undefined;
});

function mockClipboard(writeText: (text: string) => Promise<void>) {
  previousClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
}

describe('AppointmentRegistrationLink', () => {
  it('shows the same generic origin-based path without personal data and copies it', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    mockClipboard(writeText);
    render(<AppointmentRegistrationLink />);
    const linkInput = screen.getByLabelText('Enlace de registro genérico') as HTMLInputElement;
    const firstLink = linkInput.value;
    const url = new URL(firstLink);

    expect(url.pathname).toBe('/registro');
    expect(url.search).toBe('');
    expect(firstLink).not.toMatch(/client|appointment|token/i);
    fireEvent.click(screen.getByRole('button', { name: 'Copiar enlace' }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(firstLink));
    expect(screen.getByText('Enlace copiado.')).toBeTruthy();

    cleanup();
    render(<AppointmentRegistrationLink />);
    expect((screen.getByLabelText('Enlace de registro genérico') as HTMLInputElement).value).toBe(firstLink);
  });

  it('keeps the generic link selectable when clipboard access is unavailable', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('clipboard unavailable'));
    mockClipboard(writeText);
    render(<AppointmentRegistrationLink />);

    fireEvent.click(screen.getByRole('button', { name: 'Copiar enlace' }));

    expect(await screen.findByText('Selecciona y copia el enlace.')).toBeTruthy();
    const linkInput = screen.getByLabelText('Enlace de registro genérico') as HTMLInputElement;
    expect(linkInput.selectionStart).toBe(0);
    expect(linkInput.selectionEnd).toBe(linkInput.value.length);
  });
});
