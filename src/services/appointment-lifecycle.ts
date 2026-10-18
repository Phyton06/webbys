import type { AppointmentRecord, AppointmentStatus } from '../types/domain';

export function getEffectiveAppointmentStatus(appointment: AppointmentRecord, now: Date): AppointmentStatus {
  if (appointment.status === 'cancelled') return 'cancelled';
  if (appointment.status === 'completed' || appointment.paymentStatus === 'paid') return 'completed';

  const startsAt = new Date(appointment.startsAt).getTime();
  if (!Number.isFinite(startsAt) || !Number.isInteger(appointment.durationMinutes) || appointment.durationMinutes <= 0) {
    return appointment.status;
  }
  return now.getTime() >= startsAt + appointment.durationMinutes * 60_000 ? 'completed' : appointment.status;
}
