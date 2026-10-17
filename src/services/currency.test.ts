import { afterEach, describe, expect, it, vi } from 'vitest';
import { BUSINESS_SETTINGS_STORAGE_KEY, createDefaultBusinessSettings } from './business-settings-store';
import { formatCurrency, getCurrentBusinessCurrency, readBusinessCurrency } from './currency';

afterEach(() => localStorage.clear());
afterEach(() => vi.unstubAllGlobals());

describe('formatCurrency', () => {
  it.each(['MXN', 'USD', 'EUR'] as const)('uses es-MX currency formatting for %s', (currency) => {
    const expected = new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(1234.5);

    expect(formatCurrency(1234.5, currency)).toBe(expected);
  });

  it('formats zero and integer values without changing the amount', () => {
    const amount = 550;

    expect(formatCurrency(0, 'MXN')).toBe(new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(0));
    expect(formatCurrency(amount, 'MXN')).toBe(new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount));
    expect(amount).toBe(550);
  });
});

describe('readBusinessCurrency', () => {
  it('defaults to MXN when no business settings have been saved', () => {
    expect(readBusinessCurrency(localStorage)).toBe('MXN');
    expect(localStorage.getItem(BUSINESS_SETTINGS_STORAGE_KEY)).toBeNull();
  });

  it('reads the saved currency without changing any stored numeric value', () => {
    const settings = createDefaultBusinessSettings();
    settings.currency = 'USD';
    localStorage.setItem(BUSINESS_SETTINGS_STORAGE_KEY, JSON.stringify({ schemaVersion: 1, settings }));
    const before = localStorage.getItem(BUSINESS_SETTINGS_STORAGE_KEY);

    expect(readBusinessCurrency(localStorage)).toBe('USD');
    expect(localStorage.getItem(BUSINESS_SETTINGS_STORAGE_KEY)).toBe(before);
  });

  it('falls back to MXN for invalid settings without replacing their bytes', () => {
    const invalid = '{invalid settings';
    localStorage.setItem(BUSINESS_SETTINGS_STORAGE_KEY, invalid);

    expect(readBusinessCurrency(localStorage)).toBe('MXN');
    expect(localStorage.getItem(BUSINESS_SETTINGS_STORAGE_KEY)).toBe(invalid);
  });
});

describe('getCurrentBusinessCurrency', () => {
  it('uses MXN safely when rendered without a browser window', () => {
    vi.stubGlobal('window', undefined);

    expect(getCurrentBusinessCurrency()).toBe('MXN');
  });
});
