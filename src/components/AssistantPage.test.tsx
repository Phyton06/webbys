import { cleanup, render, screen } from '@testing-library/preact';
import { afterEach, describe, expect, it } from 'vitest';
import { createAgendaSeed } from '../data/agenda-demo';
import { saveAgendaState } from '../services/agenda-store';
import { AssistantPage } from './AssistantPage';

const now = new Date(2026, 9, 15, 12);

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe('AssistantPage', () => {
  it('shows unpaid appointments and the quick operational actions from shared state', () => {
    localStorage.setItem('webbys:demo-session', 'assistant');
    const state = createAgendaSeed(now);
    state.appointments = state.appointments.slice(0, 3).map((appointment, index) => ({
      ...appointment,
      startsAt: now.toISOString(),
      status: (index === 0 ? 'completed' : index === 1 ? 'pending' : 'cancelled') as typeof appointment.status,
      paymentStatus: index === 1 ? 'paid' : 'pending',
    }));
    saveAgendaState(localStorage, state);
    render(<AssistantPage now={now} />);

    expect(screen.getByText('Citas pendientes de cobro')).toBeTruthy();
    expect(screen.getByText('Citas de hoy').parentElement?.textContent).toContain('2');
    expect(screen.getByRole('link', { name: 'Cobrar una cita' }).getAttribute('href')).toBe('/cobrar/');
    expect(screen.getByRole('link', { name: 'Agendar cita' }).getAttribute('href')).toBe('/agenda/');
    expect(screen.getByRole('link', { name: 'Registrar cliente' }).getAttribute('href')).toBe('/clientes/');
    expect(screen.getByRole('link', { name: 'Venta rápida de productos' }).getAttribute('href')).toBe('/cobrar/?quick=1');
  });
});
