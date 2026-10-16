import type { AppointmentRecord, AppointmentStatus } from '../types/domain';
import { AGENDA_LOAD_STATUS, type AgendaLoadResult, type AgendaState, type AvailabilityException, type BarberSchedule, type ClientRecord, type ServiceRecord, type TimeInterval } from '../types/agenda';
import { createAgendaSeed } from '../data/agenda-demo';
import { validateScheduleIntervals } from './availability';

export const AGENDA_STORAGE_KEY = 'webbys:agenda:v1';
export const AGENDA_STORAGE_VERSION = 1;

interface AgendaStorageEnvelope {
  version: number;
  state: AgendaState;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isString);
}

function isTimeInterval(value: unknown): value is TimeInterval {
  return isRecord(value) && isString(value.start) && isString(value.end);
}

function isTimeIntervalArray(value: unknown): value is TimeInterval[] {
  return Array.isArray(value) && value.every(isTimeInterval);
}

function isBarberSchedule(value: unknown): value is BarberSchedule {
  if (!isRecord(value) || !isString(value.barberId) || !Array.isArray(value.days)) return false;
  return value.days.every((day) => {
    if (!isRecord(day) || typeof day.weekday !== 'number' || !Number.isInteger(day.weekday) || day.weekday < 0 || day.weekday > 6) {
      return false;
    }
    if (!isTimeIntervalArray(day.working) || !isTimeIntervalArray(day.breaks)) return false;
    return validateScheduleIntervals(day.working, day.breaks).valid;
  });
}

function isAvailabilityException(value: unknown): value is AvailabilityException {
  if (!isRecord(value) || !isString(value.barberId) || !isString(value.date) || typeof value.unavailable !== 'boolean') return false;
  if (value.working !== undefined && !isTimeIntervalArray(value.working)) return false;
  if (value.breaks !== undefined && !isTimeIntervalArray(value.breaks)) return false;
  if (value.unavailable) return true;
  return validateScheduleIntervals(value.working ?? [], value.breaks ?? []).valid;
}

function isBarber(value: unknown): value is AgendaState['barbers'][number] {
  return isRecord(value) && isString(value.id) && isString(value.name);
}

function isClient(value: unknown): value is ClientRecord {
  return isRecord(value)
    && isString(value.id)
    && isString(value.name)
    && (value.phone === undefined || isString(value.phone))
    && (value.email === undefined || isString(value.email))
    && (value.active === undefined || typeof value.active === 'boolean');
}

function isService(value: unknown): value is ServiceRecord {
  return isRecord(value)
    && isString(value.id)
    && isString(value.name)
    && typeof value.durationMinutes === 'number'
    && Number.isInteger(value.durationMinutes)
    && value.durationMinutes > 0
    && typeof value.price === 'number'
    && Number.isFinite(value.price)
    && value.price >= 0;
}

function isAppointmentStatus(value: unknown): value is AppointmentStatus {
  return value === 'pending' || value === 'confirmed' || value === 'completed' || value === 'cancelled';
}

function isAppointment(value: unknown): value is AppointmentRecord {
  return isRecord(value)
    && isString(value.id)
    && isString(value.startsAt)
    && isString(value.clientId)
    && isString(value.clientName)
    && isString(value.barberId)
    && isString(value.barberName)
    && isStringArray(value.serviceIds)
    && value.serviceIds.length > 0
    && isString(value.serviceName)
    && isAppointmentStatus(value.status)
    && typeof value.durationMinutes === 'number'
    && Number.isInteger(value.durationMinutes)
    && value.durationMinutes > 0
    && (value.notes === undefined || isString(value.notes));
}

function hasUniqueIds(records: Array<{ id: string }>): boolean {
  return new Set(records.map(({ id }) => id)).size === records.length;
}

function isAgendaState(value: unknown): value is AgendaState {
  if (!isRecord(value)
    || !Array.isArray(value.barbers)
    || !Array.isArray(value.clients)
    || !Array.isArray(value.services)
    || !Array.isArray(value.schedules)
    || !Array.isArray(value.exceptions)
    || !Array.isArray(value.appointments)) return false;

  if (!value.barbers.every(isBarber)
    || !value.clients.every(isClient)
    || !value.services.every(isService)
    || !value.schedules.every(isBarberSchedule)
    || !value.exceptions.every(isAvailabilityException)
    || !value.appointments.every(isAppointment)) return false;

  const barberIds = new Set(value.barbers.map(({ id }) => id));
  const clientIds = new Set(value.clients.map(({ id }) => id));
  const serviceIds = new Set(value.services.map(({ id }) => id));
  return hasUniqueIds(value.barbers)
    && hasUniqueIds(value.clients)
    && hasUniqueIds(value.services)
    && hasUniqueIds(value.appointments)
    && value.schedules.every(({ barberId }) => barberIds.has(barberId))
    && value.exceptions.every(({ barberId }) => barberIds.has(barberId))
    && value.appointments.every((appointment) => barberIds.has(appointment.barberId)
      && clientIds.has(appointment.clientId)
      && appointment.serviceIds.every((id) => serviceIds.has(id)));
}

export function saveAgendaState(storage: Pick<Storage, 'setItem'>, state: AgendaState): void {
  const envelope: AgendaStorageEnvelope = { version: AGENDA_STORAGE_VERSION, state };
  storage.setItem(AGENDA_STORAGE_KEY, JSON.stringify(envelope));
}

export function loadAgendaState(
  storage: Pick<Storage, 'getItem' | 'setItem'>,
  now: Date,
): AgendaLoadResult {
  const seed = createAgendaSeed(now);
  let serialized: string | null;
  try {
    serialized = storage.getItem(AGENDA_STORAGE_KEY);
  } catch {
    return { state: seed, status: AGENDA_LOAD_STATUS.INVALID };
  }

  if (serialized === null) {
    try {
      saveAgendaState(storage, seed);
      return { state: seed, status: AGENDA_LOAD_STATUS.SEEDED };
    } catch {
      return { state: seed, status: AGENDA_LOAD_STATUS.INVALID };
    }
  }

  try {
    const parsed: unknown = JSON.parse(serialized);
    if (isRecord(parsed) && parsed.version === AGENDA_STORAGE_VERSION && isAgendaState(parsed.state)) {
      return { state: parsed.state, status: AGENDA_LOAD_STATUS.LOADED };
    }
  } catch {
    // Keep unreadable stored data intact until a deliberate save succeeds.
  }

  return { state: seed, status: AGENDA_LOAD_STATUS.INVALID };
}
