import { cleanup, fireEvent, render, screen, within } from '@testing-library/preact';
import { afterEach, describe, expect, it } from 'vitest';
import type { AgendaState } from '../types/agenda';
import { AgendaAvailabilityPanel } from './AgendaAvailabilityPanel';

afterEach(cleanup);

const now = new Date(2026, 9, 15, 10, 5);
const schedule = (barberId: string) => ({
  barberId,
  days: [{ weekday: 4, working: [{ start: '09:00', end: '17:00' }], breaks: [{ start: '12:00', end: '13:00' }] }],
});

const state: AgendaState = {
  barbers: [
    { id: 'barber-diego', name: 'Diego' },
    { id: 'barber-raul', name: 'Raúl' },
  ],
  clients: [{ id: 'client-lucia', name: 'Lucía Torres' }],
  services: [
    { id: 'service-cut', name: 'Corte', durationMinutes: 45, price: 300 },
    { id: 'service-beard', name: 'Barba', durationMinutes: 30, price: 250 },
  ],
  schedules: [schedule('barber-diego'), schedule('barber-raul')],
  exceptions: [],
  appointments: [{
    id: 'appointment-busy',
    startsAt: new Date(2026, 9, 15, 11, 0).toISOString(),
    clientId: 'client-lucia',
    clientName: 'Lucía Torres',
    barberId: 'barber-diego',
    barberName: 'Diego',
    serviceIds: ['service-cut'],
    serviceName: 'Corte',
    status: 'confirmed',
    durationMinutes: 45,
  }],
};

describe('AgendaAvailabilityPanel', () => {
  it('groups available starts by barber and excludes conflicts for the full duration', () => {
    render(<AgendaAvailabilityPanel state={state} date="2026-10-15" barberId="all" now={now} />);

    const diego = screen.getByRole('group', { name: 'Horarios de Diego' });
    const raul = screen.getByRole('group', { name: 'Horarios de Raúl' });
    fireEvent.click(within(diego).getByText('Diego'));
    fireEvent.click(within(raul).getByText('Raúl'));

    expect(within(diego).getByText('10:15')).toBeTruthy();
    expect(within(diego).queryByText('10:30')).toBeNull();
    expect(within(diego).queryByText('16:30')).toBeNull();
    expect(within(raul).getByText('16:15')).toBeTruthy();
  });

  it('recomputes available starts when the service duration changes', () => {
    render(<AgendaAvailabilityPanel state={state} date="2026-10-15" barberId="barber-diego" now={now} />);
    const diego = screen.getByRole('group', { name: 'Horarios de Diego' });

    expect(within(diego).queryByText('16:30')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Servicio: Corte · 45 min' }));
    fireEvent.click(screen.getByRole('option', { name: 'Barba · 30 min' }));
    expect(within(diego).getByText('16:30')).toBeTruthy();
  });

  it('shows availability only for active Barber employees', () => {
    const staffState: AgendaState = {
      ...state,
      barbers: [...state.barbers, { id: 'barber-ana', name: 'Ana' }],
      employees: [
        { id: 'barber-diego', name: 'Diego', phone: '555-0101', role: 'barber', active: true, invitationStatus: 'completed' },
        { id: 'barber-raul', name: 'Raúl', phone: '555-0102', role: 'barber', active: false, invitationStatus: 'completed' },
        { id: 'barber-ana', name: 'Ana', phone: '555-0103', role: 'assistant', active: true, invitationStatus: 'completed' },
      ],
      schedules: [...state.schedules, schedule('barber-ana')],
    };
    render(<AgendaAvailabilityPanel state={staffState} date="2026-10-15" barberId="all" now={now} />);

    expect(screen.getByRole('group', { name: 'Horarios de Diego' })).toBeTruthy();
    expect(screen.queryByRole('group', { name: 'Horarios de Raúl' })).toBeNull();
    expect(screen.queryByRole('group', { name: 'Horarios de Ana' })).toBeNull();
  });
});
