import type { CurrencyCode } from '../types/business-settings';
import { loadBusinessSettings } from './business-settings-store';

export function formatCurrency(amount: number, currency: CurrencyCode): string {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(amount);
}

export function readBusinessCurrency(storage: Pick<Storage, 'getItem'>): CurrencyCode {
  return loadBusinessSettings(storage).settings.currency;
}

export function getCurrentBusinessCurrency(): CurrencyCode {
  if (typeof window === 'undefined') return 'MXN';
  try {
    return readBusinessCurrency(window.localStorage);
  } catch {
    return 'MXN';
  }
}
