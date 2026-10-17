import type { AppointmentRecord } from './domain';

export interface BarberRecord {
  id: string;
  name: string;
}

export const EMPLOYEE_ROLE = {
  ADMINISTRATOR: 'administrator',
  BARBER: 'barber',
  ASSISTANT: 'assistant',
} as const;

export type EmployeeRole = (typeof EMPLOYEE_ROLE)[keyof typeof EMPLOYEE_ROLE];

export const EMPLOYEE_INVITATION_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
} as const;

export type EmployeeInvitationStatus = (typeof EMPLOYEE_INVITATION_STATUS)[keyof typeof EMPLOYEE_INVITATION_STATUS];

export interface EmployeeRecord {
  id: string;
  name: string;
  phone: string;
  role: EmployeeRole;
  active: boolean;
  invitationStatus: EmployeeInvitationStatus;
}

export interface ClientRecord {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  active?: boolean;
}

export interface ServiceRecord {
  id: string;
  name: string;
  description?: string;
  durationMinutes: number;
  price: number;
  active?: boolean;
}

export interface ProductRecord {
  id: string;
  name: string;
  description: string;
  salePrice: number;
  costPrice?: number;
  stock: number;
  category: string;
  imagePath?: string;
  active: boolean;
}

export const PROMOTION_TARGET_KIND = {
  PRODUCT: 'product',
  SERVICE: 'service',
} as const;

export type PromotionTargetKind = (typeof PROMOTION_TARGET_KIND)[keyof typeof PROMOTION_TARGET_KIND];

export interface PromotionTarget {
  kind: PromotionTargetKind;
  id: string;
  name: string;
  price: number;
}

export const PROMOTION_DISCOUNT_TYPE = {
  PERCENTAGE: 'percentage',
  FIXED_PRICE: 'fixed_price',
} as const;

export type PromotionDiscountType = (typeof PROMOTION_DISCOUNT_TYPE)[keyof typeof PROMOTION_DISCOUNT_TYPE];

export const PROMOTION_MODE = {
  BUNDLE: 'bundle',
  PRODUCT_DISCOUNT: 'product_discount',
} as const;

export type PromotionMode = (typeof PROMOTION_MODE)[keyof typeof PROMOTION_MODE];

export const PROMOTION_MANUAL_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  DISABLED: 'disabled',
} as const;

export type PromotionManualStatus = (typeof PROMOTION_MANUAL_STATUS)[keyof typeof PROMOTION_MANUAL_STATUS];

export interface PromotionRecord {
  id: string;
  name: string;
  description: string;
  mode?: PromotionMode;
  targets: PromotionTarget[];
  discountType: PromotionDiscountType;
  originalPrice: number;
  discountValue: number;
  startsOn: string;
  endsOn: string;
  manualStatus: PromotionManualStatus;
  imagePath?: string;
  conditions?: string;
  unitLimit?: number;
}

export interface AgendaState {
  barbers: BarberRecord[];
  employees?: EmployeeRecord[];
  clients: ClientRecord[];
  services: ServiceRecord[];
  products?: ProductRecord[];
  promotions?: PromotionRecord[];
  schedules: BarberSchedule[];
  exceptions: AvailabilityException[];
  appointments: AppointmentRecord[];
}

export const AGENDA_LOAD_STATUS = {
  LOADED: 'loaded',
  SEEDED: 'seeded',
  INVALID: 'invalid',
} as const;

export type AgendaLoadStatus = (typeof AGENDA_LOAD_STATUS)[keyof typeof AGENDA_LOAD_STATUS];

export interface AgendaLoadResult {
  state: AgendaState;
  status: AgendaLoadStatus;
}

export interface TimeInterval {
  start: string;
  end: string;
}

export interface ScheduledDay {
  weekday: number;
  working: TimeInterval[];
  breaks: TimeInterval[];
}

export interface BarberSchedule {
  barberId: string;
  days: ScheduledDay[];
}

export interface AvailabilityException {
  barberId: string;
  date: string;
  unavailable: boolean;
  working?: TimeInterval[];
  breaks?: TimeInterval[];
}

export interface BookingCandidate {
  id?: string;
  barberId: string;
  startsAt: string;
  durationMinutes: number;
}

export const BOOKING_FAILURE = {
  INVALID_DATE: 'invalid-date',
  INVALID_DURATION: 'invalid-duration',
  INVALID_TIME_INCREMENT: 'invalid-time-increment',
  PAST: 'past',
  BARBER_OFF: 'barber-off',
  INVALID_SCHEDULE: 'invalid-schedule',
  OUTSIDE_WORKING_HOURS: 'outside-working-hours',
  BREAK_CONFLICT: 'break-conflict',
  APPOINTMENT_CONFLICT: 'appointment-conflict',
} as const;

export type BookingFailure = (typeof BOOKING_FAILURE)[keyof typeof BOOKING_FAILURE];

export type BookingValidation =
  | { valid: true }
  | { valid: false; reason: BookingFailure };

export const SCHEDULE_FAILURE = {
  INVALID_INTERVAL: 'invalid-interval',
  OVERLAPPING_WORKING_INTERVALS: 'overlapping-working-intervals',
  BREAK_OUTSIDE_WORKING_HOURS: 'break-outside-working-hours',
  OVERLAPPING_BREAKS: 'overlapping-breaks',
} as const;

export type ScheduleFailure = (typeof SCHEDULE_FAILURE)[keyof typeof SCHEDULE_FAILURE];

export type ScheduleValidation =
  | { valid: true }
  | { valid: false; reason: ScheduleFailure };
