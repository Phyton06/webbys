import { afterEach, describe, expect, it } from 'vitest';
import { EMPLOYEE_ROLE, type ClientRecord, type EmployeeRecord } from '../types/agenda';
import {
  NOTIFICATION_CATEGORY,
  NOTIFICATION_RECIPIENT_KIND,
  NOTIFICATION_SEGMENT,
  NOTIFICATION_STATUS,
  type NotificationRecord,
} from '../types/notifications';
import { loadNotifications, resolveNotificationAudience, saveNotifications, validateNotification } from './notifications-store';

const now = new Date('2026-10-17T12:00:00.000Z');

function notification(overrides: Partial<NotificationRecord> = {}): NotificationRecord {
  return {
    id: 'notification-1',
    title: 'Nuevo servicio',
    body: 'Conoce el nuevo servicio de barba.',
    category: NOTIFICATION_CATEGORY.SERVICE,
    audience: {
      recipientKind: NOTIFICATION_RECIPIENT_KIND.CLIENTS,
      segment: NOTIFICATION_SEGMENT.ALL_ACTIVE,
      recipients: [{ id: 'client-1', name: 'Lucía Torres' }],
    },
    createdAt: '2026-10-17T11:00:00.000Z',
    status: NOTIFICATION_STATUS.DRAFT,
    ...overrides,
  };
}

const clients: ClientRecord[] = [
  { id: 'client-1', name: 'Lucía Torres', active: true, phone: '555-0101' },
  { id: 'client-2', name: 'Mateo Cruz', active: true, phone: '555-0102' },
  { id: 'client-3', name: 'Inés Ríos', active: false, phone: '555-0103' },
];

const employees: EmployeeRecord[] = [
  { id: 'employee-admin', name: 'Admin', phone: '', role: EMPLOYEE_ROLE.ADMINISTRATOR, active: true, invitationStatus: 'completed' },
  { id: 'employee-barber', name: 'Diego', phone: '', role: EMPLOYEE_ROLE.BARBER, active: true, invitationStatus: 'completed' },
  { id: 'employee-assistant', name: 'Raúl', phone: '', role: EMPLOYEE_ROLE.ASSISTANT, active: true, invitationStatus: 'pending' },
  { id: 'employee-inactive', name: 'Inactive', phone: '', role: EMPLOYEE_ROLE.BARBER, active: false, invitationStatus: 'completed' },
];

afterEach(() => localStorage.clear());

describe('validateNotification', () => {
  it('accepts valid draft, scheduled, and simulated records', () => {
    expect(validateNotification(notification(), now)).toBe(true);
    expect(validateNotification(notification({ status: NOTIFICATION_STATUS.SCHEDULED, scheduledFor: '2026-10-20T15:00:00.000Z' }), now)).toBe(true);
    expect(validateNotification(notification({ status: NOTIFICATION_STATUS.SIMULATED, simulatedAt: '2026-10-17T12:00:00.000Z' }), now)).toBe(true);
  });

  it('rejects empty content, invalid audience snapshots, and inconsistent status timestamps', () => {
    expect(validateNotification(notification({ title: '  ' }), now)).toBe(false);
    expect(validateNotification(notification({ body: '' }), now)).toBe(false);
    expect(validateNotification(notification({ audience: { ...notification().audience, recipients: [] } }), now)).toBe(false);
    expect(validateNotification(notification({ status: NOTIFICATION_STATUS.SCHEDULED }), now)).toBe(false);
    expect(validateNotification(notification({ status: NOTIFICATION_STATUS.SIMULATED }), now)).toBe(false);
  });
});

describe('resolveNotificationAudience', () => {
  it('returns active clients or selected active clients without exposing contact details', () => {
    expect(resolveNotificationAudience(NOTIFICATION_RECIPIENT_KIND.CLIENTS, NOTIFICATION_SEGMENT.ALL_ACTIVE, [], clients, employees)).toEqual([
      { id: 'client-1', name: 'Lucía Torres' },
      { id: 'client-2', name: 'Mateo Cruz' },
    ]);
    expect(resolveNotificationAudience(NOTIFICATION_RECIPIENT_KIND.CLIENTS, NOTIFICATION_SEGMENT.SELECTED, ['client-2', 'client-3'], clients, employees)).toEqual([
      { id: 'client-2', name: 'Mateo Cruz' },
    ]);
  });

  it('resolves employee role segments and active selected employees', () => {
    expect(resolveNotificationAudience(NOTIFICATION_RECIPIENT_KIND.EMPLOYEES, NOTIFICATION_SEGMENT.BARBERS, [], clients, employees)).toEqual([
      { id: 'employee-barber', name: 'Diego' },
    ]);
    expect(resolveNotificationAudience(NOTIFICATION_RECIPIENT_KIND.EMPLOYEES, NOTIFICATION_SEGMENT.SELECTED, ['employee-admin', 'employee-inactive'], clients, employees)).toEqual([
      { id: 'employee-admin', name: 'Admin' },
    ]);
  });

  it('rejects role-only segments for client audiences', () => {
    expect(() => resolveNotificationAudience(NOTIFICATION_RECIPIENT_KIND.CLIENTS, NOTIFICATION_SEGMENT.BARBERS, [], clients, employees)).toThrow();
  });
});

describe('notifications localStorage envelope', () => {
  it('loads a versioned notification envelope without rewriting its bytes', () => {
    const record = notification();
    saveNotifications(localStorage, [record]);
    const bytes = localStorage.getItem('webbys:notifications:v1');

    expect(loadNotifications(localStorage)).toEqual([record]);
    expect(localStorage.getItem('webbys:notifications:v1')).toBe(bytes);
  });

  it('does not rewrite corrupt bytes or overwrite them after a rejected save', () => {
    const corrupt = '{bad notification data';
    localStorage.setItem('webbys:notifications:v1', corrupt);

    expect(loadNotifications(localStorage)).toEqual([]);
    expect(localStorage.getItem('webbys:notifications:v1')).toBe(corrupt);
    expect(() => saveNotifications(localStorage, [notification({ title: '' })])).toThrow();
    expect(localStorage.getItem('webbys:notifications:v1')).toBe(corrupt);
  });
});
