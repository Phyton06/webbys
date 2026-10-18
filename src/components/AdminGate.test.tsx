import { cleanup, render, screen, waitFor } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AdminGate } from './AdminGate';

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe('AdminGate', () => {
  it('renders protected content only after finding a local session', async () => {
    localStorage.setItem('webbys:demo-session', 'active');

    render(
      <AdminGate>
        <p>Contenido del panel</p>
      </AdminGate>,
    );

    expect(await screen.findByText('Contenido del panel')).toBeTruthy();
  });

  it('withholds protected content and redirects when no session exists', async () => {
    const onUnauthenticated = vi.fn();

    render(
      <AdminGate onUnauthenticated={onUnauthenticated}>
        <p>Contenido privado</p>
      </AdminGate>,
    );

    await waitFor(() => expect(onUnauthenticated).toHaveBeenCalledOnce());
    expect(screen.queryByText('Contenido privado')).toBeNull();
    expect(screen.getByRole('alert').textContent).toContain('Debes iniciar sesión para acceder al panel.');
    expect(screen.getByRole('alert').textContent?.toLocaleLowerCase('es')).not.toMatch(/demo|demostración|demostracion/);
  });

  it('withholds administrator content from an assistant session', async () => {
    localStorage.setItem('webbys:demo-session', 'assistant');
    const onUnauthenticated = vi.fn();

    render(
      <AdminGate onUnauthenticated={onUnauthenticated}>
        <p>Contenido administrativo</p>
      </AdminGate>,
    );

    await waitFor(() => expect(onUnauthenticated).toHaveBeenCalledOnce());
    expect(screen.queryByText('Contenido administrativo')).toBeNull();
    expect(screen.getByRole('alert').textContent).toContain('administrador');
  });

  it('allows assistant sessions into shared operational modules', async () => {
    localStorage.setItem('webbys:demo-session', 'assistant');

    render(
      <AdminGate role="any">
        <p>Agenda compartida</p>
      </AdminGate>,
    );

    expect(await screen.findByText('Agenda compartida')).toBeTruthy();
  });
});
