import type { AppointmentRecord, AppointmentStatus, SaleRecord } from '../types/domain';
import { AGENDA_LOAD_STATUS, EMPLOYEE_INVITATION_STATUS, EMPLOYEE_ROLE, type AgendaLoadResult, type AgendaState, type AvailabilityException, type BarberSchedule, type ClientRecord, type EmployeeRecord, type ProductRecord, type PromotionRecord, type ServiceRecord, type TimeInterval } from '../types/agenda';
import { createAgendaSeed } from '../data/agenda-demo';
import { validateScheduleIntervals } from './availability';
import { normalizeEmployees, syncBarberProjection } from './employees';
import { validatePromotion } from './promotions';

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

function isEmployeeRole(value: unknown): value is EmployeeRecord['role'] {
  return value === EMPLOYEE_ROLE.ADMINISTRATOR
    || value === EMPLOYEE_ROLE.BARBER
    || value === EMPLOYEE_ROLE.ASSISTANT;
}

function isEmployeeInvitationStatus(value: unknown): value is EmployeeRecord['invitationStatus'] {
  return value === EMPLOYEE_INVITATION_STATUS.PENDING
    || value === EMPLOYEE_INVITATION_STATUS.COMPLETED;
}

function isEmployee(value: unknown): value is EmployeeRecord {
  return isRecord(value)
    && isString(value.id)
    && value.id.length > 0
    && isString(value.name)
    && value.name.trim().length > 0
    && isString(value.phone)
    && isEmployeeRole(value.role)
    && typeof value.active === 'boolean'
    && isEmployeeInvitationStatus(value.invitationStatus);
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
    && (value.description === undefined || isString(value.description))
    && typeof value.durationMinutes === 'number'
    && Number.isInteger(value.durationMinutes)
    && value.durationMinutes > 0
    && typeof value.price === 'number'
    && Number.isFinite(value.price)
    && value.price >= 0
    && (value.active === undefined || typeof value.active === 'boolean');
}

function isProduct(value: unknown): value is ProductRecord {
  return isRecord(value)
    && isString(value.id)
    && value.id.length > 0
    && isString(value.name)
    && value.name.trim().length > 0
    && isString(value.description)
    && typeof value.salePrice === 'number'
    && Number.isFinite(value.salePrice)
    && value.salePrice >= 0
    && (value.costPrice === undefined || (typeof value.costPrice === 'number'
      && Number.isFinite(value.costPrice) && value.costPrice >= 0))
    && typeof value.stock === 'number'
    && Number.isInteger(value.stock)
    && value.stock >= 0
    && isString(value.category)
    && value.category.trim().length > 0
    && (value.imagePath === undefined || isString(value.imagePath))
    && typeof value.active === 'boolean';
}

function isPromotion(value: unknown): value is PromotionRecord {
  return validatePromotion(value).valid;
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
    && (value.paymentStatus === undefined || value.paymentStatus === 'pending' || value.paymentStatus === 'paid')
    && typeof value.durationMinutes === 'number'
    && Number.isInteger(value.durationMinutes)
    && value.durationMinutes > 0
    && (value.notes === undefined || isString(value.notes));
}

function isSaleRecord(value: unknown): value is SaleRecord {
  if (!isRecord(value)
    || !isString(value.id) || value.id.trim().length === 0
    || !isString(value.occurredAt) || !Number.isFinite(new Date(value.occurredAt).getTime())
    || !Array.isArray(value.items) || value.items.length === 0
    || !value.items.every((item) => isRecord(item)
      && (item.kind === undefined || item.kind === 'product' || item.kind === 'service')
      && (item.catalogItemId === undefined || isString(item.catalogItemId))
      && (item.barberId === undefined || isString(item.barberId))
      && (item.barberName === undefined || isString(item.barberName))
      && (item.servicePerformed === undefined || typeof item.servicePerformed === 'boolean')
      && isString(item.name) && item.name.trim().length > 0
      && typeof item.quantity === 'number' && Number.isInteger(item.quantity) && item.quantity > 0
      && typeof item.unitPrice === 'number' && Number.isFinite(item.unitPrice) && item.unitPrice >= 0)
    || typeof value.grossTotal !== 'number' || !Number.isFinite(value.grossTotal) || value.grossTotal < 0
    || typeof value.discountTotal !== 'number' || !Number.isFinite(value.discountTotal) || value.discountTotal < 0
    || typeof value.netTotal !== 'number' || !Number.isFinite(value.netTotal) || value.netTotal < 0
    || Math.abs(value.netTotal - (value.grossTotal - value.discountTotal)) > 0.01) return false;

  return (value.idempotencyKey === undefined || (isString(value.idempotencyKey) && value.idempotencyKey.trim().length > 0))
    && (value.appointmentId === undefined || isString(value.appointmentId))
    && (value.clientId === undefined || isString(value.clientId))
    && (value.clientName === undefined || isString(value.clientName))
    && (value.barberName === undefined || isString(value.barberName))
    && (value.employeeId === undefined || isString(value.employeeId))
    && (value.employeeName === undefined || isString(value.employeeName))
    && (value.paymentMethod === undefined || value.paymentMethod === 'cash' || value.paymentMethod === 'card' || value.paymentMethod === 'transfer')
    && (value.status === undefined || value.status === 'completed')
    && (value.promotionId === undefined || isString(value.promotionId))
    && (value.promotionName === undefined || isString(value.promotionName))
    && (value.cashReceived === undefined || (typeof value.cashReceived === 'number' && Number.isFinite(value.cashReceived) && value.cashReceived >= 0))
    && (value.changeDue === undefined || (typeof value.changeDue === 'number' && Number.isFinite(value.changeDue) && value.changeDue >= 0));
}

function hasUniqueIds(records: Array<{ id: string }>): boolean {
  return new Set(records.map(({ id }) => id)).size === records.length;
}

function isAgendaState(value: unknown): value is AgendaState {
  if (!isRecord(value)
    || !Array.isArray(value.barbers)
    || (value.employees !== undefined && !Array.isArray(value.employees))
    || (value.products !== undefined && !Array.isArray(value.products))
    || (value.promotions !== undefined && !Array.isArray(value.promotions))
    || (value.sales !== undefined && !Array.isArray(value.sales))
    || !Array.isArray(value.clients)
    || !Array.isArray(value.services)
    || !Array.isArray(value.schedules)
    || !Array.isArray(value.exceptions)
    || !Array.isArray(value.appointments)) return false;

  if (!value.barbers.every(isBarber)
    || (value.employees !== undefined && !value.employees.every(isEmployee))
    || (value.products !== undefined && !value.products.every(isProduct))
    || (value.promotions !== undefined && !value.promotions.every(isPromotion))
    || (value.sales !== undefined && !value.sales.every(isSaleRecord))
    || !value.clients.every(isClient)
    || !value.services.every(isService)
    || !value.schedules.every(isBarberSchedule)
    || !value.exceptions.every(isAvailabilityException)
    || !value.appointments.every(isAppointment)) return false;

  const barberIds = new Set(value.barbers.map(({ id }) => id));
  const employees = (value.employees ?? []) as EmployeeRecord[];
  const products = (value.products ?? []) as ProductRecord[];
  const promotions = (value.promotions ?? []) as PromotionRecord[];
  const sales = (value.sales ?? []) as SaleRecord[];
  const appointments = value.appointments as AppointmentRecord[];
  const clientIds = new Set(value.clients.map(({ id }) => id));
  const serviceIds = new Set(value.services.map(({ id }) => id));
  return hasUniqueIds(value.barbers)
    && hasUniqueIds(employees)
    && hasUniqueIds(products)
    && hasUniqueIds(promotions)
    && hasUniqueIds(sales)
    && new Set(sales.flatMap(({ idempotencyKey }) => idempotencyKey ? [idempotencyKey] : [])).size
      === sales.filter(({ idempotencyKey }) => idempotencyKey !== undefined).length
    && employees.every((employee) => employee.role !== EMPLOYEE_ROLE.BARBER || barberIds.has(employee.id))
    && hasUniqueIds(value.clients)
    && hasUniqueIds(value.services)
    && hasUniqueIds(value.appointments)
    && value.schedules.every(({ barberId }) => barberIds.has(barberId))
    && value.exceptions.every(({ barberId }) => barberIds.has(barberId))
    && value.appointments.every((appointment) => barberIds.has(appointment.barberId)
      && clientIds.has(appointment.clientId)
      && appointment.serviceIds.every((id) => serviceIds.has(id)))
    && sales.every((sale) => sale.appointmentId === undefined || appointments.some(({ id }) => id === sale.appointmentId));
}

export function saveAgendaState(storage: Pick<Storage, 'setItem'>, state: AgendaState): void {
  if ((state.sales !== undefined && (!Array.isArray(state.sales)
    || !state.sales.every(isSaleRecord)
    || hasDuplicateIdempotencyKeys(state.sales)))
    || state.appointments.some(({ paymentStatus }) => paymentStatus !== undefined
      && paymentStatus !== 'pending' && paymentStatus !== 'paid')) {
    throw new Error('Cannot save invalid sale or appointment payment data.');
  }
  if (state.promotions !== undefined
    && (!Array.isArray(state.promotions)
      || !state.promotions.every((promotion) => validatePromotion(promotion).valid)
      || new Set(state.promotions.map(({ id }) => id)).size !== state.promotions.length)) {
    throw new Error('Cannot save invalid promotion data.');
  }
  const employees = normalizeEmployees(state.employees, state.barbers);
  const normalizedState: AgendaState = {
    ...state,
    employees,
    barbers: syncBarberProjection(employees, state.barbers),
  };
  const envelope: AgendaStorageEnvelope = { version: AGENDA_STORAGE_VERSION, state: normalizedState };
  storage.setItem(AGENDA_STORAGE_KEY, JSON.stringify(envelope));
}

function hasDuplicateIdempotencyKeys(sales: SaleRecord[]): boolean {
  const keys = sales.flatMap(({ idempotencyKey }) => idempotencyKey ? [idempotencyKey] : []);
  return new Set(keys).size !== keys.length;
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
      return {
        state: {
          ...parsed.state,
          employees: normalizeEmployees(parsed.state.employees, parsed.state.barbers),
        },
        status: AGENDA_LOAD_STATUS.LOADED,
      };
    }
  } catch {
    // Keep unreadable stored data intact until a deliberate save succeeds.
  }

  return { state: seed, status: AGENDA_LOAD_STATUS.INVALID };
}
