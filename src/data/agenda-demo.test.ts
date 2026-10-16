import { describe, expect, it } from 'vitest';
import { createAgendaSeed } from './agenda-demo';
import { getAvailableSlots, validateBooking } from '../services/availability';

const now = new Date(2026, 9, 14, 8, 0);

describe('createAgendaSeed', () => {
  it('creates coherent barber, client, service, schedule, exception, and appointment records', () => {
    const state = createAgendaSeed(now);
    const barberIds = new Set(state.barbers.map(({ id }) => id));
    const clientIds = new Set(state.clients.map(({ id }) => id));
    const serviceIds = new Set(state.services.map(({ id }) => id));

    expect(state.barbers).toHaveLength(3);
    expect(state.clients.length).toBeGreaterThan(3);
    expect(state.services.length).toBeGreaterThan(1);
    expect(state.schedules.every(({ barberId }) => barberIds.has(barberId))).toBe(true);
    expect(state.appointments.every((appointment) => barberIds.has(appointment.barberId) && clientIds.has(appointment.clientId))).toBe(true);
    expect(state.appointments.every(({ serviceIds: selected }) => selected.every((id) => serviceIds.has(id)))).toBe(true);
    expect(state.schedules.some(({ days }) => days.some(({ breaks }) => breaks.length > 0))).toBe(true);
    expect(state.schedules.some(({ days }) => days.length < 7)).toBe(true);
    expect(state.exceptions.some(({ unavailable }) => unavailable)).toBe(true);
    expect(state.exceptions.some(({ working }) => (working?.length ?? 0) > 0)).toBe(true);
  });

  it('provides appointments that exercise slot and conflict decisions', () => {
    const state = createAgendaSeed(now);
    const reserved = state.appointments.find(({ status }) => status === 'pending' || status === 'confirmed');

    expect(reserved).toBeDefined();
    if (!reserved) return;
    const start = new Date(reserved.startsAt);
    const date = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
    const startTime = `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`;
    const slots = getAvailableSlots(date, reserved.barberId, 30, state.schedules, state.exceptions, state.appointments, now);

    expect(slots).not.toContain(startTime);
    expect(validateBooking({
      barberId: reserved.barberId,
      startsAt: reserved.startsAt,
      durationMinutes: 30,
    }, state.schedules, state.exceptions, state.appointments, now)).toEqual({
      valid: false,
      reason: 'appointment-conflict',
    });
  });

  it('seeds each existing barber as an active completed Barber with the same ID', () => {
    const state = createAgendaSeed(now);

    expect(state.employees?.map(({ id, name, role, active, invitationStatus }) => ({
      id,
      name,
      role,
      active,
      invitationStatus,
    }))).toEqual(state.barbers.map(({ id, name }) => ({
      id,
      name,
      role: 'barber',
      active: true,
      invitationStatus: 'completed',
    })));
  });
});
