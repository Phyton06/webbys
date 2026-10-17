import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  BUSINESS_WEEKDAYS,
  type BusinessSettings,
  type BusinessWeekday,
} from '../types/business-settings';
import {
  BUSINESS_SETTINGS_STORAGE_KEY,
  createDefaultBusinessSettings,
  loadBusinessSettings,
  saveBusinessSettings,
  saveBusinessSettingsSection,
  validateBusinessSettings,
} from './business-settings-store';

afterEach(() => localStorage.clear());

describe('createDefaultBusinessSettings', () => {
  it('uses the visible business identity, MXN, unset hours, and opt-in notification preferences', () => {
    const defaults = createDefaultBusinessSettings();

    expect(defaults.business.name).toBe("Webby's Barbershop");
    expect(defaults.business.address).toBe('');
    expect(defaults.business.phone).toBe('');
    expect(defaults.business.email).toBe('');
    expect(defaults.administrator).toEqual({ displayName: '', email: '', phone: '' });
    expect(defaults.currency).toBe('MXN');
    expect(BUSINESS_WEEKDAYS.every((weekday) => defaults.hours[weekday].status === 'unconfigured')).toBe(true);
    expect(Object.values(defaults.notificationPreferences).every((enabled) => !enabled)).toBe(true);
  });
});

describe('validateBusinessSettings', () => {
  it('accepts a complete open, closed, and unconfigured weekday configuration', () => {
    const settings = createDefaultBusinessSettings();
    const [monday, tuesday] = BUSINESS_WEEKDAYS;
    settings.hours[monday] = { status: 'open', opensAt: '09:00', closesAt: '18:00' };
    settings.hours[tuesday] = { status: 'closed' };

    expect(validateBusinessSettings(settings)).toBe(true);
  });

  it.each([
    { name: 'currency code', change: (settings: BusinessSettings) => { settings.currency = 'CAD' as BusinessSettings['currency']; } },
    { name: 'invalid time', change: (settings: BusinessSettings) => { settings.hours.monday = { status: 'open', opensAt: '9am', closesAt: '18:00' }; } },
    { name: 'non-increasing hours', change: (settings: BusinessSettings) => { settings.hours.monday = { status: 'open', opensAt: '18:00', closesAt: '09:00' }; } },
    { name: 'missing weekday', change: (settings: BusinessSettings) => { delete (settings.hours as Partial<Record<BusinessWeekday, unknown>>).sunday; } },
    { name: 'invalid profile field', change: (settings: BusinessSettings) => { settings.business.phone = 55 as unknown as string; } },
    { name: 'invalid preference value', change: (settings: BusinessSettings) => { settings.notificationPreferences.product = 'yes' as unknown as boolean; } },
  ])('rejects $name', ({ change }) => {
    const settings = createDefaultBusinessSettings();
    change(settings);

    expect(validateBusinessSettings(settings)).toBe(false);
  });
});

describe('loadBusinessSettings', () => {
  it('returns defaults for a missing key without writing localStorage', () => {
    const result = loadBusinessSettings(localStorage);

    expect(result).toEqual({ settings: createDefaultBusinessSettings(), status: 'default' });
    expect(localStorage.getItem(BUSINESS_SETTINGS_STORAGE_KEY)).toBeNull();
  });

  it('loads the supported schema version', () => {
    const settings = createDefaultBusinessSettings();
    localStorage.setItem(BUSINESS_SETTINGS_STORAGE_KEY, JSON.stringify({ schemaVersion: 1, settings }));

    expect(loadBusinessSettings(localStorage)).toEqual({ settings, status: 'loaded' });
  });

  it.each([
    ['corrupt JSON', '{broken'],
    ['unknown version', JSON.stringify({ schemaVersion: 2, settings: createDefaultBusinessSettings() })],
    ['invalid settings', JSON.stringify({ schemaVersion: 1, settings: { currency: 'MXN' } })],
  ])('returns invalid defaults and preserves bytes for %s', (_name, bytes) => {
    localStorage.setItem(BUSINESS_SETTINGS_STORAGE_KEY, bytes);

    expect(loadBusinessSettings(localStorage)).toMatchObject({ status: 'invalid' });
    expect(localStorage.getItem(BUSINESS_SETTINGS_STORAGE_KEY)).toBe(bytes);
  });

  it('returns invalid defaults when storage reading throws', () => {
    const storage = { getItem: vi.fn(() => { throw new Error('unavailable'); }) };

    expect(loadBusinessSettings(storage)).toEqual({ settings: createDefaultBusinessSettings(), status: 'invalid' });
  });
});

describe('saveBusinessSettings', () => {
  it('saves a valid envelope and reloads the same settings', () => {
    const settings = createDefaultBusinessSettings();
    settings.business.name = 'Barbería Central';
    settings.notificationPreferences.promotion = true;

    saveBusinessSettings(localStorage, settings);

    expect(JSON.parse(localStorage.getItem(BUSINESS_SETTINGS_STORAGE_KEY) ?? 'null')).toEqual({ schemaVersion: 1, settings });
    expect(loadBusinessSettings(localStorage)).toEqual({ settings, status: 'loaded' });
  });

  it('rejects invalid settings without changing existing bytes', () => {
    const before = '{existing bytes remain intact';
    localStorage.setItem(BUSINESS_SETTINGS_STORAGE_KEY, before);
    const invalid = { ...createDefaultBusinessSettings(), currency: 'CAD' as BusinessSettings['currency'] };

    expect(() => saveBusinessSettings(localStorage, invalid)).toThrow('Revisa los datos de configuración.');
    expect(localStorage.getItem(BUSINESS_SETTINGS_STORAGE_KEY)).toBe(before);
  });

  it('propagates a storage write failure without reporting success', () => {
    const storage = { setItem: vi.fn(() => { throw new Error('quota exceeded'); }) };

    expect(() => saveBusinessSettings(storage, createDefaultBusinessSettings())).toThrow('quota exceeded');
    expect(storage.setItem).toHaveBeenCalledOnce();
  });
});

describe('saveBusinessSettingsSection', () => {
  it('updates one category and preserves the last saved values in all other categories', () => {
    const persisted = createDefaultBusinessSettings();
    persisted.business.name = 'Negocio guardado';
    persisted.currency = 'USD';
    persisted.notificationPreferences.promotion = true;
    saveBusinessSettings(localStorage, persisted);

    const draft = createDefaultBusinessSettings();
    draft.business.name = 'Borrador del negocio';
    draft.currency = 'EUR';
    draft.notificationPreferences.promotion = false;
    saveBusinessSettingsSection(localStorage, draft, 'business');

    expect(loadBusinessSettings(localStorage).settings.business.name).toBe('Borrador del negocio');
    expect(loadBusinessSettings(localStorage).settings.currency).toBe('USD');
    expect(loadBusinessSettings(localStorage).settings.notificationPreferences.promotion).toBe(true);
  });

  it('preserves corrupt bytes rather than replacing another category save', () => {
    const corrupt = '{unreadable business data';
    localStorage.setItem(BUSINESS_SETTINGS_STORAGE_KEY, corrupt);

    expect(() => saveBusinessSettingsSection(localStorage, createDefaultBusinessSettings(), 'currency')).toThrow();
    expect(localStorage.getItem(BUSINESS_SETTINGS_STORAGE_KEY)).toBe(corrupt);
  });
});
