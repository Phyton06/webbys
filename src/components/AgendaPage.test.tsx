import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createAgendaSeed } from '../data/agenda-demo';
import { AGENDA_STORAGE_KEY, loadAgendaState, saveAgendaState } from '../services/agenda-store';
import { AgendaPage } from './AgendaPage';

const now = new Date(2026, 9, 15, 8, 0);

afterEach(() => {
  cleanup();
  localStorage.clear();
});

beforeEach(() => {
  vi.setSystemTime(now);
});

describe('AgendaPage availability settings', () => {
  it('shows only the selected Agenda subsection', () => {
    localStorage.setItem('webbys:demo-session', 'active');
    saveAgendaState(localStorage, createAgendaSeed(now));
    render(<AgendaPage />);

    expect(screen.getByRole('region', { name: 'Agenda' })).toBeTruthy();
    expect(screen.queryByRole('region', { name: 'Horarios de trabajo' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Disponibilidad' }));

    expect(screen.queryByRole('region', { name: 'Agenda' })).toBeNull();
    expect(screen.getByRole('region', { name: 'Horarios de trabajo' })).toBeTruthy();
  });

  it('opens the availability editor and persists an edited weekly schedule', async () => {
    localStorage.setItem('webbys:demo-session', 'active');
    saveAgendaState(localStorage, createAgendaSeed(now));
    render(<AgendaPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Disponibilidad' }));
    expect(screen.getByRole('heading', { name: 'Horarios de trabajo' })).toBeTruthy();
    fireEvent.input(screen.getByLabelText('Fin del horario lunes 1'), { target: { value: '19:00' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar horarios' }));

    await waitFor(() => expect(screen.getByText('Horarios actualizados.')).toBeTruthy());
    const state = loadAgendaState(localStorage, now).state;
    const monday = state.schedules.find(({ barberId }) => barberId === state.barbers[0]?.id)?.days.find(({ weekday }) => weekday === 1);
    expect(monday?.working[0]?.end).toBe('19:00');
  });

  it('persists a date-specific day off and keeps other schedule state', async () => {
    localStorage.setItem('webbys:demo-session', 'active');
    const originalState = createAgendaSeed(now);
    saveAgendaState(localStorage, originalState);
    render(<AgendaPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Disponibilidad' }));
    fireEvent.input(screen.getByLabelText('Fecha de la excepción'), { target: { value: '2026-10-16' } });
    fireEvent.click(screen.getByLabelText('Día libre'));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar excepción' }));

    await waitFor(() => expect(screen.getByText('Excepción de disponibilidad guardada.')).toBeTruthy());
    const saved = JSON.parse(localStorage.getItem(AGENDA_STORAGE_KEY) ?? '{}') as { state?: ReturnType<typeof createAgendaSeed> };
    expect(saved.state?.exceptions.some(({ date, unavailable }) => date === '2026-10-16' && unavailable)).toBe(true);
    expect(saved.state?.appointments).toEqual(originalState.appointments);
  });

  it('recomputes open starts in Citas after a saved weekly schedule change', async () => {
    const sessionNow = new Date();
    localStorage.setItem('webbys:demo-session', 'active');
    saveAgendaState(localStorage, createAgendaSeed(sessionNow));
    const daysUntilSaturday = (6 - sessionNow.getDay() + 7) % 7 || 7;
    const saturday = new Date(sessionNow.getFullYear(), sessionNow.getMonth(), sessionNow.getDate() + daysUntilSaturday);
    const date = `${saturday.getFullYear()}-${String(saturday.getMonth() + 1).padStart(2, '0')}-${String(saturday.getDate()).padStart(2, '0')}`;
    const weekday = new Intl.DateTimeFormat('es', { weekday: 'long' }).format(saturday);
    render(<AgendaPage />);

    fireEvent.input(screen.getByLabelText('Fecha de la agenda'), { target: { value: date } });
    fireEvent.click(screen.getByRole('button', { name: 'Barbero: Todos' }));
    fireEvent.click(screen.getByRole('option', { name: 'Diego' }));
    const diegoAvailability = screen.getByRole('group', { name: 'Horarios de Diego' });
    expect(within(diegoAvailability).getByText('09:00')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Disponibilidad' }));
    fireEvent.input(screen.getByLabelText(`Inicio del horario ${weekday} 1`), { target: { value: '15:00' } });
    fireEvent.input(screen.getByLabelText(`Fin del horario ${weekday} 1`), { target: { value: '16:00' } });
    fireEvent.click(screen.getByRole('button', { name: `Eliminar descanso ${weekday} 1` }));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar horarios' }));
    await waitFor(() => expect(screen.getByText('Horarios actualizados.')).toBeTruthy());

    fireEvent.click(screen.getByRole('button', { name: 'Citas' }));
    const updatedAvailability = screen.getByRole('group', { name: 'Horarios de Diego' });
    expect(within(updatedAvailability).queryByText('09:00')).toBeNull();
    expect(within(updatedAvailability).getByText('15:00')).toBeTruthy();
  });

  it('creates a valid appointment in Citas and persists its status and start', async () => {
    localStorage.setItem('webbys:demo-session', 'active');
    saveAgendaState(localStorage, createAgendaSeed(now));
    render(<AgendaPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Nueva cita' }));
    fireEvent.click(screen.getByRole('button', { name: 'Horario 09:00' }));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cita' }));

    await waitFor(() => expect(screen.getByText('Cita guardada.')).toBeTruthy());
    const state = loadAgendaState(localStorage, now).state;
    expect(state.appointments.some((entry) => entry.startsAt === new Date(2026, 9, 15, 9).toISOString() && entry.status === 'pending')).toBe(true);
  });

});
