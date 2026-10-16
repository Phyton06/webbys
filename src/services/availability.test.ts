import { describe, expect, it } from 'vitest';
import type { AppointmentRecord } from '../types/domain';
import type { AvailabilityException, BarberSchedule, BookingCandidate, TimeInterval } from '../types/agenda';
import { getAvailableSlots, validateBooking, validateScheduleIntervals } from './availability';

const now = new Date(2026, 9, 15, 8, 0);
const date = '2026-10-15';

function localStart(hour: number, minute = 0, day = 15): string {
  return new Date(2026, 9, day, hour, minute).toISOString();
}

function barberSchedule(working: TimeInterval[] = [{ start: '09:00', end: '17:00' }], breaks: TimeInterval[] = []): BarberSchedule {
  return { barberId: 'barber-1', days: [{ weekday: 4, working, breaks }] };
}

function booking(hour: number, minute = 0, durationMinutes = 30, id?: string): BookingCandidate {
  return { id, barberId: 'barber-1', startsAt: localStart(hour, minute), durationMinutes };
}

function appointment(
  hour: number,
  minute: number,
  status: AppointmentRecord['status'] = 'confirmed',
  durationMinutes = 30,
  id = `appointment-${hour}-${minute}`,
): AppointmentRecord {
  return {
    id,
    startsAt: localStart(hour, minute),
    clientId: 'client-1',
    clientName: 'Lucía Torres',
    barberId: 'barber-1',
    barberName: 'Diego',
    serviceIds: ['service-cut'],
    serviceName: 'Corte',
    status,
    durationMinutes,
  };
}

describe('validateScheduleIntervals', () => {
  it('accepts ordered work and breaks contained inside a working interval', () => {
    const working: TimeInterval[] = [{ start: '09:00', end: '12:00' }, { start: '13:00', end: '17:00' }];

    expect(validateScheduleIntervals(working, [{ start: '10:00', end: '10:15' }])).toEqual({ valid: true });
  });

  it('rejects malformed and reversed time intervals', () => {
    expect(validateScheduleIntervals([{ start: '17:00', end: '09:00' }], [])).toEqual({
      valid: false,
      reason: 'invalid-interval',
    });
  });

  it('rejects overlapping working intervals', () => {
    expect(validateScheduleIntervals([{ start: '09:00', end: '12:00' }, { start: '11:00', end: '13:00' }], [])).toEqual({
      valid: false,
      reason: 'overlapping-working-intervals',
    });
  });

  it('rejects breaks outside work and overlapping breaks', () => {
    expect(validateScheduleIntervals([{ start: '09:00', end: '12:00' }], [{ start: '12:00', end: '13:00' }])).toEqual({
      valid: false,
      reason: 'break-outside-working-hours',
    });
    expect(validateScheduleIntervals([{ start: '09:00', end: '17:00' }], [{ start: '12:00', end: '13:00' }, { start: '12:30', end: '13:30' }])).toEqual({
      valid: false,
      reason: 'overlapping-breaks',
    });
  });
});

describe('validateBooking', () => {
  it('accepts an appointment entirely within a working interval', () => {
    expect(validateBooking(booking(9, 15), [barberSchedule()], [], [], now)).toEqual({ valid: true });
  });

  it('rejects start times that are not on a 15-minute boundary', () => {
    expect(validateBooking(booking(9, 10), [barberSchedule()], [], [], now)).toEqual({
      valid: false,
      reason: 'invalid-time-increment',
    });
  });

  it('accepts a duration that ends exactly at closing', () => {
    expect(validateBooking(booking(16, 30, 30), [barberSchedule()], [], [], now)).toEqual({ valid: true });
  });

  it('rejects a duration that crosses closing', () => {
    expect(validateBooking(booking(16, 30, 45), [barberSchedule()], [], [], now)).toEqual({
      valid: false,
      reason: 'outside-working-hours',
    });
  });

  it('rejects a booking that intersects a break', () => {
    expect(validateBooking(booking(11, 45), [barberSchedule(undefined, [{ start: '12:00', end: '13:00' }])], [], [], now)).toEqual({
      valid: false,
      reason: 'break-conflict',
    });
  });

  it('rejects dates on which the barber has no recurring workday', () => {
    const schedule: BarberSchedule = { barberId: 'barber-1', days: [{ weekday: 6, working: [{ start: '09:00', end: '17:00' }], breaks: [] }] };

    expect(validateBooking(booking(9), [schedule], [], [], now)).toEqual({ valid: false, reason: 'barber-off' });
  });

  it('applies replacement hours from a date exception rather than recurring hours', () => {
    const exception: AvailabilityException = {
      barberId: 'barber-1',
      date,
      unavailable: false,
      working: [{ start: '13:00', end: '15:00' }],
      breaks: [],
    };

    expect(validateBooking(booking(9), [barberSchedule()], [exception], [], now)).toEqual({
      valid: false,
      reason: 'outside-working-hours',
    });
    expect(validateBooking(booking(13), [barberSchedule()], [exception], [], now)).toEqual({ valid: true });
  });

  it('honors a date-specific day off over an open recurring schedule', () => {
    const exception: AvailabilityException = { barberId: 'barber-1', date, unavailable: true };

    expect(validateBooking(booking(13), [barberSchedule()], [exception], [], now)).toEqual({ valid: false, reason: 'barber-off' });
  });

  it.each(['pending', 'confirmed'] as const)('treats %s appointments as blocking conflicts', (status) => {
    expect(validateBooking(booking(10, 15), [barberSchedule()], [], [appointment(10, 30, status)], now)).toEqual({
      valid: false,
      reason: 'appointment-conflict',
    });
  });

  it('does not treat cancelled appointments as conflicts', () => {
    expect(validateBooking(booking(10, 15), [barberSchedule()], [], [appointment(10, 30, 'cancelled')], now)).toEqual({ valid: true });
  });

  it('allows bookings whose boundary exactly touches an existing appointment', () => {
    expect(validateBooking(booking(10, 30), [barberSchedule()], [], [appointment(10, 0)], now)).toEqual({ valid: true });
  });

  it('ignores the appointment being edited during final reschedule validation', () => {
    const existing = appointment(10, 0, 'confirmed', 45, 'editing');

    expect(validateBooking(booking(10, 0, 45, existing.id), [barberSchedule()], [], [existing], now)).toEqual({ valid: true });
  });

  it('rejects appointments that have already started', () => {
    expect(validateBooking(booking(9), [barberSchedule()], [], [], new Date(2026, 9, 15, 10, 0))).toEqual({ valid: false, reason: 'past' });
  });
});

describe('getAvailableSlots', () => {
  it('returns 15-minute starts only when the complete service duration fits', () => {
    const slots = getAvailableSlots(date, 'barber-1', 45, [barberSchedule()], [], [], now);

    expect(slots[0]).toBe('09:00');
    expect(slots.at(-1)).toBe('16:15');
    expect(slots.every((slot) => Number(slot.slice(-2)) % 15 === 0)).toBe(true);
    expect(slots).not.toContain('16:30');
  });

  it('omits start times whose duration would cross a break', () => {
    const slots = getAvailableSlots(date, 'barber-1', 45, [barberSchedule(undefined, [{ start: '12:00', end: '13:00' }])], [], [], now);

    expect(slots).toContain('11:15');
    expect(slots).not.toContain('11:30');
    expect(slots).toContain('13:00');
  });

  it('omits active conflicts and makes cancelled appointment intervals available', () => {
    const busy = appointment(10, 0, 'confirmed', 45);
    const activeSlots = getAvailableSlots(date, 'barber-1', 30, [barberSchedule()], [], [busy], now);
    const cancelledSlots = getAvailableSlots(date, 'barber-1', 30, [barberSchedule()], [], [{ ...busy, status: 'cancelled' }], now);

    expect(activeSlots).not.toContain('10:00');
    expect(activeSlots).toContain('10:45');
    expect(cancelledSlots).toContain('10:00');
  });

  it('returns no times for an invalid local calendar date', () => {
    expect(getAvailableSlots('2026-02-30', 'barber-1', 30, [barberSchedule()], [], [], now)).toEqual([]);
  });
});
