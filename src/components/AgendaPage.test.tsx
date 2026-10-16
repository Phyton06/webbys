import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createAgendaSeed } from '../data/agenda-demo';
import { AGENDA_STORAGE_KEY, loadAgendaState, saveAgendaState } from '../services/agenda-store';
import { AdminPage } from './AdminPage';
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

  it('adds a client inside the booking modal and resumes the draft through appointment save', async () => {
    localStorage.setItem('webbys:demo-session', 'active');
    const state = createAgendaSeed(now);
    state.appointments = [];
    saveAgendaState(localStorage, state);
    render(<AgendaPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Nueva cita' }));
    expect(screen.getByRole('dialog', { name: 'Nueva cita' })).toBeTruthy();
    fireEvent.input(screen.getByLabelText('Fecha de la cita'), { target: { value: '2026-10-16' } });
    fireEvent.click(screen.getByRole('checkbox', { name: 'Servicio Barba · 30 min' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Servicio Corte · 45 min' }));
    fireEvent.click(screen.getByRole('button', { name: 'Horario 09:00' }));
    fireEvent.click(screen.getByRole('button', { name: 'Agregar cliente' }));
    const addClientDialog = screen.getByRole('dialog', { name: 'Agregar cliente' });
    expect(within(addClientDialog).getAllByRole('textbox')).toHaveLength(2);
    fireEvent.input(screen.getByLabelText('Nombre del cliente'), { target: { value: 'Nueva Persona' } });
    fireEvent.input(screen.getByLabelText('Teléfono del cliente'), { target: { value: '555-0199' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cliente' }));

    await waitFor(() => expect((screen.getByRole('combobox', { name: 'Cliente' }) as HTMLInputElement).value).toBe('Nueva Persona'));
    expect((screen.getByLabelText('Fecha de la cita') as HTMLInputElement).value).toBe('2026-10-16');
    expect((screen.getByRole('checkbox', { name: 'Servicio Barba · 30 min' }) as HTMLInputElement).checked).toBe(true);
    expect((screen.getByRole('checkbox', { name: 'Servicio Corte · 45 min' }) as HTMLInputElement).checked).toBe(false);
    expect(screen.getByRole('button', { name: 'Barbero: Diego' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Horario 09:00', pressed: true })).toBeTruthy();
    const savedClient = loadAgendaState(localStorage, now).state.clients.find(({ phone }) => phone === '555-0199');
    expect(savedClient?.name).toBe('Nueva Persona');

    fireEvent.click(screen.getByRole('button', { name: 'Guardar cita' }));

    expect(await screen.findByRole('heading', { name: 'Cita guardada.' })).toBeTruthy();
    const savedState = loadAgendaState(localStorage, now).state;
    expect(savedState.appointments.some((entry) => entry.clientId === savedClient?.id && entry.clientName === 'Nueva Persona')).toBe(true);
    expect(savedState.appointments[0]?.startsAt).toBe(new Date(2026, 9, 16, 9).toISOString());
    expect(savedState.appointments[0]?.serviceIds).toEqual(['service-2']);
  });

  it('persists a status change for both Agenda and Dashboard to read', async () => {
    localStorage.setItem('webbys:demo-session', 'active');
    const state = createAgendaSeed(now);
    const appointment = state.appointments[0];
    if (!appointment) throw new Error('Expected a seeded appointment');
    const pending = {
      ...appointment,
      startsAt: new Date(2026, 9, 15, 11).toISOString(),
      status: 'pending' as const,
    };
    state.appointments = [pending];
    saveAgendaState(localStorage, state);
    render(<AgendaPage />);
    const details = screen.getByText(pending.clientName).closest('details');
    if (!details) throw new Error('Expected appointment disclosure');
    fireEvent.click(within(details).getByText(pending.clientName));

    fireEvent.click(within(details).getByRole('button', { name: `Confirmar cita de ${pending.clientName}` }));

    await waitFor(() => expect(loadAgendaState(localStorage, now).state.appointments[0]?.status).toBe('confirmed'));
    cleanup();
    render(<AdminPage />);
    const upcoming = screen.getByRole('region', { name: 'Próximas citas' });
    expect(within(upcoming).getByText(pending.clientName)).toBeTruthy();
    expect(within(upcoming).getByText('Confirmada')).toBeTruthy();
  });

  it('persists cancellation and excludes the cancelled appointment from Dashboard upcoming items', async () => {
    localStorage.setItem('webbys:demo-session', 'active');
    const state = createAgendaSeed(now);
    const appointment = state.appointments[0];
    if (!appointment) throw new Error('Expected a seeded appointment');
    const confirmed = {
      ...appointment,
      startsAt: new Date(2026, 9, 15, 11).toISOString(),
      status: 'confirmed' as const,
    };
    state.appointments = [confirmed];
    saveAgendaState(localStorage, state);
    render(<AgendaPage />);
    const details = screen.getByText(confirmed.clientName).closest('details');
    if (!details) throw new Error('Expected appointment disclosure');
    fireEvent.click(within(details).getByText(confirmed.clientName));

    fireEvent.click(within(details).getByRole('button', { name: `Cancelar cita de ${confirmed.clientName}` }));

    await waitFor(() => expect(loadAgendaState(localStorage, now).state.appointments[0]?.status).toBe('cancelled'));
    cleanup();
    render(<AdminPage />);
    expect(within(screen.getByRole('region', { name: 'Próximas citas' })).queryByText(confirmed.clientName)).toBeNull();
  });

});
