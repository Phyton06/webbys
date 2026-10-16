import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LoginForm } from './LoginForm';

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe('LoginForm', () => {
  it('allows sign-in with no credentials and enters the admin panel', async () => {
    const onAuthenticated = vi.fn();
    render(<LoginForm onAuthenticated={onAuthenticated} />);

    expect((screen.getByLabelText('Correo electrónico') as HTMLInputElement).required).toBe(false);
    expect((screen.getByLabelText('Contraseña') as HTMLInputElement).required).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    expect(screen.getByRole('status').textContent).toContain('Iniciando sesión');
    await waitFor(() => expect(onAuthenticated).toHaveBeenCalledOnce());
    expect(localStorage.getItem('webbys:demo-session')).toBe('active');
  });

  it('toggles password visibility with an accessible control', () => {
    render(<LoginForm onAuthenticated={vi.fn()} />);
    const password = screen.getByLabelText('Contraseña') as HTMLInputElement;

    expect(password.type).toBe('password');
    fireEvent.click(screen.getByRole('button', { name: 'Mostrar contraseña' }));
    expect(password.type).toBe('text');
    expect(screen.getByRole('button', { name: 'Ocultar contraseña' })).toBeTruthy();
  });

  it('uses the supplied barbershop logo and contains no demo messaging', () => {
    const { container } = render(<LoginForm onAuthenticated={vi.fn()} />);

    expect(screen.getByRole('link', { name: "Webby's Barbershop, inicio" })).toBeTruthy();
    expect(screen.getByRole('img', { name: "Webby's Barbershop" })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Entrar en modo demo' })).toBeNull();
    expect(container.textContent?.toLocaleLowerCase('es')).not.toMatch(/demo|demostración|demostracion|simulación/);
  });

  it.each(['Google', 'Facebook'])('shows the %s sign-in option without claiming authentication', (provider) => {
    const onAuthenticated = vi.fn();
    render(<LoginForm onAuthenticated={onAuthenticated} />);

    fireEvent.click(screen.getByRole('button', { name: `Continuar con ${provider}` }));

    expect(screen.getByRole('status').textContent).toContain(`${provider} estará disponible próximamente`);
    expect(onAuthenticated).not.toHaveBeenCalled();
  });
});
