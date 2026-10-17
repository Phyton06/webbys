import type { ClientRecord, EmployeeRecord } from '../types/agenda';
import { EMPLOYEE_ROLE } from '../types/agenda';
import {
  NOTIFICATION_CATEGORY,
  NOTIFICATION_RECIPIENT_KIND,
  NOTIFICATION_SEGMENT,
  NOTIFICATION_STATUS,
  type NotificationAudience,
  type NotificationEnvelope,
  type NotificationAudienceSegment,
  type NotificationRecord,
  type NotificationRecipientKind,
  type NotificationRecipient,
} from '../types/notifications';

export const NOTIFICATIONS_STORAGE_KEY = 'webbys:notifications:v1';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isDateTime(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(new Date(value).getTime());
}

function isAudienceSegment(value: unknown): value is NotificationAudienceSegment {
  return value === NOTIFICATION_SEGMENT.ALL_ACTIVE
    || value === NOTIFICATION_SEGMENT.SELECTED
    || value === NOTIFICATION_SEGMENT.BARBERS
    || value === NOTIFICATION_SEGMENT.ASSISTANTS
    || value === NOTIFICATION_SEGMENT.ADMINISTRATORS;
}

function isNotificationAudience(value: unknown): value is NotificationAudience {
  if (!isRecord(value)
    || (value.recipientKind !== NOTIFICATION_RECIPIENT_KIND.CLIENTS && value.recipientKind !== NOTIFICATION_RECIPIENT_KIND.EMPLOYEES)
    || !isAudienceSegment(value.segment)
    || !Array.isArray(value.recipients)
    || value.recipients.length === 0) return false;

  if (value.recipientKind === NOTIFICATION_RECIPIENT_KIND.CLIENTS
    && value.segment !== NOTIFICATION_SEGMENT.ALL_ACTIVE && value.segment !== NOTIFICATION_SEGMENT.SELECTED) return false;

  const recipients: NotificationRecipient[] = [];
  for (const recipient of value.recipients) {
    if (!isRecord(recipient) || typeof recipient.id !== 'string' || !recipient.id.trim()
      || typeof recipient.name !== 'string' || !recipient.name.trim()) return false;
    recipients.push({ id: recipient.id, name: recipient.name });
  }
  return new Set(recipients.map(({ id }) => id)).size === recipients.length;
}

export function validateNotification(value: unknown, _now: Date = new Date()): value is NotificationRecord {
  if (!isRecord(value)
    || typeof value.id !== 'string' || !value.id.trim()
    || typeof value.title !== 'string' || !value.title.trim()
    || typeof value.body !== 'string' || !value.body.trim()
    || (value.category !== NOTIFICATION_CATEGORY.PRODUCT && value.category !== NOTIFICATION_CATEGORY.SERVICE
      && value.category !== NOTIFICATION_CATEGORY.PROMOTION && value.category !== NOTIFICATION_CATEGORY.GENERAL
      && value.category !== NOTIFICATION_CATEGORY.CHANGE)
    || !isNotificationAudience(value.audience)
    || !isDateTime(value.createdAt)
    || (value.scheduledFor !== undefined && !isDateTime(value.scheduledFor))
    || (value.simulatedAt !== undefined && !isDateTime(value.simulatedAt))
    || (value.status !== NOTIFICATION_STATUS.DRAFT && value.status !== NOTIFICATION_STATUS.SCHEDULED
      && value.status !== NOTIFICATION_STATUS.SIMULATED)) return false;

  if (value.status === NOTIFICATION_STATUS.SCHEDULED && value.scheduledFor === undefined) return false;
  if (value.status === NOTIFICATION_STATUS.SIMULATED && value.simulatedAt === undefined) return false;
  return true;
}

export function loadNotifications(storage: Storage): NotificationRecord[] {
  let serialized: string | null;
  try {
    serialized = storage.getItem(NOTIFICATIONS_STORAGE_KEY);
  } catch {
    return [];
  }
  if (serialized === null) return [];

  try {
    const envelope: unknown = JSON.parse(serialized);
    if (!isRecord(envelope) || envelope.schemaVersion !== 1 || !Array.isArray(envelope.notifications)
      || !envelope.notifications.every((item) => validateNotification(item))) return [];
    return envelope.notifications;
  } catch {
    return [];
  }
}

export function saveNotifications(storage: Storage, notifications: NotificationRecord[]): void {
  if (!notifications.every((notification) => validateNotification(notification))) {
    throw new Error('Revisa el contenido, los destinatarios y las fechas de la notificación.');
  }
  const envelope: NotificationEnvelope = { schemaVersion: 1, notifications };
  storage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(envelope));
}

export function resolveNotificationAudience(
  recipientKind: NotificationRecipientKind,
  segment: NotificationAudienceSegment,
  recipientIds: string[],
  clients: ClientRecord[],
  employees: EmployeeRecord[],
): NotificationRecipient[] {
  const selectedIds = new Set(recipientIds);
  if (recipientKind === NOTIFICATION_RECIPIENT_KIND.CLIENTS) {
    if (segment !== NOTIFICATION_SEGMENT.ALL_ACTIVE && segment !== NOTIFICATION_SEGMENT.SELECTED) {
      throw new Error('El segmento elegido no corresponde a clientes.');
    }
    return clients
      .filter((client) => client.active !== false
        && (segment === NOTIFICATION_SEGMENT.ALL_ACTIVE || selectedIds.has(client.id)))
      .map(({ id, name }) => ({ id, name }));
  }

  return employees
    .filter((employee) => employee.active
      && (segment === NOTIFICATION_SEGMENT.ALL_ACTIVE
        || (segment === NOTIFICATION_SEGMENT.SELECTED && selectedIds.has(employee.id))
        || (segment === NOTIFICATION_SEGMENT.BARBERS && employee.role === EMPLOYEE_ROLE.BARBER)
        || (segment === NOTIFICATION_SEGMENT.ASSISTANTS && employee.role === EMPLOYEE_ROLE.ASSISTANT)
        || (segment === NOTIFICATION_SEGMENT.ADMINISTRATORS && employee.role === EMPLOYEE_ROLE.ADMINISTRATOR)))
    .map(({ id, name }) => ({ id, name }));
}
