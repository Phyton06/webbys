import { describe, expect, it } from 'vitest';
import type { AppointmentRecord } from '../types/domain';
import { getEffectiveAppointmentStatus } from './appointment-lifecycle';

const appointment: AppointmentRecord = {
  id: 'appointment-1', startsAt: '2026-10-20T10:00:00.000Z', clientId: 'client-1', clientName: 'Client',
  barberId: 'barber-1', barberName: 'Diego', serviceIds: ['service-1'], serviceName: 'Corte',
  status: 'confirmed', durationMinutes: 45,
};

describe('getEffectiveAppointmentStatus', () => {
  it('completes at the estimated end time, not at the start time', () => {
    expect(getEffectiveAppointmentStatus(appointment, new Date('2026-10-20T10:44:59.999Z'))).toBe('confirmed');
    expect(getEffectiveAppointmentStatus(appointment, new Date('2026-10-20T10:45:00.000Z'))).toBe('completed');
  });

  it('treats a paid appointment as completed but preserves cancellation', () => {
    expect(getEffectiveAppointmentStatus({ ...appointment, paymentStatus: 'paid' }, new Date('2026-10-20T09:00:00Z'))).toBe('completed');
    expect(getEffectiveAppointmentStatus({ ...appointment, status: 'cancelled', paymentStatus: 'paid' }, new Date('2026-10-20T12:00:00Z'))).toBe('cancelled');
  });
});
