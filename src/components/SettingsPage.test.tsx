import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createAgendaSeed } from '../data/agenda-demo';
import { loadAgendaState, saveAgendaState } from '../services/agenda-store';
import { AgendaPage } from './AgendaPage';
import { SettingsPage } from './SettingsPage';

const now = new Date(2026, 9, 15, 8, 0);

afterEach(() => {
  cleanup();
  localStorage.clear();
});

beforeEach(() => {
  vi.setSystemTime(now);
});

describe('SettingsPage availability', () => {
  it('hosts weekly schedules and date exceptions under Configuration', () => {
    localStorage.setItem('webbys:demo-session', 'active');
    saveAgendaState(localStorage, createAgendaSeed(now));
    render(<SettingsPage />);

    expect(screen.getByRole('heading', { name: 'Configuración' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Horarios de trabajo' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Excepciones por fecha' })).toBeTruthy();
    expect(screen.getByRole('navigation', { name: 'Navegación de escritorio' }).querySelector('[href="/configuracion/"]')?.getAttribute('aria-current')).toBe('page');
    expect(screen.queryByRole('region', { name: 'Agenda' })).toBeNull();
  });

  it('persists schedule and exception edits without replacing appointments', async () => {
    localStorage.setItem('webbys:demo-session', 'active');
    const originalState = createAgendaSeed(now);
    saveAgendaState(localStorage, originalState);
    render(<SettingsPage />);

    fireEvent.input(screen.getByLabelText('Fin del horario lunes 1'), { target: { value: '19:00' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar horarios' }));
    await waitFor(() => expect(screen.getByText('Horarios actualizados.')).toBeTruthy());

    fireEvent.input(screen.getByLabelText('Fecha de la excepción'), { target: { value: '2026-10-16' } });
    fireEvent.click(screen.getByLabelText('Día libre'));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar excepción' }));
    await waitFor(() => expect(screen.getByText('Excepción de disponibilidad guardada.')).toBeTruthy());

    const state = loadAgendaState(localStorage, now).state;
    const monday = state.schedules.find(({ barberId }) => barberId === state.barbers[0]?.id)?.days.find(({ weekday }) => weekday === 1);
    expect(monday?.working[0]?.end).toBe('19:00');
    expect(state.exceptions.some(({ date, unavailable }) => date === '2026-10-16' && unavailable)).toBe(true);
    expect(state.appointments).toEqual(originalState.appointments);
  });

  it('makes schedule changes in Configuration affect Agenda availability', async () => {
    localStorage.setItem('webbys:demo-session', 'active');
    saveAgendaState(localStorage, createAgendaSeed(now));
    const saturday = new Date(2026, 9, 17);
    const weekday = new Intl.DateTimeFormat('es', { weekday: 'long' }).format(saturday);
    render(<SettingsPage />);

    fireEvent.input(screen.getByLabelText(`Inicio del horario ${weekday} 1`), { target: { value: '15:00' } });
    fireEvent.input(screen.getByLabelText(`Fin del horario ${weekday} 1`), { target: { value: '16:00' } });
    fireEvent.click(screen.getByRole('button', { name: `Eliminar descanso ${weekday} 1` }));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar horarios' }));
    await waitFor(() => expect(screen.getByText('Horarios actualizados.')).toBeTruthy());

    cleanup();
    render(<AgendaPage />);
    fireEvent.input(screen.getByLabelText('Fecha de la agenda'), { target: { value: '2026-10-17' } });
    fireEvent.click(screen.getByRole('button', { name: 'Barbero: Todos' }));
    fireEvent.click(screen.getByRole('option', { name: 'Diego' }));
    const diegoAvailability = screen.getByRole('group', { name: 'Horarios de Diego' });
    expect(within(diegoAvailability).queryByText('09:00')).toBeNull();
    expect(within(diegoAvailability).getByText('15:00')).toBeTruthy();
  });
});
