import { cleanup, fireEvent, render, screen, within } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AssistantShell } from './AssistantShell';

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe('AssistantShell', () => {
  it('places the assistant avatar between the brand and sign-out action', () => {
    render(<AssistantShell><p>Operación</p></AssistantShell>);
    const topbar = screen.getByRole('banner');
    const avatar = within(topbar).getByLabelText('Perfil de asistente');
    const signOut = within(topbar).getByRole('button', { name: 'Cerrar sesión' });

    expect(topbar.querySelector('.assistant-topbar-spacer')).toBeTruthy();
    expect(avatar.classList.contains('assistant-avatar')).toBe(true);
    expect(avatar.nextElementSibling).toBe(signOut);
  });

  it('provides the required mobile destinations and operational More menu', () => {
    render(<AssistantShell><p>Operación</p></AssistantShell>);
    const navigation = screen.getByRole('navigation', { name: 'Navegación del asistente' });

    expect(within(navigation).getByRole('link', { name: 'Inicio' }).getAttribute('href')).toBe('/asistente/');
    expect(within(navigation).getByRole('link', { name: 'Agenda' }).getAttribute('href')).toBe('/agenda/');
    expect(within(navigation).getByRole('link', { name: 'Cobrar' }).getAttribute('href')).toBe('/cobrar/');
    expect(within(navigation).getByRole('link', { name: 'Clientes' }).getAttribute('href')).toBe('/clientes/');
    fireEvent.click(within(navigation).getByRole('button', { name: 'Más' }));
    const more = screen.getByRole('navigation', { name: 'Más secciones del asistente' });
    expect(within(more).getByRole('link', { name: 'Productos' }).getAttribute('href')).toBe('/productos/');
    expect(within(more).getByRole('link', { name: 'Servicios' }).getAttribute('href')).toBe('/servicios/');
    expect(within(more).getByRole('link', { name: 'Promociones' }).getAttribute('href')).toBe('/promociones/');
    expect(within(more).getByRole('link', { name: 'Historial de ventas' }).getAttribute('href')).toBe('/ventas/');
  });

  it('ends the local demo session from the assistant shell', () => {
    const onSignOut = vi.fn();
    localStorage.setItem('webbys:demo-session', 'assistant');
    render(<AssistantShell onSignOut={onSignOut}><p>Operación</p></AssistantShell>);

    fireEvent.click(screen.getAllByRole('button', { name: 'Cerrar sesión' })[0]!);
    expect(localStorage.getItem('webbys:demo-session')).toBeNull();
    expect(onSignOut).toHaveBeenCalledOnce();
  });
});
