export type CurrencyCode = 'MXN' | 'USD' | 'EUR';

export type BusinessWeekday =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export const BUSINESS_WEEKDAYS: readonly BusinessWeekday[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

export type BusinessDayHours =
  | { status: 'unconfigured' }
  | { status: 'closed' }
  | { status: 'open'; opensAt: string; closesAt: string };

export interface BusinessContact {
  name: string;
  address: string;
  phone: string;
  email: string;
}

export interface AdministratorProfile {
  displayName: string;
  email: string;
  phone: string;
}

export type NotificationPreferenceCategory = 'product' | 'service' | 'promotion' | 'general' | 'change';

export const NOTIFICATION_PREFERENCE_CATEGORIES: readonly NotificationPreferenceCategory[] = [
  'product',
  'service',
  'promotion',
  'general',
  'change',
];

export interface BusinessSettings {
  business: BusinessContact;
  administrator: AdministratorProfile;
  hours: Record<BusinessWeekday, BusinessDayHours>;
  currency: CurrencyCode;
  notificationPreferences: Record<NotificationPreferenceCategory, boolean>;
}

export interface BusinessSettingsEnvelope {
  schemaVersion: 1;
  settings: BusinessSettings;
}

export type BusinessSettingsLoadStatus = 'default' | 'loaded' | 'invalid';

export interface BusinessSettingsLoadResult {
  settings: BusinessSettings;
  status: BusinessSettingsLoadStatus;
}
