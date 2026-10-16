import { cleanup, fireEvent, render, screen, within } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AgendaState } from '../types/agenda';
import type { AppointmentRecord } from '../types/domain';
import { AgendaPanel } from './AgendaPanel';

afterEach(cleanup);

const now = new Date(2026, 9, 15, 10, 0);

function appointment(id: string, day: number, hour: number, barberId: string, barberName: string, status: AppointmentRecord['status']) {
  return {
    id,
    startsAt: new Date(2026, 9, day, hour, 0).toISOString(),
    clientId: `client-${id}`,
    clientName: `Cliente ${id}`,
    barberId,
    barberName,
    serviceIds: ['service-cut'],
    serviceName: 'Corte',
    status,
    durationMinutes: 45,
  };
}

const state: AgendaState = {
  barbers: [
    { id: 'barber-diego', name: 'Diego' },
    { id: 'barber-raul', name: 'Raúl' },
  ],
  clients: [],
  services: [],
  schedules: [],
  exceptions: [],
  appointments: [
    appointment('hoy-diego', 15, 11, 'barber-diego', 'Diego', 'pending'),
    appointment('hoy-raul', 15, 13, 'barber-raul', 'Raúl', 'confirmed'),
    appointment('manana', 16, 10, 'barber-diego', 'Diego', 'confirmed'),
    appointment('ayer', 14, 10, 'barber-diego', 'Diego', 'confirmed'),
  ],
};

describe('AgendaPanel', () => {
  it('shows the selected day and excludes appointments from other days', () => {
    render(<AgendaPanel state={state} now={now} />);

    expect(screen.getByRole('heading', { name: 'Agenda' })).toBeTruthy();
    expect(screen.getByText('Cliente hoy-diego')).toBeTruthy();
    expect(screen.getByText('Cliente hoy-raul')).toBeTruthy();
    expect(screen.queryByText('Cliente manana')).toBeNull();
    expect(screen.queryByText('Cliente ayer')).toBeNull();
  });

  it('shows the mobile month calendar and changes the selected-day appointment list', () => {
    render(<AgendaPanel state={state} now={now} />);
    const calendar = screen.getByRole('region', { name: 'Calendario mensual' });

    fireEvent.click(within(calendar).getByRole('button', { name: 'Viernes, 16 de octubre, 1 cita' }));

    expect(screen.getByText('Cliente manana')).toBeTruthy();
    expect(screen.queryByText('Cliente hoy-diego')).toBeNull();
  });

  it('switches to a week view showing seven dated days and their appointments', () => {
    render(<AgendaPanel state={state} now={now} />);
    fireEvent.click(screen.getByRole('button', { name: 'Semana' }));

    expect(screen.getByRole('heading', { name: 'Semana del 12 al 18 de octubre' })).toBeTruthy();
    const week = screen.getByRole('region', { name: 'Agenda semanal', hidden: true });
    expect(within(week).getByText('Cliente manana')).toBeTruthy();
    expect(within(week).getAllByRole('group', { name: /de octubre/i })).toHaveLength(7);
  });

  it('updates the selected date and provides navigation for the chosen day', () => {
    render(<AgendaPanel state={state} now={now} />);
    fireEvent.input(screen.getByLabelText('Fecha de la agenda'), { target: { value: '2026-10-16' } });

    expect(screen.getByText('Cliente manana')).toBeTruthy();
    expect(screen.queryByText('Cliente hoy-diego')).toBeNull();
  });

  it('filters by barber and can return to all barbers', () => {
    render(<AgendaPanel state={state} now={now} />);
    const trigger = screen.getByRole('button', { name: 'Barbero: Todos' });
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole('option', { name: 'Diego' }));

    expect(screen.getByText('Cliente hoy-diego')).toBeTruthy();
    expect(screen.queryByText('Cliente hoy-raul')).toBeNull();
    expect(screen.getByText('Pendiente')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Barbero: Diego' }));
    fireEvent.click(screen.getByRole('option', { name: 'Todos' }));
    expect(screen.getByText('Cliente hoy-raul')).toBeTruthy();
  });

  it('exposes appointment details through a keyboard-operable disclosure', () => {
    render(<AgendaPanel state={state} now={now} />);
    const details = screen.getByText('Cliente hoy-diego').closest('details');
    expect(details).toBeTruthy();
    fireEvent.click(within(details as HTMLElement).getByText('Cliente hoy-diego'));

    expect(within(details as HTMLElement).getByText('Diego')).toBeTruthy();
    expect(within(details as HTMLElement).getByText('Corte')).toBeTruthy();
  });

  it('shows an empty state when the selected date has no appointments', () => {
    render(<AgendaPanel state={{ ...state, appointments: [] }} now={now} />);

    expect(screen.getByText('No hay citas para esta fecha.')).toBeTruthy();
  });

  it('opens a booking form and returns a saved appointment to its owner', () => {
    const onAppointmentSave = vi.fn((_appointment: AppointmentRecord) => true);
    const bookingState: AgendaState = {
      ...state,
      clients: [{ id: 'client-lucia', name: 'Lucía Torres' }],
      services: [{ id: 'service-cut', name: 'Corte', durationMinutes: 45, price: 300 }],
      schedules: [{ barberId: 'barber-diego', days: [{ weekday: 4, working: [{ start: '09:00', end: '17:00' }], breaks: [] }] }],
      appointments: [],
    };
    render(<AgendaPanel state={bookingState} now={now} onAppointmentSave={onAppointmentSave} />);

    fireEvent.click(screen.getByRole('button', { name: 'Nueva cita' }));
    expect(screen.getByRole('heading', { name: 'Nueva cita' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Horario 10:00' }));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cita' }));

    expect(onAppointmentSave).toHaveBeenCalledOnce();
    expect(onAppointmentSave.mock.calls[0]?.[0]?.status).toBe('pending');
  });

  it('confirms a pending appointment through the save callback', () => {
    const pending = appointment('status-pending', 15, 11, 'barber-diego', 'Diego', 'pending');
    const onAppointmentSave = vi.fn((_appointment: AppointmentRecord) => true);
    const bookingState: AgendaState = {
      ...state,
      clients: [{ id: pending.clientId, name: pending.clientName }],
      services: [{ id: 'service-cut', name: 'Corte', durationMinutes: 45, price: 300 }],
      schedules: [{ barberId: 'barber-diego', days: [{ weekday: 4, working: [{ start: '09:00', end: '17:00' }], breaks: [] }] }],
      appointments: [pending],
    };
    render(<AgendaPanel state={bookingState} now={now} onAppointmentSave={onAppointmentSave} />);
    const details = screen.getByText(pending.clientName).closest('details');
    if (!details) throw new Error('Expected appointment disclosure');
    fireEvent.click(within(details).getByText(pending.clientName));

    fireEvent.click(within(details).getByRole('button', { name: `Confirmar cita de ${pending.clientName}` }));

    expect(onAppointmentSave.mock.calls[0]?.[0]?.id).toBe(pending.id);
    expect(onAppointmentSave.mock.calls[0]?.[0]?.status).toBe('confirmed');
  });

  it('completes a confirmed appointment through the save callback', () => {
    const confirmed = appointment('status-confirmed', 15, 11, 'barber-diego', 'Diego', 'confirmed');
    const onAppointmentSave = vi.fn((_appointment: AppointmentRecord) => true);
    const bookingState: AgendaState = {
      ...state,
      clients: [{ id: confirmed.clientId, name: confirmed.clientName }],
      services: [{ id: 'service-cut', name: 'Corte', durationMinutes: 45, price: 300 }],
      schedules: [{ barberId: 'barber-diego', days: [{ weekday: 4, working: [{ start: '09:00', end: '17:00' }], breaks: [] }] }],
      appointments: [confirmed],
    };
    render(<AgendaPanel state={bookingState} now={now} onAppointmentSave={onAppointmentSave} />);
    const details = screen.getByText(confirmed.clientName).closest('details');
    if (!details) throw new Error('Expected appointment disclosure');
    fireEvent.click(within(details).getByText(confirmed.clientName));

    fireEvent.click(within(details).getByRole('button', { name: `Completar cita de ${confirmed.clientName}` }));

    expect(onAppointmentSave.mock.calls[0]?.[0]?.status).toBe('completed');
  });

  it('cancels an active appointment through the save callback', () => {
    const confirmed = appointment('status-cancel', 15, 11, 'barber-diego', 'Diego', 'confirmed');
    const onAppointmentSave = vi.fn((_appointment: AppointmentRecord) => true);
    const bookingState: AgendaState = {
      ...state,
      clients: [{ id: confirmed.clientId, name: confirmed.clientName }],
      services: [{ id: 'service-cut', name: 'Corte', durationMinutes: 45, price: 300 }],
      schedules: [{ barberId: 'barber-diego', days: [{ weekday: 4, working: [{ start: '09:00', end: '17:00' }], breaks: [] }] }],
      appointments: [confirmed],
    };
    render(<AgendaPanel state={bookingState} now={now} onAppointmentSave={onAppointmentSave} />);
    const details = screen.getByText(confirmed.clientName).closest('details');
    if (!details) throw new Error('Expected appointment disclosure');
    fireEvent.click(within(details).getByText(confirmed.clientName));

    fireEvent.click(within(details).getByRole('button', { name: `Cancelar cita de ${confirmed.clientName}` }));

    expect(onAppointmentSave.mock.calls[0]?.[0]?.status).toBe('cancelled');
  });

  it('keeps the appointment identity when rescheduling and closes without saving on cancel', () => {
    const existing = appointment('reschedule-identity', 15, 11, 'barber-diego', 'Diego', 'confirmed');
    const onAppointmentSave = vi.fn((_appointment: AppointmentRecord) => true);
    const bookingState: AgendaState = {
      ...state,
      clients: [{ id: existing.clientId, name: existing.clientName }],
      services: [{ id: 'service-cut', name: 'Corte', durationMinutes: 45, price: 300 }],
      schedules: [{ barberId: 'barber-diego', days: [{ weekday: 4, working: [{ start: '09:00', end: '17:00' }], breaks: [] }] }],
      appointments: [existing],
    };
    render(<AgendaPanel state={bookingState} now={now} onAppointmentSave={onAppointmentSave} />);
    const details = screen.getByText(existing.clientName).closest('details');
    if (!details) throw new Error('Expected appointment disclosure');
    fireEvent.click(within(details).getByText(existing.clientName));
    fireEvent.click(within(details).getByRole('button', { name: `Reprogramar cita de ${existing.clientName}` }));
    expect(screen.getByRole('heading', { name: 'Reprogramar cita' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(onAppointmentSave.mock.calls[0]?.[0]?.id).toBe(existing.id);
    expect(onAppointmentSave.mock.calls[0]?.[0]?.startsAt).toBe(existing.startsAt);

    fireEvent.click(screen.getByRole('button', { name: 'Nueva cita' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onAppointmentSave).toHaveBeenCalledOnce();
    expect(screen.queryByRole('heading', { name: 'Nueva cita' })).toBeNull();
  });

  it('announces a successful status change from the weekly view', () => {
    const pending = state.appointments[0];
    if (!pending) throw new Error('Expected a pending appointment');
    const onAppointmentSave = vi.fn((_appointment: AppointmentRecord) => true);
    render(<AgendaPanel state={{ ...state, appointments: [pending] }} now={now} onAppointmentSave={onAppointmentSave} />);
    fireEvent.click(screen.getByRole('button', { name: 'Semana' }));
    const week = screen.getByRole('region', { name: 'Agenda semanal', hidden: true });
    const details = within(week).getByText(pending.clientName).closest('details');
    if (!details) throw new Error('Expected appointment disclosure');
    fireEvent.click(within(details).getByText(pending.clientName));

    fireEvent.click(within(details).getByRole('button', { name: `Confirmar cita de ${pending.clientName}` }));

    expect(screen.getByRole('status').textContent).toContain('Estado actualizado: Confirmada.');
  });

});
