import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAgendaSeed } from '../data/agenda-demo';
import type { AgendaState } from '../types/agenda';
import type { AppointmentRecord } from '../types/domain';
import { AppointmentForm } from './AppointmentForm';

afterEach(cleanup);

const now = new Date(2026, 9, 15, 8, 0);

function createFormState(): AgendaState {
  const state = createAgendaSeed(now);
  state.appointments = state.appointments.filter((appointment) => appointment.id !== 'demo-appointment-1');
  return state;
}

describe('AppointmentForm', () => {
  it('shows total duration and price for selected services', () => {
    render(<AppointmentForm state={createFormState()} now={now} onSave={vi.fn(() => true)} onCancel={vi.fn()} />);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Servicio Barba · 30 min' }));

    expect(screen.getByText('Duración total: 75 min')).toBeTruthy();
    expect(screen.getByText('Precio estimado: $550')).toBeTruthy();
  });

  it('updates available starts when the selected barber changes', () => {
    render(<AppointmentForm state={createFormState()} now={now} onSave={vi.fn(() => true)} onCancel={vi.fn()} />);
    const before = screen.getAllByRole('button', { name: /^Horario/ }).map((option) => option.textContent);

    fireEvent.click(screen.getByRole('button', { name: 'Barbero: Diego' }));
    fireEvent.click(screen.getByRole('option', { name: 'Raúl' }));

    const after = screen.getAllByRole('button', { name: /^Horario/ }).map((option) => option.textContent);
    expect(after).not.toEqual(before);
  });

  it('offers only active Barber employees when creating a new appointment', () => {
    const state = createFormState();
    state.employees = (state.employees ?? []).map((employee) => {
      if (employee.id === 'barber-2') return { ...employee, active: false };
      if (employee.id === 'barber-3') return { ...employee, role: 'assistant' };
      return employee;
    });
    render(<AppointmentForm state={state} now={now} onSave={vi.fn(() => true)} onCancel={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Barbero: Diego' }));

    expect(screen.getByRole('option', { name: 'Diego' })).toBeTruthy();
    expect(screen.queryByRole('option', { name: 'Raúl' })).toBeNull();
    expect(screen.queryByRole('option', { name: 'Andrés' })).toBeNull();
  });

  it('keeps an assigned inactive or changed-role Barber selectable while editing', () => {
    const state = createFormState();
    const existing = {
      id: 'existing-inactive-barber',
      startsAt: new Date(2026, 9, 15, 10, 0).toISOString(),
      clientId: 'client-1',
      clientName: 'Lucía Torres',
      barberId: 'barber-2',
      barberName: 'Raúl',
      serviceIds: ['service-1'],
      serviceName: 'Corte',
      status: 'confirmed' as const,
      durationMinutes: 45,
    };
    state.appointments = [existing];
    state.employees = (state.employees ?? []).map((employee) => {
      if (employee.id === 'barber-2') return { ...employee, active: false, role: 'assistant' };
      if (employee.id === 'barber-3') return { ...employee, role: 'assistant' };
      return employee;
    });
    render(<AppointmentForm state={state} appointment={existing} now={now} onSave={vi.fn(() => true)} onCancel={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Barbero: Raúl' }));

    expect(screen.getByRole('option', { name: 'Raúl' })).toBeTruthy();
    expect(screen.queryByRole('option', { name: 'Andrés' })).toBeNull();
  });

  it('offers only active services for new appointments', () => {
    const state = createFormState();
    state.services = state.services.map((service, index) => index === 1 ? { ...service, active: false } : service);
    render(<AppointmentForm state={state} now={now} onSave={vi.fn(() => true)} onCancel={vi.fn()} />);

    expect(screen.getByLabelText(/Servicio Corte ·/)).toBeTruthy();
    expect(screen.queryByLabelText(/Servicio Barba ·/)).toBeNull();
  });

  it('retains an assigned inactive service and its estimate while editing an appointment', () => {
    const state = createFormState();
    const appointment = {
      id: 'appointment-existing',
      startsAt: new Date(2026, 9, 15, 10, 0).toISOString(),
      clientId: 'client-1',
      clientName: 'Lucía Torres',
      barberId: 'barber-1',
      barberName: 'Diego',
      serviceIds: ['service-2'],
      serviceName: 'Barba',
      status: 'confirmed' as const,
      durationMinutes: 30,
    };
    state.appointments = [appointment];
    state.services = state.services.map((service) => service.id === 'service-2' ? { ...service, active: false } : service);
    render(<AppointmentForm state={state} appointment={appointment} now={now} onSave={vi.fn(() => true)} onCancel={vi.fn()} />);

    expect(screen.getByLabelText(/Servicio Barba ·/)).toBeTruthy();
    expect(screen.getByText(/Precio estimado:/)).toBeTruthy();
  });

  it('uses the branded month calendar to select an appointment date', () => {
    render(<AppointmentForm state={createFormState()} now={now} onSave={vi.fn((_appointment: AppointmentRecord) => true)} onCancel={vi.fn()} />);
    expect(screen.queryByLabelText('Fecha de la cita')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /^Fecha de la cita:/ }));
    const calendar = within(screen.getByRole('dialog')).getByRole('region', { name: 'Calendario mensual' });

    fireEvent.click(within(calendar).getByRole('button', { name: /^Viernes, 16 de octubre/ }));

    expect(screen.getByRole('button', { name: 'Fecha de la cita: viernes, 16 de octubre' })).toBeTruthy();
    expect(within(screen.getByRole('dialog')).queryByRole('region', { name: 'Calendario mensual' })).toBeNull();
    expect(screen.getByRole('button', { name: /Horario 09:00/ })).toBeTruthy();
  });

  it('keeps the calendar open and date unchanged when navigating between months', () => {
    render(<AppointmentForm state={createFormState()} now={now} onSave={vi.fn((_appointment: AppointmentRecord) => true)} onCancel={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /^Fecha de la cita:/ }));
    const dialog = screen.getByRole('dialog');

    fireEvent.click(within(dialog).getByRole('button', { name: 'Mes siguiente' }));

    expect(within(dialog).getByRole('heading', { name: 'Noviembre de 2026' })).toBeTruthy();
    expect(within(dialog).getByRole('region', { name: 'Calendario mensual' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Fecha de la cita: jueves, 15 de octubre' })).toBeTruthy();
  });

  it('creates an appointment only after revalidating the selected slot', async () => {
    const state = createFormState();
    const onSave = vi.fn((_appointment: AppointmentRecord) => true);
    render(<AppointmentForm state={state} now={now} onSave={onSave} onCancel={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /Horario 09:15/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cita' }));

    await waitFor(() => expect(onSave).toHaveBeenCalledOnce());
    const saved = onSave.mock.calls[0]?.[0];
    expect(saved?.clientName).toBe('Lucía Torres');
    expect(saved?.startsAt).toBe(new Date(2026, 9, 15, 9, 15).toISOString());
    expect(saved?.status).toBe('pending');
  });

  it('clears a selected start when a longer service no longer fits and does not save', () => {
    const state = createFormState();
    const day = state.schedules[0]?.days.find(({ weekday }) => weekday === 4);
    if (!day) throw new Error('Expected a Thursday schedule');
    day.working = [{ start: '09:00', end: '12:00' }];
    day.breaks = [];
    const onSave = vi.fn((_appointment: AppointmentRecord) => true);
    render(<AppointmentForm state={state} now={now} onSave={onSave} onCancel={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /^Fecha de la cita:/ }));
    const calendar = within(screen.getByRole('dialog')).getByRole('region', { name: 'Calendario mensual' });
    fireEvent.click(within(calendar).getByRole('button', { name: /^Viernes, 16 de octubre/ }));
    fireEvent.click(screen.getByRole('button', { name: /Horario 11:15/ }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Servicio Barba · 30 min' }));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cita' }));

    expect(screen.getByRole('alert').textContent).toContain('horario disponible');
    expect(onSave).not.toHaveBeenCalled();
  });

  it('revalidates a stale slot against appointments added after the form opened', () => {
    const state = createFormState();
    const onSave = vi.fn((_appointment: AppointmentRecord) => true);
    render(<AppointmentForm state={state} now={now} onSave={onSave} onCancel={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /Horario 09:15/ }));
    state.appointments.push({
      id: 'new-conflict',
      startsAt: new Date(2026, 9, 15, 9, 15).toISOString(),
      clientId: 'client-1',
      clientName: 'Lucía Torres',
      barberId: 'barber-1',
      barberName: 'Diego',
      serviceIds: ['service-1'],
      serviceName: 'Corte',
      status: 'confirmed',
      durationMinutes: 45,
    });

    fireEvent.click(screen.getByRole('button', { name: 'Guardar cita' }));

    expect(screen.getByRole('alert').textContent).toContain('ya no está disponible');
    expect(onSave).not.toHaveBeenCalled();
  });

  it('preselects the existing record and allows its own slot during rescheduling', () => {
    const state = createFormState();
    state.appointments = [];
    const existing = {
      id: 'existing-booking',
      startsAt: new Date(2026, 9, 15, 10, 0).toISOString(),
      clientId: 'client-1',
      clientName: 'Lucía Torres',
      barberId: 'barber-1',
      barberName: 'Diego',
      serviceIds: ['service-1'],
      serviceName: 'Corte',
      status: 'confirmed' as const,
      durationMinutes: 45,
    };
    state.appointments.push(existing);
    const onSave = vi.fn((_appointment: AppointmentRecord) => true);
    render(<AppointmentForm state={state} appointment={existing} now={now} onSave={onSave} onCancel={vi.fn()} />);

    expect(screen.getByRole('button', { name: /Horario 10:00/ })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(screen.queryByRole('alert')?.textContent).toBeFalsy();
    expect(onSave.mock.calls[0]?.[0]?.id).toBe(existing.id);
  });
});
