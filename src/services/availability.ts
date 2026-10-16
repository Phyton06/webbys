import {
  BOOKING_FAILURE,
  SCHEDULE_FAILURE,
  type AvailabilityException,
  type BarberSchedule,
  type BookingCandidate,
  type BookingValidation,
  type ScheduleValidation,
  type TimeInterval,
} from '../types/agenda';
import type { AppointmentRecord } from '../types/domain';

const localTimePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const localDatePattern = /^(\d{4})-(\d{2})-(\d{2})$/;
const slotIncrementMinutes = 15;

interface MinuteInterval {
  start: number;
  end: number;
}

function minutesSinceMidnight(value: string): number | undefined {
  if (!localTimePattern.test(value)) return undefined;
  const [hours, minutes] = value.split(':').map(Number);
  if (hours === undefined || minutes === undefined) return undefined;
  return hours * 60 + minutes;
}

function toMinuteIntervals(intervals: TimeInterval[]): MinuteInterval[] | undefined {
  const parsed: MinuteInterval[] = [];
  for (const interval of intervals) {
    const start = minutesSinceMidnight(interval.start);
    const end = minutesSinceMidnight(interval.end);
    if (start === undefined || end === undefined || start >= end) return undefined;
    parsed.push({ start, end });
  }
  return parsed;
}

function hasOverlaps(intervals: MinuteInterval[]): boolean {
  const ordered = [...intervals].sort((first, second) => first.start - second.start);
  return ordered.some((interval, index) => index > 0 && interval.start < (ordered[index - 1]?.end ?? 0));
}

function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseLocalDate(value: string): Date | undefined {
  const match = localDatePattern.exec(value);
  if (!match) return undefined;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return undefined;
  return date;
}

function effectiveSchedule(
  barberId: string,
  date: Date,
  schedules: BarberSchedule[],
  exceptions: AvailabilityException[],
): { working: TimeInterval[]; breaks: TimeInterval[] } | undefined {
  const exception = exceptions.find((entry) => entry.barberId === barberId && entry.date === localDateKey(date));
  if (exception) {
    if (exception.unavailable) return undefined;
    return { working: exception.working ?? [], breaks: exception.breaks ?? [] };
  }

  const day = schedules
    .find((entry) => entry.barberId === barberId)
    ?.days.find((entry) => entry.weekday === date.getDay());
  if (!day) return undefined;
  return { working: day.working, breaks: day.breaks };
}

export function validateScheduleIntervals(working: TimeInterval[], breaks: TimeInterval[]): ScheduleValidation {
  const workIntervals = toMinuteIntervals(working);
  const breakIntervals = toMinuteIntervals(breaks);
  if (!workIntervals || !breakIntervals) return { valid: false, reason: SCHEDULE_FAILURE.INVALID_INTERVAL };
  if (hasOverlaps(workIntervals)) return { valid: false, reason: SCHEDULE_FAILURE.OVERLAPPING_WORKING_INTERVALS };
  if (hasOverlaps(breakIntervals)) return { valid: false, reason: SCHEDULE_FAILURE.OVERLAPPING_BREAKS };

  const breakFits = breakIntervals.every((pause) =>
    workIntervals.some((work) => pause.start >= work.start && pause.end <= work.end),
  );
  if (!breakFits) return { valid: false, reason: SCHEDULE_FAILURE.BREAK_OUTSIDE_WORKING_HOURS };
  return { valid: true };
}

export function validateBooking(
  candidate: BookingCandidate,
  schedules: BarberSchedule[],
  exceptions: AvailabilityException[],
  appointments: AppointmentRecord[],
  now: Date,
): BookingValidation {
  const startsAt = new Date(candidate.startsAt);
  if (!Number.isFinite(startsAt.getTime())) return { valid: false, reason: BOOKING_FAILURE.INVALID_DATE };
  if (!Number.isInteger(candidate.durationMinutes) || candidate.durationMinutes <= 0) {
    return { valid: false, reason: BOOKING_FAILURE.INVALID_DURATION };
  }
  if (startsAt.getMinutes() % 15 !== 0 || startsAt.getSeconds() !== 0 || startsAt.getMilliseconds() !== 0) {
    return { valid: false, reason: BOOKING_FAILURE.INVALID_TIME_INCREMENT };
  }
  if (startsAt.getTime() < now.getTime()) return { valid: false, reason: BOOKING_FAILURE.PAST };

  const daily = effectiveSchedule(candidate.barberId, startsAt, schedules, exceptions);
  if (!daily || daily.working.length === 0) return { valid: false, reason: BOOKING_FAILURE.BARBER_OFF };

  const scheduleValidation = validateScheduleIntervals(daily.working, daily.breaks);
  if (!scheduleValidation.valid) return { valid: false, reason: BOOKING_FAILURE.INVALID_SCHEDULE };

  const startMinutes = startsAt.getHours() * 60 + startsAt.getMinutes();
  const endMinutes = startMinutes + candidate.durationMinutes;
  const workIntervals = toMinuteIntervals(daily.working) ?? [];
  const fitsWork = workIntervals.some((work) => startMinutes >= work.start && endMinutes <= work.end);
  if (!fitsWork) return { valid: false, reason: BOOKING_FAILURE.OUTSIDE_WORKING_HOURS };

  const breakIntervals = toMinuteIntervals(daily.breaks) ?? [];
  if (breakIntervals.some((pause) => startMinutes < pause.end && endMinutes > pause.start)) {
    return { valid: false, reason: BOOKING_FAILURE.BREAK_CONFLICT };
  }

  const candidateEnd = startsAt.getTime() + candidate.durationMinutes * 60_000;
  const hasConflict = appointments.some((appointment) => {
    if (appointment.id === candidate.id || appointment.barberId !== candidate.barberId) return false;
    if (appointment.status !== 'pending' && appointment.status !== 'confirmed') return false;
    const appointmentStart = new Date(appointment.startsAt).getTime();
    if (!Number.isFinite(appointmentStart)) return true;
    const appointmentEnd = appointmentStart + appointment.durationMinutes * 60_000;
    return startsAt.getTime() < appointmentEnd && candidateEnd > appointmentStart;
  });
  if (hasConflict) return { valid: false, reason: BOOKING_FAILURE.APPOINTMENT_CONFLICT };

  return { valid: true };
}

export function getAvailableSlots(
  dateKey: string,
  barberId: string,
  durationMinutes: number,
  schedules: BarberSchedule[],
  exceptions: AvailabilityException[],
  appointments: AppointmentRecord[],
  now: Date,
  ignoreAppointmentId?: string,
): string[] {
  const date = parseLocalDate(dateKey);
  if (!date || !Number.isInteger(durationMinutes) || durationMinutes <= 0) return [];

  const daily = effectiveSchedule(barberId, date, schedules, exceptions);
  if (!daily || !validateScheduleIntervals(daily.working, daily.breaks).valid) return [];

  const workIntervals = toMinuteIntervals(daily.working) ?? [];
  const slots: string[] = [];
  for (const work of workIntervals) {
    const firstSlot = Math.ceil(work.start / slotIncrementMinutes) * slotIncrementMinutes;
    for (let start = firstSlot; start + durationMinutes <= work.end; start += slotIncrementMinutes) {
      const localStart = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        Math.floor(start / 60),
        start % 60,
      );
      if (localStart.getHours() * 60 + localStart.getMinutes() !== start) continue;

      const result = validateBooking(
        { ...(ignoreAppointmentId ? { id: ignoreAppointmentId } : {}), barberId, startsAt: localStart.toISOString(), durationMinutes },
        schedules,
        exceptions,
        appointments,
        now,
      );
      if (result.valid) {
        slots.push(`${String(Math.floor(start / 60)).padStart(2, '0')}:${String(start % 60).padStart(2, '0')}`);
      }
    }
  }
  return slots;
}
