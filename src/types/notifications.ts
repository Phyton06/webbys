export const NOTIFICATION_CATEGORY = {
  PRODUCT: 'product',
  SERVICE: 'service',
  PROMOTION: 'promotion',
  GENERAL: 'general',
  CHANGE: 'change',
} as const;

export type NotificationCategory = (typeof NOTIFICATION_CATEGORY)[keyof typeof NOTIFICATION_CATEGORY];

export const NOTIFICATION_STATUS = {
  DRAFT: 'draft',
  SCHEDULED: 'scheduled',
  SIMULATED: 'simulated',
} as const;

export type NotificationStatus = (typeof NOTIFICATION_STATUS)[keyof typeof NOTIFICATION_STATUS];

export const NOTIFICATION_RECIPIENT_KIND = {
  CLIENTS: 'clients',
  EMPLOYEES: 'employees',
} as const;

export type NotificationRecipientKind = (typeof NOTIFICATION_RECIPIENT_KIND)[keyof typeof NOTIFICATION_RECIPIENT_KIND];

export const NOTIFICATION_SEGMENT = {
  ALL_ACTIVE: 'all-active',
  SELECTED: 'selected',
  BARBERS: 'barbers',
  ASSISTANTS: 'assistants',
  ADMINISTRATORS: 'administrators',
} as const;

export type NotificationAudienceSegment = (typeof NOTIFICATION_SEGMENT)[keyof typeof NOTIFICATION_SEGMENT];

export interface NotificationRecipient {
  id: string;
  name: string;
}

export interface NotificationAudience {
  recipientKind: NotificationRecipientKind;
  segment: NotificationAudienceSegment;
  recipients: NotificationRecipient[];
}

export interface NotificationRecord {
  id: string;
  title: string;
  body: string;
  category: NotificationCategory;
  audience: NotificationAudience;
  createdAt: string;
  status: NotificationStatus;
  scheduledFor?: string;
  simulatedAt?: string;
}

export interface NotificationEnvelope {
  schemaVersion: 1;
  notifications: NotificationRecord[];
}
