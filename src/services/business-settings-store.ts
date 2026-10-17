import {
  BUSINESS_WEEKDAYS,
  NOTIFICATION_PREFERENCE_CATEGORIES,
  type BusinessDayHours,
  type BusinessSettings,
  type BusinessSettingsSection,
  type BusinessSettingsEnvelope,
  type BusinessSettingsLoadResult,
  type CurrencyCode,
} from '../types/business-settings';

export const BUSINESS_SETTINGS_STORAGE_KEY = 'webbys:business-settings:v1';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStringRecord(value: unknown, keys: string[]): value is Record<string, string> {
  return isRecord(value) && keys.every((key) => typeof value[key] === 'string');
}

function isTime(value: unknown): value is string {
  return typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function isBusinessDayHours(value: unknown): value is BusinessDayHours {
  if (!isRecord(value)) return false;
  if (value.status === 'unconfigured' || value.status === 'closed') return true;
  return value.status === 'open'
    && isTime(value.opensAt)
    && isTime(value.closesAt)
    && value.closesAt > value.opensAt;
}

function isCurrencyCode(value: unknown): value is CurrencyCode {
  return value === 'MXN' || value === 'USD' || value === 'EUR';
}

function isNotificationPreferences(value: unknown): value is BusinessSettings['notificationPreferences'] {
  return isRecord(value)
    && NOTIFICATION_PREFERENCE_CATEGORIES.every((category) => typeof value[category] === 'boolean');
}

export function createDefaultBusinessSettings(): BusinessSettings {
  const hours = Object.fromEntries(
    BUSINESS_WEEKDAYS.map((weekday) => [weekday, { status: 'unconfigured' }]),
  ) as BusinessSettings['hours'];

  return {
    business: { name: "Webby's Barbershop", address: '', phone: '', email: '' },
    administrator: { displayName: '', email: '', phone: '' },
    hours,
    currency: 'MXN',
    notificationPreferences: {
      product: false,
      service: false,
      promotion: false,
      general: false,
      change: false,
    },
  };
}

export function validateBusinessSettings(value: unknown): value is BusinessSettings {
  if (!isRecord(value)) return false;
  const { business, administrator, hours, currency, notificationPreferences } = value;

  if (!isStringRecord(business, ['name', 'address', 'phone', 'email'])
    || !business.name.trim()
    || !isStringRecord(administrator, ['displayName', 'email', 'phone'])
    || !isRecord(hours)
    || !BUSINESS_WEEKDAYS.every((weekday) => isBusinessDayHours(hours[weekday]))
    || !isCurrencyCode(currency)
    || !isNotificationPreferences(notificationPreferences)) return false;

  return true;
}

function isEnvelope(value: unknown): value is BusinessSettingsEnvelope {
  return isRecord(value)
    && value.schemaVersion === 1
    && validateBusinessSettings(value.settings);
}

export function loadBusinessSettings(storage: Pick<Storage, 'getItem'>): BusinessSettingsLoadResult {
  let serialized: string | null;
  try {
    serialized = storage.getItem(BUSINESS_SETTINGS_STORAGE_KEY);
  } catch {
    return { settings: createDefaultBusinessSettings(), status: 'invalid' };
  }
  if (serialized === null) return { settings: createDefaultBusinessSettings(), status: 'default' };

  try {
    const envelope: unknown = JSON.parse(serialized);
    if (isEnvelope(envelope)) return { settings: envelope.settings, status: 'loaded' };
  } catch {
    // Preserve invalid bytes until a valid settings save is explicitly requested.
  }
  return { settings: createDefaultBusinessSettings(), status: 'invalid' };
}

export function saveBusinessSettings(storage: Pick<Storage, 'setItem'>, settings: BusinessSettings): void {
  if (!validateBusinessSettings(settings)) throw new Error('Revisa los datos de configuración.');

  const envelope: BusinessSettingsEnvelope = { schemaVersion: 1, settings };
  storage.setItem(BUSINESS_SETTINGS_STORAGE_KEY, JSON.stringify(envelope));
}

export function saveBusinessSettingsSection(
  storage: Pick<Storage, 'getItem' | 'setItem'>,
  draft: BusinessSettings,
  section: BusinessSettingsSection,
): void {
  const stored = loadBusinessSettings(storage);
  if (stored.status === 'invalid') {
    throw new Error('No se pueden guardar los cambios hasta revisar los datos guardados.');
  }
  saveBusinessSettings(storage, { ...stored.settings, [section]: draft[section] });
}
